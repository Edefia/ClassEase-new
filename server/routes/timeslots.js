// routes/timeslots.js
import express from 'express';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

// GET all time slot templates
router.get('/', async (req, res) => {
  try {
    const { dayOfWeek, active } = req.query;
    const query = {};
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (active !== undefined) query.isActive = active === 'true';

    const slots = await TimeSlotTemplate.find(query)
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create single time slot
router.post('/', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const slot = new TimeSlotTemplate(req.body);
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A time slot for this day and start time already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// POST bulk create — generates default periods for all weekdays
router.post('/bulk', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { periods, days } = req.body;

    // Default periods if not specified
    const defaultPeriods = periods || [
      { label: 'Period 1', startTime: '07:00', endTime: '09:00' },
      { label: 'Period 2', startTime: '09:00', endTime: '11:00' },
      { label: 'Period 3', startTime: '11:00', endTime: '13:00' },
      { label: 'Period 4', startTime: '13:00', endTime: '15:00' },
      { label: 'Period 5', startTime: '15:00', endTime: '17:00' },
    ];

    const defaultDays = days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const results = { created: [], skipped: [], errors: [] };

    for (const day of defaultDays) {
      for (const period of defaultPeriods) {
        try {
          // Check if already exists
          const existing = await TimeSlotTemplate.findOne({
            dayOfWeek: day,
            startTime: period.startTime,
          });

          if (existing) {
            results.skipped.push({ day, ...period, reason: 'Already exists' });
            continue;
          }

          const slot = new TimeSlotTemplate({
            label: period.label,
            startTime: period.startTime,
            endTime: period.endTime,
            dayOfWeek: day,
          });
          await slot.save();
          results.created.push(slot);
        } catch (err) {
          results.errors.push({ day, ...period, error: err.message });
        }
      }
    }

    res.status(201).json({
      message: `${results.created.length} slots created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update time slot
router.put('/:id', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const slot = await TimeSlotTemplate.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });

    Object.assign(slot, req.body);
    await slot.save(); // triggers pre-save hook for duration calculation

    res.json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE time slot
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const slot = await TimeSlotTemplate.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });
    res.json({ message: 'Time slot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all time slots (for reset)
router.delete('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await TimeSlotTemplate.deleteMany({});
    res.json({ message: `${result.deletedCount} time slots deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
