// routes/semesters.js
import express from 'express';
import Semester from '../models/Semester.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

async function autoUpdateSemesterStatuses() {
  try {
    const now = new Date();
    const semesters = await Semester.find({ status: { $ne: 'closed' } });
    for (const s of semesters) {
      let newStatus = s.status;
      const end = new Date(s.endDate);
      end.setHours(23, 59, 59, 999);
      
      if (now > end) {
        newStatus = 'closed';
      } else if (s.examPeriod?.startDate && s.examPeriod?.endDate) {
        const examStart = new Date(s.examPeriod.startDate);
        examStart.setHours(0, 0, 0, 0);
        const examEnd = new Date(s.examPeriod.endDate);
        examEnd.setHours(23, 59, 59, 999);
        
        if (now >= examStart && now <= examEnd) {
          newStatus = 'exam_period';
        }
      }
      
      if (newStatus !== s.status) {
        s.status = newStatus;
        await s.save();
      }
    }
  } catch (err) {
    console.error('Auto-update statuses error:', err);
  }
}

// GET all semesters
router.get('/', async (req, res) => {
  try {
    await autoUpdateSemesterStatuses();
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
    await autoUpdateSemesterStatuses();
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
    const semester = await Semester.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
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
