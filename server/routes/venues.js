import express from 'express';
import Venue from '../models/Venue.js';
import verifyToken from '../middleware/authMiddleware.js';
const router = express.Router();

// Get all venues
router.get('/', async (req, res) => {
  const venues = await Venue.find();
  res.json(venues);
});

// Add new venue (admin/manager only)
router.post('/', verifyToken, async (req, res) => {
  const venue = new Venue(req.body);
  try {
    const saved = await venue.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
