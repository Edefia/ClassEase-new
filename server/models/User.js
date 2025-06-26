// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'manager', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
