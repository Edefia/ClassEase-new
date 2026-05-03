// services/lectureSchedulingEngine.js
// Greedy Assignment with Constraint Scoring and Backtracking
import Course from '../models/Course.js';
import Venue from '../models/Venue.js';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';
import TimetableEntry from '../models/TimetableEntry.js';
import SchedulingRun from '../models/SchedulingRun.js';
import Semester from '../models/Semester.js';

/**
 * Main lecture scheduling engine.
 * @param {string} semesterId - The semester ObjectId
 * @param {object} options - { mode: 'semi_auto' | 'auto_pilot', userId: string }
 * @returns {object} Scheduling result with entries, summary, failures, violations
 */
export async function generateLectureTimetable(semesterId, options = {}) {
  const startTime = Date.now();
  const { mode = 'semi_auto', userId } = options;

  // ──────────────────────────────────────────
  // STEP 1 — LOAD ALL DATA
  // ──────────────────────────────────────────
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new Error('Semester not found');

  const courses = await Course.find({
    $or: [
      { semesterRef: semesterId },
      { semester: semester.name.toLowerCase().includes('first') ? 'first' : semester.name.toLowerCase().includes('second') ? 'second' : 'summer', academicYear: semester.academicYear },
    ],
    isActive: true,
  })
    .populate('department', 'name code')
    .populate('lecturer', 'name email');

  if (courses.length === 0) throw new Error('No courses found for this semester');

  // Get all available venues (not under maintenance during semester)
  const allVenues = await Venue.find({ isAvailable: true });
  const venues = allVenues.filter((v) => {
    // Exclude venues with maintenance overlapping the semester
    return !v.maintenancePeriods.some((mp) =>
      mp.startDate <= semester.endDate && mp.endDate >= semester.startDate
    );
  });

  // Get all time slot templates
  const timeSlots = await TimeSlotTemplate.find({ isActive: true }).sort({ dayOfWeek: 1, startTime: 1 });
  if (timeSlots.length === 0) throw new Error('No time slot templates defined. Please create time slots first.');

  // Load existing published/manually-adjusted entries to respect
  const existingEntries = await TimetableEntry.find({
    $or: [
      { semesterRef: semesterId, status: 'published' },
      { semester: semester.name.toLowerCase().includes('first') ? 'first' : 'second', academicYear: semester.academicYear, status: 'published' },
    ],
    isActive: true,
  }).populate('lecturer');

  // ──────────────────────────────────────────
  // STEP 2 — PREPROCESSING
  // ──────────────────────────────────────────
  const sessionsToPlace = [];
  const courseSessionMap = {}; // courseId → number of sessions needed
  const largeEnrollmentThreshold = computePercentile(courses.map((c) => c.expectedEnrollment || 0), 75);

  for (const course of courses) {
    // Use effectiveSessionTypes virtual (falls back to credit hour mapping)
    const sessionTypes = course.effectiveSessionTypes || [];
    courseSessionMap[course._id.toString()] = { total: 0, placed: 0 };

    for (const st of sessionTypes) {
      // Each hoursPerWeek unit maps to one time slot (2-hour blocks)
      // If hoursPerWeek = 2, that's one 2-hour session
      // If hoursPerWeek = 1, that's one 1-hour session (uses a 2-hour slot, noted)
      const numSessions = Math.ceil(st.hoursPerWeek / 2); // one session per 2-hour slot
      courseSessionMap[course._id.toString()].total += numSessions;

      for (let i = 0; i < numSessions; i++) {
        // Build valid venues for this session
        const enrollment = course.expectedEnrollment || 0;
        let validVenues;

        if (st.type === 'lab') {
          validVenues = venues.filter((v) =>
            v.type === 'Lab' && v.capacity >= enrollment
          );
        } else {
          // Lectures and tutorials: prefer non-lab venues
          validVenues = venues.filter((v) =>
            v.type !== 'Lab' && v.capacity >= enrollment
          );
          // If no non-lab venue fits, allow labs as fallback (flagged as warning)
          if (validVenues.length === 0) {
            validVenues = venues.filter((v) => v.capacity >= enrollment);
          }
        }

        sessionsToPlace.push({
          courseId: course._id.toString(),
          course,
          sessionType: st.type,
          hoursNeeded: st.hoursPerWeek,
          enrollment,
          lecturerId: course.lecturer?._id?.toString() || null,
          departmentId: course.department?._id?.toString() || null,
          level: course.level,
          validVenues,
          isLarge: enrollment >= largeEnrollmentThreshold,
          unschedulable: validVenues.length === 0,
          unschedulableReason: validVenues.length === 0
            ? `No venue with sufficient capacity (≥${enrollment}) for ${st.type} session`
            : null,
        });
      }
    }
  }

  // Separate schedulable from unschedulable
  const unschedulable = sessionsToPlace.filter((s) => s.unschedulable);
  const schedulable = sessionsToPlace.filter((s) => !s.unschedulable);

  // Sort by enrollment DESC (most constrained first)
  schedulable.sort((a, b) => b.enrollment - a.enrollment);

  // ──────────────────────────────────────────
  // STEP 3 — BUILD STATE MATRICES
  // ──────────────────────────────────────────
  const venueSlotMatrix = {};   // venueId → slotId → 'available' | 'occupied'
  const lecturerSlotMatrix = {}; // lecturerId → slotId → 'available' | 'occupied'
  const deptLevelSlotMatrix = {}; // deptId → level → slotId → count
  const courseSlotUsage = {};   // courseId → [{ slotId, dayOfWeek }]
  const lecturerDayLoad = {};   // lecturerId → dayOfWeek → count

  // Initialize venue matrix
  for (const venue of venues) {
    venueSlotMatrix[venue._id.toString()] = {};
    for (const slot of timeSlots) {
      venueSlotMatrix[venue._id.toString()][slot._id.toString()] = 'available';
    }
  }

  // Initialize lecturer matrix
  const allLecturerIds = [...new Set(courses.map((c) => c.lecturer?._id?.toString()).filter(Boolean))];
  for (const lid of allLecturerIds) {
    lecturerSlotMatrix[lid] = {};
    lecturerDayLoad[lid] = {};
    for (const slot of timeSlots) {
      lecturerSlotMatrix[lid][slot._id.toString()] = 'available';
    }
  }

  // Pre-mark existing entries
  for (const entry of existingEntries) {
    const venueId = entry.venue?.toString();
    const lecturerId = entry.lecturer?._id?.toString() || entry.lecturer?.toString();

    // Find matching time slot
    const matchingSlot = timeSlots.find((ts) =>
      ts.dayOfWeek === entry.dayOfWeek && ts.startTime === entry.timeStart
    );
    if (!matchingSlot) continue;
    const slotId = matchingSlot._id.toString();

    if (venueId && venueSlotMatrix[venueId]) {
      venueSlotMatrix[venueId][slotId] = 'occupied';
    }
    if (lecturerId && lecturerSlotMatrix[lecturerId]) {
      lecturerSlotMatrix[lecturerId][slotId] = 'occupied';
    }
  }

  // ──────────────────────────────────────────
  // STEP 4 — MAIN ASSIGNMENT LOOP
  // ──────────────────────────────────────────
  const scheduledEntries = [];
  const failedSessions = [];

  for (const session of schedulable) {
    let bestSlot = null;
    let bestVenue = null;
    let bestScore = -Infinity;

    for (const slot of timeSlots) {
      const slotId = slot._id.toString();
      const slotDay = slot.dayOfWeek;

      // --- HARD CONSTRAINT CHECKS ---

      // H2: Lecturer uniqueness
      if (session.lecturerId && lecturerSlotMatrix[session.lecturerId]?.[slotId] === 'occupied') {
        continue;
      }

      // H5 / S3: Check if course already has a session on this day (spread)
      const usedDays = (courseSlotUsage[session.courseId] || []).map((u) => u.dayOfWeek);
      const alreadyOnThisDay = usedDays.includes(slotDay);

      for (const venue of session.validVenues) {
        const venueId = venue._id.toString();

        // H1: Venue uniqueness
        if (venueSlotMatrix[venueId]?.[slotId] === 'occupied') continue;

        // --- SCORE THIS COMBINATION ---
        let score = 0;

        // S1: Level clash penalty (most important soft constraint)
        const deptId = session.departmentId;
        const level = session.level;
        const levelClashCount = deptLevelSlotMatrix[deptId]?.[level]?.[slotId] || 0;
        score -= levelClashCount * 100;

        // S2: Lecturer daily load penalty
        if (session.lecturerId) {
          const dayLoad = lecturerDayLoad[session.lecturerId]?.[slotDay] || 0;
          if (dayLoad >= 3) score -= 50;
        }

        // S3: Course spread reward
        if (!alreadyOnThisDay) {
          score += 30;
        } else {
          score -= 40; // Penalize same-day placement
        }

        // S4: Department day concentration penalty
        const deptDayCount = countDeptOnDay(scheduledEntries, deptId, slotDay);
        score -= deptDayCount * 10;

        // S5: Venue efficiency (prefer tighter capacity fit)
        const capacityWaste = venue.capacity - session.enrollment;
        score -= capacityWaste * 0.1;

        // S6: Large course early period preference
        if (session.isLarge) {
          const periodNum = getPeriodNumber(slot.startTime);
          if (periodNum <= 2) score += 20;
        }

        // H5: Session type compliance warning
        if (session.sessionType !== 'lab' && venue.type === 'Lab') {
          score -= 200; // Heavy penalty but not impossible
        }

        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
          bestVenue = venue;
        }
      }
    }

    // Place or fail
    if (bestSlot && bestVenue) {
      placeSession(session, bestSlot, bestVenue, scheduledEntries, venueSlotMatrix, lecturerSlotMatrix, deptLevelSlotMatrix, courseSlotUsage, lecturerDayLoad, semesterId, semester);
      courseSessionMap[session.courseId].placed++;
    } else {
      // Attempt backtracking
      const backtrackResult = attemptBacktrack(
        session, scheduledEntries, timeSlots, venueSlotMatrix, lecturerSlotMatrix,
        deptLevelSlotMatrix, courseSlotUsage, lecturerDayLoad, semesterId, semester
      );

      if (backtrackResult.success) {
        courseSessionMap[session.courseId].placed++;
      } else {
        failedSessions.push({
          course: session.course,
          courseId: session.courseId,
          sessionType: session.sessionType,
          sessionsNeeded: 1,
          sessionsPlaced: 0,
          reason: buildFailureReason(session, venues, timeSlots),
        });
      }
    }
  }

  // Add unschedulable sessions to failures
  for (const us of unschedulable) {
    failedSessions.push({
      course: us.course,
      courseId: us.courseId,
      sessionType: us.sessionType,
      sessionsNeeded: 1,
      sessionsPlaced: 0,
      reason: us.unschedulableReason,
    });
  }

  // ──────────────────────────────────────────
  // STEP 5 — COLLECT SOFT CONSTRAINT VIOLATIONS
  // ──────────────────────────────────────────
  const softViolations = collectSoftViolations(scheduledEntries, timeSlots, deptLevelSlotMatrix, lecturerDayLoad);

  // ──────────────────────────────────────────
  // STEP 6 — COMPUTE SUMMARY AND SAVE
  // ──────────────────────────────────────────
  const courseSummary = computeCourseSummary(courseSessionMap);
  const totalSessionsNeeded = schedulable.length + unschedulable.length;
  const placementRate = totalSessionsNeeded > 0
    ? Math.round((scheduledEntries.length / totalSessionsNeeded) * 1000) / 10
    : 100;

  // Get next version number
  const prevRun = await SchedulingRun.findOne({ semester: semesterId, runType: 'lecture' }).sort({ version: -1 });
  const version = (prevRun?.version || 0) + 1;

  // Save entries to database
  const savedEntries = [];
  for (const entry of scheduledEntries) {
    const saved = await TimetableEntry.create(entry);
    savedEntries.push(saved);
  }

  // Aggregate failed courses (group by courseId)
  const failedCourseMap = {};
  for (const f of failedSessions) {
    const cid = f.courseId;
    if (!failedCourseMap[cid]) {
      failedCourseMap[cid] = { course: f.course._id, sessionsNeeded: 0, sessionsPlaced: 0, reason: f.reason };
    }
    failedCourseMap[cid].sessionsNeeded++;
  }

  // Save scheduling run
  const run = await SchedulingRun.create({
    semester: semesterId,
    runType: 'lecture',
    mode,
    version,
    status: 'complete',
    triggeredBy: userId,
    ranAt: new Date(startTime),
    completedAt: new Date(),
    durationMs: Date.now() - startTime,
    placementRate,
    summary: {
      totalCourses: courses.length,
      fullyScheduled: courseSummary.fullyScheduled,
      partiallyScheduled: courseSummary.partiallyScheduled,
      unscheduled: courseSummary.unscheduled,
      totalSessionsPlaced: scheduledEntries.length,
    },
    failedCourses: Object.values(failedCourseMap),
    softConstraintViolations: softViolations,
  });

  // If auto-pilot mode, publish immediately
  if (mode === 'auto_pilot') {
    await TimetableEntry.updateMany(
      { schedulingRun: run._id },
      { status: 'published' }
    );
  }

  return {
    runId: run._id,
    status: mode === 'auto_pilot' ? 'published' : 'draft',
    semesterId,
    generatedAt: run.ranAt,
    durationMs: run.durationMs,
    version,
    entries: savedEntries,
    summary: run.summary,
    placementRate,
    failedSessions: Object.values(failedCourseMap),
    softConstraintViolations: softViolations,
  };
}

