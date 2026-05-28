// services/examSchedulingEngine.js
// Exam Scheduling with Multi-Venue Allocation and Cluster Clash Avoidance
import Course from '../models/Course.js';
import Venue from '../models/Venue.js';
import TimetableEntry from '../models/TimetableEntry.js';
import SchedulingRun from '../models/SchedulingRun.js';
import Semester from '../models/Semester.js';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';

/**
 * Allocate multiple venues for a single exam.
 * @param {object} course - Course document
 * @param {Array} availableVenues - Venues
 * @param {Array<string>} slotKeys - Array of composite keys "dateStr|slotId"
 * @param {object} venueExamMatrix - Current occupancy state
 * @returns {{ success: boolean, venues?: Array, totalCapacity?: number, distribution?: Array, reason?: string }}
 */
function allocateExamVenues(course, availableVenues, slotKeys, venueExamMatrix) {
  const enrollment = course.estimatedStudents || 0;
  let studentsRemaining = enrollment;
  const selectedVenues = [];
  let totalCapacity = 0;

  // Sort by exam capacity descending — use largest venues first
  const sortedVenues = availableVenues
    .filter((v) => slotKeys.every(key => venueExamMatrix[v._id.toString()]?.[key] === 'available'))
    .sort((a, b) => (b.capacityExam || Math.floor(b.capacity * 0.5)) - (a.capacityExam || Math.floor(a.capacity * 0.5)));

  for (const venue of sortedVenues) {
    if (studentsRemaining <= 0) break;

    const examCap = venue.capacityExam || Math.floor(venue.capacity * 0.5);
    selectedVenues.push(venue);
    totalCapacity += examCap;
    studentsRemaining -= examCap;
  }

  if (totalCapacity < enrollment) {
    return {
      success: false,
      reason: `Total available exam capacity (${totalCapacity}) is less than enrollment (${enrollment}) for this slot`,
    };
  }

  // Generate student distribution by index number
  const distribution = distributeStudents(course, selectedVenues);

  return {
    success: true,
    venues: selectedVenues,
    totalCapacity,
    distribution,
  };
}

/**
 * Distribute students across venues by index number ranges.
 */
function distributeStudents(course, venues) {
  const enrollment = course.estimatedStudents || 0;
  const distribution = [];
  let assigned = 0;

  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const examCap = venue.capacityExam || Math.floor(venue.capacity * 0.5);
    const remaining = enrollment - assigned;
    const count = i === venues.length - 1 ? remaining : Math.min(examCap, remaining);

    const startIdx = 10001001 + assigned;
    const endIdx = startIdx + count - 1;

    distribution.push({
      venue: venue._id,
      rangeDescription: `Index ${startIdx} – ${endIdx}`,
      count,
    });

    assigned += count;
  }

  return distribution;
}

/**
 * Main exam scheduling engine.
 * @param {string} semesterId
 * @param {object} options - { mode, userId }
 */
