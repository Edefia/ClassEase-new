import Semester from '../models/Semester.js';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';
import Department from '../models/Department.js';
import DepartmentSubmission from '../models/DepartmentSubmission.js';
import Course from '../models/Course.js';
import Venue from '../models/Venue.js';

export async function runPreflightCheck(semesterId) {
  const errors = [];
  const warnings = [];

  const semester = await Semester.findById(semesterId);
  if (!semester) {
    return { passed: false, errors: ['Semester not found'], warnings: [], summary: {} };
  }

  // 1. Check Semester Status
  if (!['submission_closed', 'scheduling'].includes(semester.status)) {
    errors.push("Semester submissions are still open or not in scheduling state. Close the submission window before generating a timetable.");
  }

  // 2. Check Time Slots
  const timeSlots = await TimeSlotTemplate.find({ isActive: true });
  if (timeSlots.length === 0) {
    errors.push("No time slot periods have been defined. Go to Settings → Time Slots and define the weekly period structure.");
  }

  // 3. Check Department Submissions
  const allDepartments = await Department.find();
  const allSubmissions = await DepartmentSubmission.find({ semester: semesterId });
  let approvedDepartments = 0;

  for (const dept of allDepartments) {
    const submission = allSubmissions.find(s => s.department.toString() === dept._id.toString());
    if (!submission || submission.status === 'not_started') {
      errors.push(`${dept.name} has not submitted any courses.`);
    } else if (submission.status === 'draft') {
      errors.push(`${dept.name} has saved a draft but not submitted yet.`);
    } else if (submission.status === 'submitted') {
      errors.push(`${dept.name} submitted but Academic Affairs has not approved yet. Approve all submissions before running.`);
    } else if (submission.status === 'rejected') {
      errors.push(`${dept.name}'s submission was rejected and has not been resubmitted. Contact the department coordinator.`);
    } else if (submission.status === 'approved') {
      approvedDepartments++;
    }
  }

  // Fetch approved courses
  const approvedCourses = await Course.find({
    semesterRef: semesterId,
    submissionStatus: 'approved',
    isActive: true,
  }).populate('department', 'name code');

  let coursesWithPracticalsCount = 0;
  let coursesWithGroupsCount = 0;
  let totalGroupSessionsCount = 0;
  let totalHoursNeeded = 0;

  const allVenues = await Venue.find({ isAvailable: true });
  const labVenues = allVenues.filter(v => v.type === 'Lab' || v.type === 'lab');
  const lectureVenues = allVenues.filter(v => v.type !== 'Lab' && v.type !== 'lab');

  for (const course of approvedCourses) {
    const studentsPerGroup = course.studentsPerGroup || 0;
    
    // 4. Check Lecturers Assigned
    if (!course.lecturers || course.lecturers.length === 0) {
      if (!course.lecturer) {
        errors.push(`${course.code} — ${course.name} (${course.department?.name}, Level ${course.level}) has no lecturer assigned.`);
      }
    }

    // Accumulate hours for capacity check
    const coursePracticalHours = course.practicalHoursPerWeek || 0;
    const courseCreditHours = course.creditHours || 3;
    const courseGroups = course.numberOfGroups || 1;
    
    totalHoursNeeded += (courseCreditHours + coursePracticalHours) * courseGroups;
    totalGroupSessionsCount += courseGroups;
    if (courseGroups > 1) coursesWithGroupsCount++;

    // 5. Check Practical Hours Venues
    if (coursePracticalHours > 0) {
      coursesWithPracticalsCount++;
      if (labVenues.length === 0) {
        if (!errors.includes("There are courses with practical hours but NO lab venues exist in the system. Add lab venues before scheduling.")) {
           errors.push("There are courses with practical hours but NO lab venues exist in the system. Add lab venues before scheduling.");
        }
      } else {
        const suitableLabs = labVenues.filter(l => l.capacity >= studentsPerGroup);
        if (suitableLabs.length === 0) {
          warnings.push(`${course.code}: practical sessions need a lab for ${studentsPerGroup} students but no lab is large enough. Practical sessions may go unscheduled.`);
        }
      }
    }

    // 6. Check Group Courses Venue Availability
    if (courseGroups > 1) {
      const suitableVenues = lectureVenues.filter(v => v.capacity >= studentsPerGroup);
      if (suitableVenues.length < courseGroups) {
        warnings.push(`${course.code} has ${courseGroups} groups but only ${suitableVenues.length} suitable venue(s) exist for lectures. Some groups may be unscheduled.`);
      }
    }
  }

  // 7. Check Credit Load vs Available Slots
  const totalSlotHours = timeSlots.length * 2; // Rough estimate assuming 2 hours per slot
  const totalCapacity = totalSlotHours * lectureVenues.length;
  if (totalHoursNeeded > totalCapacity * 0.85) {
    warnings.push("The total course load may exceed available scheduling capacity. The engine will place as many as possible but some courses may be unscheduled. Consider adding venues or time slots.");
  }

  // 8. Check Exam Period Configured
  if (!semester.examPeriod?.startDate || !semester.examPeriod?.endDate) {
    warnings.push("Exam period dates are not configured. You will not be able to generate an exam timetable.");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalDepartments: allDepartments.length,
      approvedDepartments,
      totalCourses: approvedCourses.length,
      coursesWithPracticals: coursesWithPracticalsCount,
      coursesWithGroups: coursesWithGroupsCount,
      totalGroupSessions: totalGroupSessionsCount,
    }
  };
}
