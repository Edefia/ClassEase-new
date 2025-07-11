import express from 'express';
import Building from '../models/Building.js';
import User from '../models/User.js';
import verifyToken from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
const router = express.Router();

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all buildings (populate manager)
router.get('/', verifyToken, async (req, res) => {
  try {
    const buildings = await Building.find().populate('manager', 'name email role');
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add building
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;
    const building = await Building.create({ name, code, description, manager });
    res.status(201).json(building);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update building
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;
    const updated = await Building.findByIdAndUpdate(
      req.params.id,
      { name, code, description, manager },
      { new: true, runValidators: true }
    ).populate('manager', 'name email role');
    if (!updated) return res.status(404).json({ error: 'Building not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete building
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Building.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Building not found' });
    res.json({ message: 'Building deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get buildings managed by the current manager
router.get('/managed', verifyToken, async (req, res) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  try {
    const managerObjectId = new mongoose.Types.ObjectId(req.user._id);
    const buildings = await Building.find({ manager: managerObjectId }).populate('manager', 'name email role');
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 