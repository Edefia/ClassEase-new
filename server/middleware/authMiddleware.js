import jwt from 'jsonwebtoken';
import User from '../models/User.js';

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user to ensure we have the latest data like department
    const user = await User.findById(decoded._id || decoded.id).lean();
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}

export default verifyToken;