export async function generateExamTimetable(semesterId, options = {}) {
  const startTime = Date.now();
  const { mode = 'semi_auto', userId } = options;

  // ──────────────────────────────────────────
  // STEP 1 — LOAD DATA
  // ──────────────────────────────────────────
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new Error('Semester not found');
  if (!semester.examPeriod?.startDate || !semester.examPeriod?.endDate) {
    throw new Error('Exam period dates not configured for this semester');
  }

  const courses = await Course.find({
    semester: semesterId,
    submissionStatus: 'approved',
    isActive: true,
  })
    .populate('department', 'name code')
    .populate('lecturer', 'name email')
    .populate('lecturers', 'name email');

  if (courses.length === 0) throw new Error('No courses found for this semester');

  // Get venues not under maintenance during exam period
  const allVenues = await Venue.find({ isAvailable: true });
  const venues = allVenues.filter((v) => {
    return !v.maintenancePeriods.some((mp) =>
      mp.startDate <= semester.examPeriod.endDate && mp.endDate >= semester.examPeriod.startDate
    );
  });

  // Fetch TimeSlotTemplates
  const timeSlots = await TimeSlotTemplate.find({ isActive: true }).sort({ dayOfWeek: 1, startTime: 1 });
  if (timeSlots.length === 0) throw new Error('No time slots defined.');

  const slotsByDay = {};
  for (const slot of timeSlots) {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = [];
    slotsByDay[slot.dayOfWeek].push(slot);
  }

  // Generate all exam days based on dates and available slots
  const examDays = [];
  const examStart = new Date(semester.examPeriod.startDate);
  const examEnd = new Date(semester.examPeriod.endDate);
  const current = new Date(examStart);
  
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  while (current <= examEnd) {
    const dayOfWeekIndex = current.getDay();
    const dayOfWeekStr = daysMap[dayOfWeekIndex];
    if (slotsByDay[dayOfWeekStr]) {
      const dateStr = current.toISOString().split('T')[0];
      examDays.push({ date: new Date(current), dateStr, dayOfWeekStr, slots: slotsByDay[dayOfWeekStr] });
    }
    current.setDate(current.getDate() + 1);
  }

  if (examDays.length === 0) throw new Error('No exam days with valid time slots available in the configured exam period');

  // Helper to find contiguous windows of a required size for a given day
  function getContiguousWindows(daySlots, requiredCount) {
    const windows = [];
    if (daySlots.length < requiredCount) return windows;
    for (let i = 0; i <= daySlots.length - requiredCount; i++) {
      const window = daySlots.slice(i, i + requiredCount);
      let isContiguous = true;
      for (let j = 0; j < requiredCount - 1; j++) {
        if (window[j].endTime !== window[j + 1].startTime) {
          isContiguous = false;
          break;
        }
      }
      if (isContiguous) windows.push(window);
    }
    return windows;
  }

  // ──────────────────────────────────────────
  // STEP 2 — PREPROCESSING
  // ──────────────────────────────────────────
  // Sort by enrollment descending
  const sortedCourses = [...courses].sort((a, b) => (b.estimatedStudents || 0) - (a.estimatedStudents || 0));

  // Check if any course is fundamentally unschedulable
  const maxTotalExamCapacity = venues.reduce((sum, v) => sum + (v.capacityExam || Math.floor(v.capacity * 0.5)), 0);

  const unschedulable = [];
  const schedulable = [];

  for (const course of sortedCourses) {
    if ((course.estimatedStudents || 0) > maxTotalExamCapacity) {
      unschedulable.push({
        course,
        reason: `Total exam capacity across all venues (${maxTotalExamCapacity}) is insufficient for enrollment (${course.estimatedStudents})`,
      });
    } else {
      schedulable.push(course);
    }
  }

  // Build co-enrolled course clusters (dept + level)
  const clusters = {};
  for (const course of schedulable) {
    const deptId = course.department?._id?.toString() || 'unknown';
    const level = course.level || 0;
    const key = `${deptId}_${level}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(course);
  }

  // ──────────────────────────────────────────
  // STEP 3 — BUILD STATE MATRICES
  // ──────────────────────────────────────────
  const venueExamMatrix = {};
  for (const venue of venues) {
    venueExamMatrix[venue._id.toString()] = {};
    for (const day of examDays) {
      for (const slot of day.slots) {
        const key = `${day.dateStr}|${slot._id.toString()}`;
        venueExamMatrix[venue._id.toString()][key] = 'available';
      }
    }
  }

  const dateLoadMatrix = {};
  const clusterDateMatrix = {};

  for (const day of examDays) {
    dateLoadMatrix[day.dateStr] = 0;
  }

  // ──────────────────────────────────────────
  // STEP 4 — MAIN EXAM ASSIGNMENT LOOP
  // ──────────────────────────────────────────
  const examEntries = [];
  const failedExams = [];

  for (const course of schedulable) {
    const deptId = course.department?._id?.toString() || 'unknown';
    const level = course.level || 0;
    const clusterKey = `${deptId}_${level}`;

    let bestSlot = null;
    let bestResult = null;
    let bestScore = -Infinity;

    const requiredSlotsCount = Math.max(1, Math.ceil((course.creditHours || 3) * 60 / 60));

    // Sort candidate days by preference
    const candidateDays = [...examDays].sort((a, b) => {
      const clashA = clusterDateMatrix[clusterKey]?.[a.dateStr] || 0;
      const clashB = clusterDateMatrix[clusterKey]?.[b.dateStr] || 0;
      if (clashA !== clashB) return clashA - clashB;

      const loadA = dateLoadMatrix[a.dateStr] || 0;
      const loadB = dateLoadMatrix[b.dateStr] || 0;
      return loadA - loadB;
    });

    for (const day of candidateDays) {
      const windows = getContiguousWindows(day.slots, requiredSlotsCount);
      
      for (const window of windows) {
        const slotKeys = window.map(s => `${day.dateStr}|${s._id.toString()}`);

        // Try to allocate venues
        const result = allocateExamVenues(course, venues, slotKeys, venueExamMatrix);

        if (result.success) {
          let score = 0;

          // Penalize cluster clashes heavily
          const clashCount = clusterDateMatrix[clusterKey]?.[day.dateStr] || 0;
          score -= clashCount * 200;

          // Reward even date distribution
          const dateLoad = dateLoadMatrix[day.dateStr] || 0;
          score -= dateLoad * 20;

          if (score > bestScore) {
            bestScore = score;
            bestSlot = { date: day.date, dateStr: day.dateStr, window };
            bestResult = result;
          }
        }
      }
    }

    if (bestSlot && bestResult) {
      // Re-apply venue markings for chosen slot
      const chosenKeys = bestSlot.window.map(s => `${bestSlot.dateStr}|${s._id.toString()}`);
      for (const v of bestResult.venues) {
        for (const key of chosenKeys) {
          venueExamMatrix[v._id.toString()][key] = 'occupied';
        }
      }

      const semStr = semester.name.toLowerCase().includes('first') ? 'first' : semester.name.toLowerCase().includes('second') ? 'second' : 'summer';

      examEntries.push({
        course: course._id,
        venues: bestResult.venues.map((v) => v._id),
        venue: bestResult.venues[0]._id,
        entryType: 'exam',
        examDate: bestSlot.date,
        examTimeBlock: null, // Legacy, unused now
        dayOfWeek: getDayName(bestSlot.date),
        timeStart: bestSlot.window[0].startTime,
        timeEnd: bestSlot.window[bestSlot.window.length - 1].endTime,
        timeSlot: bestSlot.window[0]._id,
        timeSlots: bestSlot.window.map(s => s._id),
        studentDistribution: bestResult.distribution,
        status: 'draft',
        semester: semesterId,
        academicYear: semester.academicYear,
        department: course.department?._id || course.department,
        lecturer: course.lecturers && course.lecturers.length > 0 ? course.lecturers[0]._id : (course.lecturer?._id || null),
        lecturers: course.lecturers ? course.lecturers.map(l => l._id) : (course.lecturer ? [course.lecturer._id] : []),
        groupNumber: 1,
        totalGroups: 1,
        studentsInThisGroup: course.estimatedStudents || 0,
        isManuallyAdjusted: false,
        _courseRef: course, // temp reference
      });

      // Update matrices
      dateLoadMatrix[bestSlot.dateStr] = (dateLoadMatrix[bestSlot.dateStr] || 0) + 1;
      if (!clusterDateMatrix[clusterKey]) clusterDateMatrix[clusterKey] = {};
      clusterDateMatrix[clusterKey][bestSlot.dateStr] = (clusterDateMatrix[clusterKey][bestSlot.dateStr] || 0) + 1;
    } else {
      failedExams.push({
        course,
        courseId: course._id,
        reason: buildExamFailureReason(course, examDays, venueExamMatrix, venues),
      });
    }
  }

  // Add unschedulable courses
  for (const us of unschedulable) {
    failedExams.push({
      course: us.course,
      courseId: us.course._id,
      reason: us.reason,
    });
  }

  // ──────────────────────────────────────────
  // STEP 5 — COLLECT SOFT VIOLATIONS
  // ──────────────────────────────────────────
  const softViolations = [];

  for (const [clusterKey, dates] of Object.entries(clusterDateMatrix)) {
    for (const [dateStr, count] of Object.entries(dates)) {
      if (count > 1) {
        const [deptId, level] = clusterKey.split('_');
        const clashingCourses = examEntries
          .filter((e) => {
            const eCourseRef = e._courseRef;
            return eCourseRef?.department?._id?.toString() === deptId &&
              eCourseRef?.level === Number(level) &&
              e.examDate?.toISOString().split('T')[0] === dateStr;
          })
          .map((e) => e._courseRef?.code || 'Unknown');

        if (clashingCourses.length > 1) {
          const deptName = examEntries.find((e) => e._courseRef?.department?._id?.toString() === deptId)?._courseRef?.department?.name || 'Unknown';
          softViolations.push(
            `Clash: ${clashingCourses.join(' and ')} (Level ${level} ${deptName}) are on the same exam date (${dateStr})`
          );
        }
      }
    }
  }

  // ──────────────────────────────────────────
  // STEP 6 — SAVE AND RETURN
  // ──────────────────────────────────────────
  const prevRun = await SchedulingRun.findOne({ semester: semesterId, runType: 'exam' }).sort({ version: -1 });
  const version = (prevRun?.version || 0) + 1;

  // Save entries
  const savedEntries = [];
  for (const entry of examEntries) {
    const { _courseRef, ...saveData } = entry;
    const saved = await TimetableEntry.create(saveData);
    savedEntries.push(saved);
  }

  const placementRate = courses.length > 0
    ? Math.round((examEntries.length / courses.length) * 1000) / 10
    : 100;

  // Save run
  const run = await SchedulingRun.create({
    semester: semesterId,
    runType: 'exam',
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
      fullyScheduled: examEntries.length,
      partiallyScheduled: 0,
      unscheduled: failedExams.length,
      totalSessionsPlaced: examEntries.length,
    },
    failedCourses: failedExams.map((f) => ({
      course: f.courseId || f.course._id,
      sessionsNeeded: 1,
      sessionsPlaced: 0,
      reason: f.reason,
    })),
    softConstraintViolations: softViolations,
  });

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
    failedExams: failedExams.map((f) => ({
      course: f.course._id || f.courseId,
      code: f.course.code,
      name: f.course.name,
      enrollment: f.course.estimatedStudents,
      reason: f.reason,
    })),
    softConstraintViolations: softViolations,
  };
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

function getDayName(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
}

function buildExamFailureReason(course, examDays, venueMatrix, venues) {
  const enrollment = course.estimatedStudents || 0;
  const maxCap = venues.reduce((sum, v) => sum + (v.capacityExam || Math.floor(v.capacity * 0.5)), 0);

  if (maxCap < enrollment) {
    return `Total exam capacity across all venues (${maxCap}) is insufficient for enrollment (${enrollment})`;
  }

  return `No contiguous time slots have enough combined venue capacity available for ${enrollment} students. All suitable slot windows are fully booked.`;
}

export default { generateExamTimetable };
