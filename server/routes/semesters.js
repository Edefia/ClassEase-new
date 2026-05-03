// routes/semesters.js
import express from 'express';
import Semester from '../models/Semester.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

// GET all semesters
router.get('/', async (req, res) => {
  try {
    const { status, academicYear } = req.query;
    const query = {};
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const semesters = await Semester.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });

    res.json(semesters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active semester
router.get('/active', async (req, res) => {
  try {
    const semester = await Semester.findOne({
      status: { $in: ['active', 'exam_period'] },
    }).populate('createdBy', 'name');

    if (!semester) return res.status(404).json({ error: 'No active semester found' });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single semester
router.get('/:id', async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create semester
router.post('/', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const semester = new Semester({
      ...req.body,
      createdBy: req.user.id,
    });
    await semester.save();
    res.status(201).json(semester);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A semester with this name and academic year already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update semester
router.put('/:id', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json(semester);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update semester status
router.put('/:id/status', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      setup: ['active'],
      active: ['exam_period', 'closed'],
      exam_period: ['active', 'closed'],
      closed: ['setup'],
    };

    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const allowed = validTransitions[semester.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${semester.status}' to '${status}'. Allowed: ${allowed.join(', ')}`,
      });
    }

    semester.status = status;
    await semester.save();
    res.json(semester);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE semester
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json({ message: 'Semester deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
