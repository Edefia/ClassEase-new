import express from 'express';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
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

    // Create notification for booking creation
    if (created.length > 0) {
      const booking = created[0];
      await Notification.create({
        title: 'Booking Request Submitted',
        message: `Your booking request for ${booking.venue} on ${booking.date} has been submitted and is pending approval.`,
        type: 'info',
        recipient_type: 'specific',
        recipients: [req.user.id],
        sender: req.user.id,
        category: 'booking',
        metadata: { booking_id: booking._id, action: 'created' }
      });
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve or decline bookings
router.put('/:id/approve', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue user');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

  const updated = await Booking.findByIdAndUpdate(req.params.id, {
    status: 'approved',
    reviewedBy: req.user.id
  }, { new: true });

    // Create notification for approval
    await Notification.create({
      title: 'Booking Approved',
      message: `Your booking for ${booking.venue?.name || 'venue'} on ${booking.date} has been approved.`,
      type: 'success',
      recipient_type: 'specific',
      recipients: [booking.user],
      sender: req.user.id,
      category: 'booking',
      metadata: { booking_id: booking._id, action: 'approved' }
    });

  res.json(updated);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

router.put('/:id/decline', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue user');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

  const updated = await Booking.findByIdAndUpdate(req.params.id, {
    status: 'declined',
    reviewedBy: req.user.id,
    reasonIfDeclined: req.body.reason
  }, { new: true });

    // Create notification for decline
    let message = `Your booking for ${booking.venue?.name || 'venue'} on ${booking.date} has been declined.`;
    if (req.body.reason) {
      message += ` Reason: ${req.body.reason}`;
    }

    await Notification.create({
      title: 'Booking Declined',
      message,
      type: 'error',
      recipient_type: 'specific',
      recipients: [booking.user],
      sender: req.user.id,
      category: 'booking',
      metadata: { booking_id: booking._id, action: 'declined', reason: req.body.reason }
    });

  res.json(updated);
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
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
