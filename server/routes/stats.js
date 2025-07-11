import express from 'express';
import Department from '../models/Department.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// GET /api/stats - Returns counts for departments, venues, users, bookings
router.get('/', async (req, res) => {
  try {
    const [departments, venues, users, bookings] = await Promise.all([
      Department.countDocuments(),
      Venue.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments()
    ]);
    res.json({ departments, venues, users, bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 