// ──────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────

function placeSession(session, slot, venue, entries, venueMatrix, lecturerMatrix, deptLevelMatrix, courseUsage, lecturerDay, semesterId, semester) {
  const slotId = slot._id.toString();
  const venueId = venue._id.toString();
  const slotDay = slot.dayOfWeek;

  const entry = {
    course: session.course._id,
    venue: venue._id,
    venues: [venue._id],
    lecturer: session.course.lecturer?._id || null,
    dayOfWeek: slotDay,
    timeStart: slot.startTime,
    timeEnd: slot.endTime,
    timeSlot: slot._id,
    type: session.sessionType,
    entryType: session.sessionType,
    status: 'draft',
    semester: semester.name.toLowerCase().includes('first') ? 'first' : semester.name.toLowerCase().includes('second') ? 'second' : 'summer',
    academicYear: semester.academicYear,
    semesterRef: semesterId,
    department: session.course.department?._id || session.course.department,
    generatedBy: null, // Will be set by the controller
    isManuallyAdjusted: false,
    // We'll set schedulingRun after creating the SchedulingRun doc
    _sessionRef: session, // temp reference, not saved
  };

  entries.push(entry);

  // Update matrices
  venueMatrix[venueId][slotId] = 'occupied';

  if (session.lecturerId) {
    if (!lecturerMatrix[session.lecturerId]) lecturerMatrix[session.lecturerId] = {};
    lecturerMatrix[session.lecturerId][slotId] = 'occupied';

    if (!lecturerDay[session.lecturerId]) lecturerDay[session.lecturerId] = {};
    lecturerDay[session.lecturerId][slotDay] = (lecturerDay[session.lecturerId][slotDay] || 0) + 1;
  }

  // Update dept-level matrix
  const deptId = session.departmentId;
  const level = session.level;
  if (deptId) {
    if (!deptLevelMatrix[deptId]) deptLevelMatrix[deptId] = {};
    if (!deptLevelMatrix[deptId][level]) deptLevelMatrix[deptId][level] = {};
    deptLevelMatrix[deptId][level][slotId] = (deptLevelMatrix[deptId][level][slotId] || 0) + 1;
  }

  // Update course slot usage
  if (!courseUsage[session.courseId]) courseUsage[session.courseId] = [];
  courseUsage[session.courseId].push({ slotId, dayOfWeek: slotDay });
}

