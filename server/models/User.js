// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
    enum: ['student', 'lecturer', 'manager', 'admin', 'department_coordinator', 'academic_affairs'],
    default: 'student',
  },
  department: {
    type: String,
    default: null,
  },
  // Student academic level (100–600)
  level: {
    type: Number,
    enum: [100, 200, 300, 400, 500, 600],
    default: null,
  },
  profileImage: {
    type: String,
    default: null,
  },
  studentId: {
    type: String,
    default: null,
  },
  staffId: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Exclude passwordHash from JSON output by default
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
