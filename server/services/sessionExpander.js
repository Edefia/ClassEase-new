// services/sessionExpander.js

/**
 * Derives lecture sessions from credit hours based on the institution's formula.
 * Formula:
 * - 3 credits = 2 hours + 1 hour
 * - 2 credits = 2 hours
 * - 1 credit = 1 hour
 */
function deriveLectureSessions(creditHours) {
  const sessions = [];
  let remaining = creditHours;

  while (remaining > 0) {
    if (remaining >= 3) {
      sessions.push({ duration: 120, label: 'Lecture (2hr)' });
      sessions.push({ duration: 60, label: 'Lecture (1hr)' });
      remaining -= 3;
    } else if (remaining === 2) {
      sessions.push({ duration: 120, label: 'Lecture (2hr)' });
      remaining -= 2;
    } else {
      sessions.push({ duration: 60, label: 'Lecture (1hr)' });
      remaining -= 1;
    }
  }
  return sessions;
}

/**
 * Derives practical sessions based on practical hours.
 * Assumes a single block of practical hours (e.g., 2 hours = one 120min session).
 * If > 3 hours, splits it up.
 */
function derivePracticalSessions(practicalHours) {
  const sessions = [];
  let remaining = practicalHours;
  
  while (remaining > 0) {
    if (remaining >= 3) {
      sessions.push({ duration: 180, label: 'Practical (3hr)' });
      remaining -= 3;
    } else if (remaining === 2) {
      sessions.push({ duration: 120, label: 'Practical (2hr)' });
      remaining -= 2;
    } else {
      sessions.push({ duration: 60, label: 'Practical (1hr)' });
      remaining -= 1;
    }
  }
  return sessions;
}

export function expandCoursesIntoSessions(approvedCourses) {
  const sessions = [];

  for (const course of approvedCourses) {
    const lectureSessionsNeeded = deriveLectureSessions(course.creditHours || 3);
    const groupsCount = course.numberOfGroups || 1;
    const studentsInGroup = course.studentsPerGroup || course.expectedEnrollment || 0;
    const lecturers = course.lecturers && course.lecturers.length > 0 ? course.lecturers : (course.lecturer ? [course.lecturer] : []);

    for (let groupNum = 1; groupNum <= groupsCount; groupNum++) {
      
      // Expand Lecture Sessions
      for (const lectureSession of lectureSessionsNeeded) {
        sessions.push({
          courseId: course._id.toString(),
          courseCode: course.code,
          courseTitle: course.name,
          course: course,
          entryType: 'lecture',
          groupNumber: groupNum,
          totalGroups: groupsCount,
          studentsInGroup: studentsInGroup,
          lecturers: lecturers,
          department: course.department,
          level: course.level,
          durationMinutes: lectureSession.duration,
          requiredVenueType: ['Lecture Hall', 'Auditorium', 'Seminar Room', 'Other'],
          minimumCapacity: studentsInGroup,
          priority: course.expectedEnrollment || 0,
        });
      }

      // Expand Practical Sessions
      const practicalHours = course.practicalHoursPerWeek || 0;
      if (practicalHours > 0) {
        const practicalSessionsNeeded = derivePracticalSessions(practicalHours);
        for (const practicalSession of practicalSessionsNeeded) {
          sessions.push({
            courseId: course._id.toString(),
            courseCode: course.code,
            courseTitle: course.name,
            course: course,
            entryType: 'practical',
            groupNumber: groupNum,
            totalGroups: groupsCount,
            studentsInGroup: studentsInGroup,
            lecturers: lecturers,
            department: course.department,
            level: course.level,
            durationMinutes: practicalSession.duration,
            requiredVenueType: ['Lab'], // STRICTLY labs for practicals
            minimumCapacity: studentsInGroup,
            priority: course.expectedEnrollment || 0,
          });
        }
      }
    }
  }

  // Sort all sessions: largest enrollment first
  // Within same enrollment: lectures before practicals
  // Within same type: core before elective
  sessions.sort((a, b) => {
    if (b.studentsInGroup !== a.studentsInGroup) {
      return b.studentsInGroup - a.studentsInGroup;
    }
    if (a.entryType === 'lecture' && b.entryType !== 'lecture') return -1;
    if (b.entryType === 'lecture' && a.entryType !== 'lecture') return 1;
    
    const typeA = a.course?.courseType || 'core';
    const typeB = b.course?.courseType || 'core';
    if (typeA === 'core' && typeB !== 'core') return -1;
    if (typeB === 'core' && typeA !== 'core') return 1;

    return 0;
  });

  return sessions;
}
