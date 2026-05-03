// routes/courses.js
import express from 'express';
import Course from '../models/Course.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

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
      .populate('lecturer', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create course (admin, department_coordinator)
router.post('/', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    const populated = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate('lecturer', 'name email');
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
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('department', 'name code')
      .populate('lecturer', 'name email');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE course
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
