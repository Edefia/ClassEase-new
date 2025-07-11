import express from 'express';
import User from '../models/User.js';
import verifyToken from '../middleware/authMiddleware.js';
const router = express.Router();

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all users
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add user (admin only, with password)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const hashed = await import('bcryptjs').then(b => b.hash(password, 10));
    const user = await User.create({ name, email, passwordHash: hashed, role, department });
    res.status(201).json({ message: 'User created', user: { ...user.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 