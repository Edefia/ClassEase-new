import express from 'express';
import Booking from '../models/Booking.js';
import verifyToken from '../middleware/authMiddleware.js';
const router = express.Router();

// Create a booking
router.post('/', verifyToken, async (req, res) => {
  const { venue, date, timeStart, timeEnd, purpose } = req.body;

  const existing = await Booking.findOne({
    venue,
    date,
    timeStart: { $lt: timeEnd },
    timeEnd: { $gt: timeStart },
    status: 'approved'
  });

  if (existing) return res.status(409).json({ message: "Conflict with existing booking" });

  try {
    const booking = await Booking.create({
      user: req.user.id,
      venue,
      date,
      timeStart,
      timeEnd,
      purpose,
      status: 'pending' 
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve or decline bookings
router.put('/:id/approve', verifyToken, async (req, res) => {
  const updated = await Booking.findByIdAndUpdate(req.params.id, {
    status: 'approved',
    reviewedBy: req.user.id
  }, { new: true });

  res.json(updated);
});

router.put('/:id/decline', verifyToken, async (req, res) => {
  const updated = await Booking.findByIdAndUpdate(req.params.id, {
    status: 'declined',
    reviewedBy: req.user.id,
    reasonIfDeclined: req.body.reason
  }, { new: true });

  res.json(updated);
});

// Get bookings by user or all
router.get('/', verifyToken, async (req, res) => {
  const query = req.user.role === 'manager' ? {} : { user: req.user.id };
  const bookings = await Booking.find(query).populate('venue user');
  res.json(bookings);
});

export default router;
