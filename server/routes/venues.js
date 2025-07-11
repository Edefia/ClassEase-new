import express from 'express';
import Venue from '../models/Venue.js';
import verifyToken from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import Building from '../models/Building.js';
const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get all venues
router.get('/', async (req, res) => {
  const venues = await Venue.find().populate('building');
  res.json(venues);
});

// Add new venue (admin/manager only)
router.post('/', verifyToken, async (req, res) => {
  const { building, ...venueData } = req.body;
  if (!building) {
    return res.status(400).json({ error: 'Building is required.' });
  }
  // Validate building exists
  const buildingExists = await Building.findById(building);
  if (!buildingExists) {
    return res.status(400).json({ error: 'Invalid building.' });
  }
  const venue = new Venue({ ...venueData, building });
  try {
    const saved = await venue.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the relative path to the uploaded file
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Update a venue (admin/manager only)
router.put('/:id', verifyToken, async (req, res) => {
  const { building, ...venueData } = req.body;
  if (building) {
    // Validate building exists
    const buildingExists = await Building.findById(building);
    if (!buildingExists) {
      return res.status(400).json({ error: 'Invalid building.' });
    }
  }
  try {
    const updated = await Venue.findByIdAndUpdate(
      req.params.id,
      { ...venueData, ...(building ? { building } : {}) },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a venue (admin/manager only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Venue.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json({ message: 'Venue deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