function attemptBacktrack(session, entries, timeSlots, venueMatrix, lecturerMatrix, deptLevelMatrix, courseUsage, lecturerDay, semesterId, semester) {
  // Find the lowest-priority (smallest enrollment) previously placed session
  // that conflicts with the current session's needed slots
  const candidates = entries
    .filter((e) => e._sessionRef && e._sessionRef.enrollment < session.enrollment)
    .sort((a, b) => (a._sessionRef?.enrollment || 0) - (b._sessionRef?.enrollment || 0));

  for (const candidate of candidates.slice(0, 5)) { // Try up to 5 backtrack candidates
    const candSession = candidate._sessionRef;
    const candSlotId = candidate.timeSlot?.toString();
    const candVenueId = candidate.venue?.toString();
    const candDay = candidate.dayOfWeek;

    // Check if freeing this slot would help the current session
    const couldUseSlot = session.validVenues.some((v) => v._id.toString() === candVenueId) ||
      session.validVenues.some((v) => {
        const vid = v._id.toString();
        return venueMatrix[vid]?.[candSlotId] === 'available' || vid === candVenueId;
      });

    if (!couldUseSlot) continue;

    // Try to find an alternative slot for the candidate
    for (const altSlot of timeSlots) {
      const altSlotId = altSlot._id.toString();
      if (altSlotId === candSlotId) continue;

      // Check lecturer availability for candidate
      if (candSession.lecturerId && lecturerMatrix[candSession.lecturerId]?.[altSlotId] === 'occupied') continue;

      // Check venue availability for candidate
      for (const altVenue of candSession.validVenues || []) {
        const altVenueId = altVenue._id.toString();
        if (venueMatrix[altVenueId]?.[altSlotId] !== 'available') continue;

        // Move candidate to alternative slot
        // Undo old placement
        if (candVenueId && venueMatrix[candVenueId]) venueMatrix[candVenueId][candSlotId] = 'available';
        if (candSession.lecturerId && lecturerMatrix[candSession.lecturerId]) {
          lecturerMatrix[candSession.lecturerId][candSlotId] = 'available';
        }

        // Apply new placement for candidate
        candidate.dayOfWeek = altSlot.dayOfWeek;
        candidate.timeStart = altSlot.startTime;
        candidate.timeEnd = altSlot.endTime;
        candidate.timeSlot = altSlot._id;
        candidate.venue = altVenue._id;
        candidate.venues = [altVenue._id];

        venueMatrix[altVenueId][altSlotId] = 'occupied';
        if (candSession.lecturerId) {
          lecturerMatrix[candSession.lecturerId][altSlotId] = 'occupied';
        }

        // Now try to place the current session in the freed slot
        if (candVenueId && session.validVenues.some((v) => v._id.toString() === candVenueId)) {
          // Place current session in the freed venue+slot
          const freedVenue = session.validVenues.find((v) => v._id.toString() === candVenueId);
          placeSession(session, { _id: candSlotId, dayOfWeek: candDay, startTime: candidate.timeStart, endTime: candidate.timeEnd },
            freedVenue, entries, venueMatrix, lecturerMatrix, deptLevelMatrix, courseUsage, lecturerDay, semesterId, semester);
          return { success: true };
        }

        // Undo if we couldn't place
        venueMatrix[altVenueId][altSlotId] = 'available';
        if (candVenueId && venueMatrix[candVenueId]) venueMatrix[candVenueId][candSlotId] = 'occupied';
        if (candSession.lecturerId && lecturerMatrix[candSession.lecturerId]) {
          lecturerMatrix[candSession.lecturerId][candSlotId] = 'occupied';
          lecturerMatrix[candSession.lecturerId][altSlotId] = 'available';
        }
        // Restore candidate
        candidate.dayOfWeek = candDay;
      }
    }
  }

  return { success: false };
}

