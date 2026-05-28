// seed.js — Run with: node seed.js
// Seeds demo data: departments, courses, buildings, venues, users, semesters, timeslots
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Department from './models/Department.js';
import Building from './models/Building.js';
import Venue from './models/Venue.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Semester from './models/Semester.js';
import TimeSlotTemplate from './models/TimeSlotTemplate.js';

const MONGO_URI = process.env.MONGO_URI;

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ─── Departments ────────────────────────────────────────────
  const deptData = [
    { name: 'Computer Science', code: 'CSC', faculty: 'Faculty of Physical & Computational Sciences' },
    { name: 'Mathematics', code: 'MAT', faculty: 'Faculty of Physical & Computational Sciences' },
    { name: 'Physics', code: 'PHY', faculty: 'Faculty of Physical & Computational Sciences' },
    { name: 'Education', code: 'EDU', faculty: 'Faculty of Educational Foundations' },
    { name: 'Business Administration', code: 'BUS', faculty: 'School of Business' },
  ];

  const departments = [];
  for (const d of deptData) {
    const existing = await Department.findOne({ code: d.code });
    if (existing) { departments.push(existing); continue; }
    departments.push(await Department.create(d));
  }
  console.log(`📚 ${departments.length} departments ready`);

  // ─── Buildings ──────────────────────────────────────────────
  const buildingData = [
    { name: 'Science Faculty Building', location: 'North Campus' },
    { name: 'Old Lecture Block', location: 'Central Campus' },
    { name: 'New Lecture Theatre', location: 'South Campus' },
    { name: 'School of Business Block', location: 'Central Campus' },
  ];

  const buildings = [];
  for (const b of buildingData) {
    const existing = await Building.findOne({ name: b.name });
    if (existing) { buildings.push(existing); continue; }
    buildings.push(await Building.create(b));
  }
  console.log(`🏛  ${buildings.length} buildings ready`);

  // ─── Venues ─────────────────────────────────────────────────
  const venueData = [
    { name: 'CALC 1', type: 'Lecture Hall', capacity: 300, capacityExam: 150, building: buildings[0]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC'] },
    { name: 'CALC 2', type: 'Lecture Hall', capacity: 200, capacityExam: 100, building: buildings[0]._id, floor: 'First Floor', equipment: ['Projector', 'AC'] },
    { name: 'SW 1', type: 'Lecture Hall', capacity: 400, capacityExam: 200, building: buildings[1]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC', 'WiFi'] },
    { name: 'SW 2', type: 'Lecture Hall', capacity: 350, capacityExam: 175, building: buildings[1]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC'] },
    { name: 'NDL 1', type: 'Lecture Hall', capacity: 500, capacityExam: 250, building: buildings[2]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC', 'WiFi'] },
    { name: 'NDL 2', type: 'Seminar Room', capacity: 80, building: buildings[2]._id, floor: 'First Floor', equipment: ['Projector', 'Whiteboard'] },
    { name: 'LL 1', type: 'Auditorium', capacity: 800, capacityExam: 400, building: buildings[2]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC', 'Sound System'] },
    { name: 'LL 2', type: 'Auditorium', capacity: 600, capacityExam: 300, building: buildings[2]._id, floor: 'Ground Floor', equipment: ['Projector', 'Microphone', 'AC'] },
    { name: 'SBB 201', type: 'Lecture Hall', capacity: 150, capacityExam: 75, building: buildings[3]._id, floor: 'First Floor', equipment: ['Projector', 'AC', 'WiFi'] },
    { name: 'SBB Seminar Room', type: 'Seminar Room', capacity: 50, building: buildings[3]._id, floor: 'Second Floor', equipment: ['Projector', 'Whiteboard', 'AC'] },
    { name: 'CSC Lab A', type: 'Lab', capacity: 60, building: buildings[0]._id, floor: 'Second Floor', equipment: ['Computers', 'Projector', 'AC', 'WiFi'] },
    { name: 'CSC Lab B', type: 'Lab', capacity: 40, building: buildings[0]._id, floor: 'Second Floor', equipment: ['Computers', 'Projector', 'WiFi'] },
  ];

  const venues = [];
  for (const v of venueData) {
    const existing = await Venue.findOne({ name: v.name });
    if (existing) { venues.push(existing); continue; }
    venues.push(await Venue.create(v));
  }
  console.log(`🏫 ${venues.length} venues ready`);

  // ─── Users ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const userData = [
    { name: 'Admin User', email: 'admin@ucc.edu.gh', passwordHash, role: 'admin', department: departments[0]._id },
    { name: 'Dr. Kwame Asante', email: 'k.asante@ucc.edu.gh', passwordHash, role: 'lecturer', department: departments[0]._id, staffId: 'STF001' },
    { name: 'Dr. Ama Mensah', email: 'a.mensah@ucc.edu.gh', passwordHash, role: 'lecturer', department: departments[1]._id, staffId: 'STF002' },
    { name: 'Dr. Kofi Owusu', email: 'k.owusu@ucc.edu.gh', passwordHash, role: 'department_coordinator', department: departments[0]._id, staffId: 'STF003' },
    { name: 'Prof. Esi Adomako', email: 'e.adomako@ucc.edu.gh', passwordHash, role: 'lecturer', department: departments[2]._id, staffId: 'STF004' },
    { name: 'Venue Manager', email: 'manager@ucc.edu.gh', passwordHash, role: 'manager', department: departments[0]._id, staffId: 'STF005' },
    { name: 'Yaa Serwah', email: 'y.serwah@ucc.edu.gh', passwordHash, role: 'student', department: departments[0]._id, studentId: 'PS/CSC/22/0001', level: 200 },
    { name: 'Kwesi Annan', email: 'k.annan@ucc.edu.gh', passwordHash, role: 'student', department: departments[1]._id, studentId: 'PS/MAT/22/0002', level: 200 },
    { name: 'Dr. Abena Boateng', email: 'a.boateng@ucc.edu.gh', passwordHash, role: 'lecturer', department: departments[3]._id, staffId: 'STF006' },
    { name: 'Dr. Francis Mensah', email: 'f.mensah@ucc.edu.gh', passwordHash, role: 'lecturer', department: departments[4]._id, staffId: 'STF007' },
    { name: 'Academic Affairs', email: 'acad.affairs@ucc.edu.gh', passwordHash, role: 'academic_affairs', department: departments[0]._id, staffId: 'STF008' },
  ];

  const users = [];
  for (const u of userData) {
    const existing = await User.findOne({ email: u.email });
    if (existing) { users.push(existing); continue; }
    users.push(await User.create(u));
  }
  console.log(`👤 ${users.length} users ready`);

  // ─── Assign coordinator to CSC department ───────────────────
  const coordinator = users.find((u) => u.role === 'department_coordinator');
  if (coordinator) {
    await Department.findByIdAndUpdate(departments[0]._id, { coordinator: coordinator._id });
    console.log('📋 Coordinator assigned to Computer Science');
  }

  // ─── Assign manager to buildings ────────────────────────────
  const manager = users.find((u) => u.role === 'manager');
  if (manager) {
    for (const b of buildings) {
      await Building.findByIdAndUpdate(b._id, { manager: manager._id });
    }
    console.log('🏛  Manager assigned to all buildings');
  }

  // ─── Lecturers lookup ───────────────────────────────────────
  const lecCSC1 = users.find((u) => u.email === 'k.asante@ucc.edu.gh');
  const lecMAT = users.find((u) => u.email === 'a.mensah@ucc.edu.gh');
  const lecPHY = users.find((u) => u.email === 'e.adomako@ucc.edu.gh');
  const lecEDU = users.find((u) => u.email === 'a.boateng@ucc.edu.gh');
  const lecBUS = users.find((u) => u.email === 'f.mensah@ucc.edu.gh');
  const lecCSC2 = coordinator; // dept coordinator also teaches

  // ─── Courses (30+ across departments) ───────────────────────
  const courseData = [
    // Computer Science (8 courses)
    { code: 'CSC 101', name: 'Introduction to Computer Science', department: departments[0]._id, lecturers: [lecCSC1?._id], level: 100, creditHours: 3, estimatedStudents: 250, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 103', name: 'Introduction to Programming', department: departments[0]._id, lecturers: [lecCSC2?._id, lecCSC1?._id], level: 100, creditHours: 3, estimatedStudents: 250, courseType: 'practical', practicalHoursPerWeek: 1, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 201', name: 'Data Structures & Algorithms', department: departments[0]._id, lecturers: [lecCSC1?._id], level: 200, creditHours: 3, estimatedStudents: 180, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 203', name: 'Object-Oriented Programming', department: departments[0]._id, lecturers: [lecCSC2?._id], level: 200, creditHours: 3, estimatedStudents: 180, courseType: 'practical', practicalHoursPerWeek: 1, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 301', name: 'Operating Systems', department: departments[0]._id, lecturers: [lecCSC2?._id], level: 300, creditHours: 3, estimatedStudents: 120, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 303', name: 'Database Systems', department: departments[0]._id, lecturers: [lecCSC1?._id], level: 300, creditHours: 3, estimatedStudents: 130, courseType: 'practical', practicalHoursPerWeek: 1, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 305', name: 'Computer Networks', department: departments[0]._id, lecturers: [lecCSC1?._id], level: 300, creditHours: 2, estimatedStudents: 110, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'CSC 401', name: 'Artificial Intelligence', department: departments[0]._id, lecturers: [lecCSC2?._id], level: 400, creditHours: 3, estimatedStudents: 90, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    // Mathematics (6 courses)
    { code: 'MAT 101', name: 'Calculus I', department: departments[1]._id, lecturers: [lecMAT?._id], level: 100, creditHours: 3, estimatedStudents: 400, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'MAT 103', name: 'Statistics I', department: departments[1]._id, lecturers: [lecMAT?._id], level: 100, creditHours: 3, estimatedStudents: 350, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'MAT 201', name: 'Linear Algebra', department: departments[1]._id, lecturers: [lecMAT?._id], level: 200, creditHours: 3, estimatedStudents: 200, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'MAT 203', name: 'Differential Equations', department: departments[1]._id, lecturers: [lecMAT?._id], level: 200, creditHours: 2, estimatedStudents: 180, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'MAT 301', name: 'Real Analysis', department: departments[1]._id, lecturers: [lecMAT?._id], level: 300, creditHours: 3, estimatedStudents: 100, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'MAT 303', name: 'Numerical Methods', department: departments[1]._id, lecturers: [lecMAT?._id], level: 300, creditHours: 3, estimatedStudents: 90, courseType: 'practical', practicalHoursPerWeek: 1, isNewCourse: false, submissionStatus: 'approved' },
    // Physics (5 courses)
    { code: 'PHY 101', name: 'Mechanics', department: departments[2]._id, lecturers: [lecPHY?._id], level: 100, creditHours: 3, estimatedStudents: 350, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'PHY 103', name: 'Thermal Physics', department: departments[2]._id, lecturers: [lecPHY?._id], level: 100, creditHours: 2, estimatedStudents: 300, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'PHY 201', name: 'Electromagnetism', department: departments[2]._id, lecturers: [lecPHY?._id], level: 200, creditHours: 3, estimatedStudents: 180, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'PHY 203', name: 'Optics', department: departments[2]._id, lecturers: [lecPHY?._id], level: 200, creditHours: 2, estimatedStudents: 160, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'PHY 301', name: 'Quantum Mechanics', department: departments[2]._id, lecturers: [lecPHY?._id], level: 300, creditHours: 3, estimatedStudents: 80, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    // Education (5 courses)
    { code: 'EDU 101', name: 'Foundations of Education', department: departments[3]._id, lecturers: [lecEDU?._id], level: 100, creditHours: 3, estimatedStudents: 300, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'EDU 103', name: 'Educational Psychology', department: departments[3]._id, lecturers: [lecEDU?._id], level: 100, creditHours: 2, estimatedStudents: 280, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'EDU 201', name: 'Curriculum Development', department: departments[3]._id, lecturers: [lecEDU?._id], level: 200, creditHours: 3, estimatedStudents: 200, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'EDU 301', name: 'Teaching Methods', department: departments[3]._id, lecturers: [lecEDU?._id], level: 300, creditHours: 3, estimatedStudents: 150, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'EDU 303', name: 'Assessment & Evaluation', department: departments[3]._id, lecturers: [lecEDU?._id], level: 300, creditHours: 2, estimatedStudents: 140, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    // Business (6 courses)
    { code: 'BUS 101', name: 'Principles of Management', department: departments[4]._id, lecturers: [lecBUS?._id], level: 100, creditHours: 3, estimatedStudents: 400, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'BUS 103', name: 'Financial Accounting I', department: departments[4]._id, lecturers: [lecBUS?._id], level: 100, creditHours: 3, estimatedStudents: 380, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'BUS 201', name: 'Marketing Management', department: departments[4]._id, lecturers: [lecBUS?._id], level: 200, creditHours: 3, estimatedStudents: 250, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'BUS 203', name: 'Business Law', department: departments[4]._id, lecturers: [lecBUS?._id], level: 200, creditHours: 2, estimatedStudents: 220, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'BUS 301', name: 'Strategic Management', department: departments[4]._id, lecturers: [lecBUS?._id], level: 300, creditHours: 3, estimatedStudents: 160, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
    { code: 'BUS 303', name: 'Human Resource Management', department: departments[4]._id, lecturers: [lecBUS?._id], level: 300, creditHours: 2, estimatedStudents: 150, courseType: 'theory', practicalHoursPerWeek: 0, isNewCourse: false, submissionStatus: 'approved' },
  ];

  const courses = [];
  for (const c of courseData) {
    const existing = await Course.findOne({ code: c.code });
    if (existing) { courses.push(existing); continue; }
    courses.push(await Course.create(c));
  }
  console.log(`📖 ${courses.length} courses ready`);

  // ─── Default Semester ───────────────────────────────────────
  const semesterData = {
    name: 'First Semester',
    academicYear: '2025/2026',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-20'),
    examPeriod: {
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-19'),
      morningSlot: { start: '08:00', end: '11:00' },
      afternoonSlot: { start: '13:00', end: '16:00' },
    },
    status: 'active',
  };

  let semester = await Semester.findOne({ name: semesterData.name, academicYear: semesterData.academicYear });
  if (!semester) {
    semester = await Semester.create(semesterData);
    console.log('📅 Default semester created');
  } else {
    console.log('📅 Default semester exists');
  }

  // ─── Default Time Slots ─────────────────────────────────────
  const defaultPeriods = [
    { label: 'Period 1', startTime: '07:00', endTime: '09:00' },
    { label: 'Period 2', startTime: '09:00', endTime: '11:00' },
    { label: 'Period 3', startTime: '11:00', endTime: '13:00' },
    { label: 'Period 4', startTime: '13:00', endTime: '15:00' },
    { label: 'Period 5', startTime: '15:00', endTime: '17:00' },
  ];
  const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let slotsCreated = 0;
  for (const day of defaultDays) {
    for (const period of defaultPeriods) {
      const existing = await TimeSlotTemplate.findOne({ dayOfWeek: day, startTime: period.startTime });
      if (!existing) {
        await TimeSlotTemplate.create({ ...period, dayOfWeek: day });
        slotsCreated++;
      }
    }
  }
  console.log(`⏰ ${slotsCreated} time slots created (${30 - slotsCreated} already existed)`);

  console.log('\n✅ Seed complete! Demo credentials:');
  console.log('   Admin:           admin@ucc.edu.gh / password123');
  console.log('   Lecturer:        k.asante@ucc.edu.gh / password123');
  console.log('   Coordinator:     k.owusu@ucc.edu.gh / password123');
  console.log('   Manager:         manager@ucc.edu.gh / password123');
  console.log('   Student:         y.serwah@ucc.edu.gh / password123');
  console.log('   Academic Affairs: acad.affairs@ucc.edu.gh / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
