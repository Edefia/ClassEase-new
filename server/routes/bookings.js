import express from 'express';
import Booking from '../models/Booking.js';
import verifyToken from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
const router = express.Router();

// Create a booking (supports batch for recurring)
router.post('/', verifyToken, async (req, res) => {
  let bookingsToCreate = [];
  if (Array.isArray(req.body.bookings)) {
    bookingsToCreate = req.body.bookings;
  } else {
    bookingsToCreate = [req.body];
  }

  // Check for conflicts for all requested bookings
  for (const b of bookingsToCreate) {
    const existing = await Booking.findOne({
      venue: b.venue,
      date: b.date,
      timeStart: { $lt: b.timeEnd },
      timeEnd: { $gt: b.timeStart },
      status: 'approved'
    });
    if (existing) {
      return res.status(409).json({ message: `Conflict with existing booking on ${b.date} from ${b.timeStart} to ${b.timeEnd}` });
    }
  }

  try {
    const created = await Booking.insertMany(bookingsToCreate.map(b => ({
      user: req.user.id,
      venue: b.venue,
      date: b.date,
      timeStart: b.timeStart,
      timeEnd: b.timeEnd,
      purpose: b.purpose,
      status: 'pending',
      type: b.type || 'once'
    })));
    res.status(201).json(created);
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
  let bookings;
  if (req.user.role === 'admin') {
    // Admin: see all bookings
    bookings = await Booking.find().populate('venue user');
  } else if (req.user.role === 'manager') {
    // Manager: see bookings for venues in their managed buildings
    const managerObjectId = new mongoose.Types.ObjectId(req.user._id);
    const buildings = await (await import('../models/Building.js')).default.find({ manager: managerObjectId });
    const buildingIds = buildings.map(b => b._id);
    const venues = await (await import('../models/Venue.js')).default.find({ building: { $in: buildingIds } });
    const venueIds = venues.map(v => v._id);
    bookings = await Booking.find({ venue: { $in: venueIds } }).populate('venue user');
  } else {
    // Student/lecturer: only their own bookings
    bookings = await Booking.find({ user: req.user.id }).populate('venue user');
  }
  res.json(bookings);
});

export default router;
