import express from 'express';
import Venue from '../models/Venue.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all venues
// @route   GET /api/venues
// @access  Public
router.get('/', async (req, res) => {
  try {
    const venues = await Venue.find({ isActive: true });
    res.json(venues);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Create a venue
// @route   POST /api/venues
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a venue
// @route   PUT /api/venues/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    Object.assign(venue, req.body);
    const updatedVenue = await venue.save();
    res.json(updatedVenue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a venue
// @route   DELETE /api/venues/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Soft delete by setting isActive to false
    venue.isActive = false;
    await venue.save();
    
    res.json({ message: 'Venue removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get venue by ID
// @route   GET /api/venues/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue || !venue.isActive) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 