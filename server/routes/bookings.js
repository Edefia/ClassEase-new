import express from 'express';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import Building from '../models/Building.js';
import Notification from '../models/Notification.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';
import mongoose from 'mongoose';

const router = express.Router();

// Check for booking conflicts (checks both approved AND pending)
async function checkConflicts(venueId, date, timeStart, timeEnd, excludeBookingId = null) {
  const query = {
    venue: venueId,
    date: date,
    timeStart: { $lt: timeEnd },
    timeEnd: { $gt: timeStart },
    status: { $in: ['approved', 'pending'] },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return await Booking.findOne(query);
}

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
    // Also check if venue is under maintenance
    const venue = await Venue.findById(b.venue);
    if (!venue) {
      return res.status(404).json({ message: `Venue not found` });
    }
    if (!venue.isAvailable) {
      return res.status(400).json({ message: `Venue "${venue.name}" is not available` });
    }

    // Check maintenance periods
    if (b.date) {
      const bookingDate = new Date(b.date);
      const underMaintenance = venue.maintenancePeriods.some(
        (p) => bookingDate >= p.startDate && bookingDate <= p.endDate
      );
      if (underMaintenance) {
        return res.status(400).json({
          message: `Venue "${venue.name}" is under maintenance on ${b.date}`
        });
      }
    }

    const conflict = await checkConflicts(b.venue, b.date, b.timeStart, b.timeEnd);
    if (conflict) {
      return res.status(409).json({
        message: `Conflict with existing booking on ${b.date} from ${b.timeStart} to ${b.timeEnd}`
      });
    }
  }

  try {
    const created = await Booking.insertMany(bookingsToCreate.map(b => ({
      user: req.user.id || req.user._id,
      venue: b.venue,
      date: b.date,
      timeStart: b.timeStart,
      timeEnd: b.timeEnd,
      purpose: b.purpose,
      status: 'pending',
      type: b.type || 'once',
      sessionType: b.sessionType || 'one-time',
      recurrencePattern: b.recurrencePattern || undefined,
      isExternal: b.isExternal || false,
      externalOrgName: b.externalOrgName || '',
      externalContactEmail: b.externalContactEmail || '',
    })));

    // Create notification for booking creation
    if (created.length > 0) {
      const booking = created[0];
      try {
        await Notification.create({
          title: 'Booking Request Submitted',
          message: `Your booking request has been submitted and is pending approval.`,
          type: 'info',
          recipient_type: 'specific',
          recipients: [req.user.id || req.user._id],
          sender: req.user.id || req.user._id,
          category: 'booking',
          metadata: { booking_id: booking._id, action: 'created' }
        });
      } catch (notifErr) {
        console.error('Error creating booking notification:', notifErr);
      }
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve booking (manager/admin only)
router.put('/:id/approve', verifyToken, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue user');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Re-check for conflicts before approving
    const conflict = await checkConflicts(
      booking.venue._id || booking.venue,
      booking.date,
      booking.timeStart,
      booking.timeEnd,
      booking._id
    );
    if (conflict) {
      return res.status(409).json({
        message: 'Cannot approve: conflict with another booking'
      });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      reviewedBy: req.user.id || req.user._id,
      reviewNote: req.body.reviewNote || '',
    }, { new: true }).populate('venue user');

    // Create notification for approval
    try {
      await Notification.create({
        title: 'Booking Approved',
        message: `Your booking for ${booking.venue?.name || 'venue'} on ${new Date(booking.date).toLocaleDateString()} has been approved.`,
        type: 'success',
        recipient_type: 'specific',
        recipients: [booking.user._id || booking.user],
        sender: req.user.id || req.user._id,
        category: 'booking',
        metadata: { booking_id: booking._id, action: 'approved' }
      });
    } catch (notifErr) {
      console.error('Error creating approval notification:', notifErr);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// Decline booking (manager/admin only)
router.put('/:id/decline', verifyToken, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue user');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'declined',
      reviewedBy: req.user.id || req.user._id,
      reasonIfDeclined: req.body.reason || '',
      reviewNote: req.body.reviewNote || '',
    }, { new: true }).populate('venue user');

    // Create notification for decline
    let message = `Your booking for ${booking.venue?.name || 'venue'} on ${new Date(booking.date).toLocaleDateString()} has been declined.`;
    if (req.body.reason) {
      message += ` Reason: ${req.body.reason}`;
    }

    try {
      await Notification.create({
        title: 'Booking Declined',
        message,
        type: 'error',
        recipient_type: 'specific',
        recipients: [booking.user._id || booking.user],
        sender: req.user.id || req.user._id,
        category: 'booking',
        metadata: { booking_id: booking._id, action: 'declined', reason: req.body.reason }
      });
    } catch (notifErr) {
      console.error('Error creating decline notification:', notifErr);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

// Get bookings (role-filtered with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, venue, startDate, endDate } = req.query;
    let query = {};

    // Status filter
    if (status) query.status = status;
    if (venue) query.venue = venue;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (req.user.role === 'admin') {
      // Admin: see all bookings
    } else if (req.user.role === 'manager') {
      // Manager: see bookings for venues in their managed buildings
      const managerObjectId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
      const buildings = await Building.find({ manager: managerObjectId });
      const buildingIds = buildings.map(b => b._id);
      const venues = await Venue.find({ building: { $in: buildingIds } });
      const venueIds = venues.map(v => v._id);
      query.venue = { $in: venueIds };
    } else {
      // Student/lecturer/coordinator: only their own bookings
      query.user = req.user.id || req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('venue user reviewedBy')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
