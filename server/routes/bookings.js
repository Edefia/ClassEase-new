import express from 'express';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { venueId, date, startTime, endTime, purpose } = req.body;

    // Check if venue exists and is active
    const venue = await Venue.findOne({ _id: venueId, isActive: true });
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found or inactive' });
    }

    // Check for booking conflicts
    const isAvailable = await Booking.checkAvailability(venueId, date, startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Venue is already booked for this time slot' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      venue: venueId,
      date,
      startTime,
      endTime,
      purpose
    });

    // Populate venue and user details
    await booking.populate([
      { path: 'venue', select: 'name location capacity image' },
      { path: 'user', select: 'name email role department' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all bookings (filtered by user role)
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Students and lecturers can only see their own bookings
    if (['student', 'lecturer'].includes(req.user.role)) {
      query.user = req.user._id;
    }
    
    // Managers and admins can see all bookings
    const bookings = await Booking.find(query)
      .populate('venue', 'name location capacity image')
      .populate('user', 'name email role department')
      .sort({ date: -1, startTime: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'name location capacity image')
      .populate('user', 'name email role department')
      .populate('approvedBy', 'name email role');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has permission to view this booking
    if (booking.user._id.toString() !== req.user._id.toString() && 
        !['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Approve a booking
// @route   PUT /api/bookings/:id/approve
// @access  Private/Manager
router.put('/:id/approve', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending approval' });
    }

    booking.status = 'approved';
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    
    const updatedBooking = await booking.save();
    await updatedBooking.populate([
      { path: 'venue', select: 'name location capacity image' },
      { path: 'user', select: 'name email role department' },
      { path: 'approvedBy', select: 'name email role' }
    ]);

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Decline a booking
// @route   PUT /api/bookings/:id/decline
// @access  Private/Manager
router.put('/:id/decline', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required for declining a booking' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending approval' });
    }

    booking.status = 'declined';
    booking.declinedReason = reason;
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    
    const updatedBooking = await booking.save();
    await updatedBooking.populate([
      { path: 'venue', select: 'name location capacity image' },
      { path: 'user', select: 'name email role department' },
      { path: 'approvedBy', select: 'name email role' }
    ]);

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 