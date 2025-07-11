import express from 'express';
import Department from '../models/Department.js';
import verifyToken from '../middleware/authMiddleware.js';
const router = express.Router();

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all departments
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add department
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const dept = await Department.create({ name, code, description });
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update department
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Department not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete department
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 