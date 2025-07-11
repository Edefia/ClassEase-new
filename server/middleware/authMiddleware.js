import jwt from 'jsonwebtoken';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Ensure req.user._id is set for downstream logic
    if (decoded._id) {
      req.user._id = decoded._id;
    } else if (decoded.id) {
      req.user._id = decoded.id;
    }
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}

export default verifyToken;
