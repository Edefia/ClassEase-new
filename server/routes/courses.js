// routes/courses.js
import express from 'express';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

async function checkDeadline(semesterId) {
  if (!semesterId) return null;
  const semester = await Semester.findById(semesterId);
  if (semester && semester.submissionDeadline && new Date() > new Date(semester.submissionDeadline)) {
    return 'The submission deadline for this semester has passed. You can no longer add, modify, or delete courses.';
  }
  return null;
}

// GET all courses (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { department, level, semester, academicYear, lecturer, active } = req.query;
    const query = {};
    if (department) query.department = department;
    if (level) query.level = Number(level);
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (lecturer) query.lecturer = lecturer;
    if (active !== undefined) query.isActive = active === 'true';

    const courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('lecturer', 'name email')
      .populate('lecturers', 'name email')
      .sort({ code: 1 });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name code')
      .populate('lecturer', 'name email')
      .populate('lecturers', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create course (admin, department_coordinator)
router.post('/', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    // Check uniqueness per-semester (not globally) to allow the same course code in different semesters
    if (req.body.code && req.body.semester) {
      const exists = await Course.findOne({ code: req.body.code.toUpperCase(), semester: req.body.semester });
      if (exists) return res.status(400).json({ error: 'A course with this code already exists in this semester.' });
    }

    if (req.body.semester) {
      const deadlineError = await checkDeadline(req.body.semester);
      if (deadlineError) return res.status(403).json({ error: deadlineError });
    }

    const course = new Course(req.body);
    await course.save();
    const populated = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate('lecturer', 'name email')
      .populate('lecturers', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A course with this code already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update course
router.put('/:id', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) return res.status(404).json({ error: 'Course not found' });

    const deadlineError = await checkDeadline(existingCourse.semester);
    if (deadlineError) return res.status(403).json({ error: deadlineError });

    if (req.body.semester && String(req.body.semester) !== String(existingCourse.semester)) {
      const newDeadlineError = await checkDeadline(req.body.semester);
      if (newDeadlineError) return res.status(403).json({ error: newDeadlineError });
    }

    // If edited after being approved, revert back to submitted so Academic Affairs can review again
    if (existingCourse.submissionStatus === 'approved') {
      req.body.submissionStatus = 'submitted';
      req.body.approvedBy = null;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('department', 'name code')
      .populate('lecturer', 'name email')
      .populate('lecturers', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE course (admin or department_coordinator)
router.delete('/:id', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) return res.status(404).json({ error: 'Course not found' });

    const deadlineError = await checkDeadline(existingCourse.semester);
    if (deadlineError) return res.status(403).json({ error: deadlineError });

    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