function buildFailureReason(session, venues, timeSlots) {
  const enrollment = session.enrollment;
  const capableVenues = venues.filter((v) => v.capacity >= enrollment);

  if (capableVenues.length === 0) {
    return `No venue with capacity ≥ ${enrollment} students exists. Largest venue has ${Math.max(...venues.map((v) => v.capacity))} seats.`;
  }

  if (session.lecturerId) {
    return `No available time slot where ${session.course.lecturer?.name || 'the lecturer'} is free AND a venue with capacity ≥ ${enrollment} is available.`;
  }

  return `All suitable venue+time combinations are already occupied. Consider adding more venues or time slots.`;
}

function countDeptOnDay(entries, deptId, day) {
  return entries.filter((e) =>
    (e.department?.toString() === deptId) && e.dayOfWeek === day
  ).length;
}

function getPeriodNumber(timeStr) {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 9) return 1;
  if (hour < 11) return 2;
  if (hour < 13) return 3;
  if (hour < 15) return 4;
  return 5;
}

function computePercentile(values, percentile) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeCourseSummary(courseSessionMap) {
  let fullyScheduled = 0;
  let partiallyScheduled = 0;
  let unscheduled = 0;

  for (const [, data] of Object.entries(courseSessionMap)) {
    if (data.placed >= data.total) fullyScheduled++;
    else if (data.placed > 0) partiallyScheduled++;
    else unscheduled++;
  }

  return { fullyScheduled, partiallyScheduled, unscheduled };
}

