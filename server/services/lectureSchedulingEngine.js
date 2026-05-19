import Course from '../models/Course.js';
import Venue from '../models/Venue.js';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';
import TimetableEntry from '../models/TimetableEntry.js';
import SchedulingRun from '../models/SchedulingRun.js';
import Semester from '../models/Semester.js';
import { expandCoursesIntoSessions } from './sessionExpander.js';

export async function generateLectureTimetable(semesterId, options = {}) {
  const startTime = Date.now();
  const { mode = 'semi_auto', userId } = options;

  const semester = await Semester.findById(semesterId);
  if (!semester) throw new Error('Semester not found');

  const approvedCourses = await Course.find({
    semesterRef: semesterId,
    submissionStatus: 'approved',
    isActive: true,
  }).populate('department', 'name code').populate('lecturer', 'name email');

  if (approvedCourses.length === 0) throw new Error('No approved courses found for this semester');

  const allVenues = await Venue.find({ isAvailable: true });
  const venues = allVenues.filter((v) => {
    return !v.maintenancePeriods.some((mp) =>
      mp.startDate <= semester.endDate && mp.endDate >= semester.startDate
    );
  });

  const timeSlots = await TimeSlotTemplate.find({ isActive: true }).sort({ dayOfWeek: 1, startTime: 1 });
  if (timeSlots.length === 0) throw new Error('No time slots defined.');

  const existingEntries = await TimetableEntry.find({
    semesterRef: semesterId,
    status: 'published',
    isActive: true,
  });

  // STEP 2 — EXPAND SESSIONS
  const allSessions = expandCoursesIntoSessions(approvedCourses);
  const schedulable = [];
  const unschedulable = [];

  for (const session of allSessions) {
    const validVenues = venues.filter((v) => {
      // Must match venue type
      if (!session.requiredVenueType.includes(v.type)) return false;
      // Must fit capacity
      if (v.capacity < session.minimumCapacity) return false;
      return true;
    });

    if (validVenues.length === 0) {
      unschedulable.push({
        ...session,
        unschedulableReason: `No ${session.requiredVenueType.join('/')} venue with capacity ≥ ${session.minimumCapacity} is available.`,
      });
    } else {
      schedulable.push({ ...session, validVenues });
    }
  }

  // STEP 3 — BUILD STATE MATRICES
  const venueSlotMatrix = {};
  const lecturerSlotMatrix = {};
  const deptLevelSlotMatrix = {};
  const courseGroupSlotUsage = {};
  const lecturerDayLoad = {};
  const deptDayLoad = {};

  for (const venue of venues) {
    venueSlotMatrix[venue._id.toString()] = {};
  }

  const allLecturerIds = new Set();
  approvedCourses.forEach(c => {
    if (c.lecturers) c.lecturers.forEach(l => allLecturerIds.add(l.toString()));
    if (c.lecturer) allLecturerIds.add(c.lecturer.toString());
  });

  allLecturerIds.forEach(lid => {
    lecturerSlotMatrix[lid] = {};
    lecturerDayLoad[lid] = {};
  });

  // Pre-mark existing entries
  for (const entry of existingEntries) {
    const venueId = entry.venue?.toString() || (entry.venues && entry.venues[0]?.toString());
    const slotId = entry.timeSlot?.toString();
    if (venueId && slotId && venueSlotMatrix[venueId]) {
      venueSlotMatrix[venueId][slotId] = 'occupied';
    }
    if (entry.lecturers && slotId) {
      entry.lecturers.forEach(l => {
        const lid = l.toString();
        if (lecturerSlotMatrix[lid]) lecturerSlotMatrix[lid][slotId] = 'occupied';
      });
    }
  }

  // STEP 4 — MAIN ASSIGNMENT LOOP
  const scheduledEntries = [];
  const failedSessions = [];
  const largeEnrollmentThreshold = 100; // heuristic

  for (const session of schedulable) {
    let bestSlot = null;
    let bestVenue = null;
    let bestScore = -Infinity;

    const courseId = session.courseId;
    const groupNum = session.groupNumber;
    const cgKey = `${courseId}_${groupNum}`;

    for (const slot of timeSlots) {
      const slotId = slot._id.toString();
      const slotDay = slot.dayOfWeek;

      // H2 — ALL lecturers must be free
      let anyLecturerBusy = false;
      if (session.lecturers && session.lecturers.length > 0) {
        anyLecturerBusy = session.lecturers.some(lId => lecturerSlotMatrix[lId.toString()]?.[slotId] === 'occupied');
      }
      if (anyLecturerBusy) continue;

      // H5 — Check no other group of this course is at this slot
      const otherGroupsAtSlot = scheduledEntries.some(e => 
        e.course.toString() === courseId && 
        e.timeSlot.toString() === slotId && 
        e.groupNumber !== groupNum
      );
      if (otherGroupsAtSlot) continue;

      // Check course group spread (don't put two sessions of same group on same day)
      const groupUsedDays = (courseGroupSlotUsage[cgKey] || []).map(u => u.dayOfWeek);
      const alreadyOnThisDay = groupUsedDays.includes(slotDay);
      if (alreadyOnThisDay) continue; // Force different days

      for (const venue of session.validVenues) {
        const venueId = venue._id.toString();

        if (venueSlotMatrix[venueId]?.[slotId] === 'occupied') continue;

        // SCORE
        let score = 0;

        const deptId = session.department?._id?.toString();
        const level = session.level;
        if (deptId) {
          const levelClashCount = deptLevelSlotMatrix[deptId]?.[level]?.[slotId] || 0;
          score -= levelClashCount * 150;
        }

        if (session.lecturers) {
          for (const lId of session.lecturers) {
            const dayLoad = lecturerDayLoad[lId.toString()]?.[slotDay] || 0;
            if (dayLoad >= 4) score -= 200;
            else if (dayLoad >= 3) score -= 80;
          }
        }

        // Capacity waste
        const capacityWaste = venue.capacity - session.minimumCapacity;
        score -= capacityWaste * 0.05;

        if (session.minimumCapacity > largeEnrollmentThreshold) {
          if (getPeriodNumber(slot.startTime) <= 2) score += 25;
        }

        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
          bestVenue = venue;
        }
      }
    }

    if (bestSlot && bestVenue) {
      const slotId = bestSlot._id.toString();
      const slotDay = bestSlot.dayOfWeek;
      const venueId = bestVenue._id.toString();
      const deptId = session.department?._id?.toString();

      scheduledEntries.push({
        course: courseId,
        venue: bestVenue._id,
        venues: [bestVenue._id],
        lecturers: session.lecturers,
        lecturer: session.lecturers?.[0] || null,
        dayOfWeek: slotDay,
        timeStart: bestSlot.startTime,
        timeEnd: bestSlot.endTime,
        timeSlot: bestSlot._id,
        type: session.entryType,
        entryType: session.entryType,
        groupNumber: groupNum,
        totalGroups: session.totalGroups,
        studentsInThisGroup: session.studentsInGroup,
        status: 'draft',
        semester: semester.name.toLowerCase().includes('first') ? 'first' : 'second',
        academicYear: semester.academicYear,
        semesterRef: semesterId,
        department: session.department,
        isManuallyAdjusted: false,
      });

      venueSlotMatrix[venueId][slotId] = 'occupied';
      if (session.lecturers) {
        session.lecturers.forEach(l => {
          const lid = l.toString();
          lecturerSlotMatrix[lid][slotId] = 'occupied';
          lecturerDayLoad[lid][slotDay] = (lecturerDayLoad[lid][slotDay] || 0) + 1;
        });
      }

      if (deptId) {
        if (!deptLevelSlotMatrix[deptId]) deptLevelSlotMatrix[deptId] = {};
        if (!deptLevelSlotMatrix[deptId][session.level]) deptLevelSlotMatrix[deptId][session.level] = {};
        deptLevelSlotMatrix[deptId][session.level][slotId] = (deptLevelSlotMatrix[deptId][session.level][slotId] || 0) + 1;
      }

      if (!courseGroupSlotUsage[cgKey]) courseGroupSlotUsage[cgKey] = [];
      courseGroupSlotUsage[cgKey].push({ slotId, dayOfWeek: slotDay });

    } else {
      failedSessions.push({
        course: courseId,
        entryType: session.entryType,
        groupNumber: groupNum,
        reason: 'No suitable venue/slot combination found respecting constraints.',
      });
    }
  }

  for (const us of unschedulable) {
    failedSessions.push({
      course: us.courseId,
      entryType: us.entryType,
      groupNumber: us.groupNumber,
      reason: us.unschedulableReason,
    });
  }

  // STEP 6 — SAVE
  const savedEntries = [];
  for (const entry of scheduledEntries) {
    const saved = await TimetableEntry.create(entry);
    savedEntries.push(saved);
  }

  const placementRate = allSessions.length > 0 
    ? Math.round((scheduledEntries.length / allSessions.length) * 1000) / 10 
    : 100;

  const run = await SchedulingRun.create({
    semester: semesterId,
    runType: 'lecture',
    mode,
    status: 'complete',
    triggeredBy: userId,
    ranAt: new Date(startTime),
    completedAt: new Date(),
    durationMs: Date.now() - startTime,
    placementRate,
    summary: {
      totalCourses: approvedCourses.length,
      totalSessionsPlaced: scheduledEntries.length,
      unscheduled: failedSessions.length,
    },
    failedCourses: failedSessions.map(f => ({
      course: f.course,
      reason: f.reason,
    })),
  });

  if (mode === 'auto_pilot') {
    await TimetableEntry.updateMany({ schedulingRun: run._id }, { status: 'published' });
  }

  return {
    runId: run._id,
    status: mode === 'auto_pilot' ? 'published' : 'draft',
    semesterId,
    entries: savedEntries,
    summary: run.summary,
    placementRate,
    failedSessions,
  };
}

function getPeriodNumber(timeStr) {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 9) return 1;
  if (hour < 11) return 2;
  if (hour < 13) return 3;
  if (hour < 15) return 4;
  return 5;
}

export default { generateLectureTimetable };