function collectSoftViolations(entries, timeSlots, deptLevelMatrix, lecturerDay) {
  const violations = [];

  // Check level clashes
  for (const [deptId, levels] of Object.entries(deptLevelMatrix)) {
    for (const [level, slots] of Object.entries(levels)) {
      for (const [slotId, count] of Object.entries(slots)) {
        if (count > 1) {
          // Find the courses involved
          const clashing = entries.filter((e) =>
            e.department?.toString() === deptId &&
            e._sessionRef?.level === Number(level) &&
            e.timeSlot?.toString() === slotId
          );
          if (clashing.length > 1) {
            const names = clashing.map((c) => c._sessionRef?.course?.code || 'Unknown').join(' and ');
            const slot = timeSlots.find((s) => s._id.toString() === slotId);
            violations.push(
              `Level clash: ${names} share ${slot?.label || 'a time slot'} ${slot?.dayOfWeek || ''} — Level ${level} students affected`
            );
          }
        }
      }
    }
  }

  // Check lecturer overload
  for (const [lecturerId, days] of Object.entries(lecturerDay)) {
    for (const [day, count] of Object.entries(days)) {
      if (count > 3) {
        const lecturer = entries.find((e) => e.lecturer?.toString() === lecturerId)?._sessionRef?.course?.lecturer;
        violations.push(
          `${lecturer?.name || 'A lecturer'} has ${count} sessions on ${day} (recommended max: 3)`
        );
      }
    }
  }

  return violations;
}

export default { generateLectureTimetable };
