// models/Course.js
import mongoose from 'mongoose';

const sessionTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lecture', 'tutorial', 'lab'],
    required: true,
  },
  hoursPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true, // e.g., "CSC 101"
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  level: {
    type: Number,
    enum: [100, 200, 300, 400, 500, 600],
    required: true,
  },
  creditHours: {
    type: Number,
    default: 3,
    min: 1,
    max: 6,
  },
  // Session types for the scheduling engine
  // e.g., [{ type: 'lecture', hoursPerWeek: 2 }, { type: 'tutorial', hoursPerWeek: 1 }]
  sessionTypes: {
    type: [sessionTypeSchema],
    default: [],
  },

  // --- Semester scoping ---
  // New: ObjectId reference to Semester model (for scheduling engine)
  semesterRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null,
  },
  // Legacy: string-based semester field (kept for backward compat)
  semester: {
    type: String,
    enum: ['first', 'second', 'summer'],
    default: 'first',
  },
  academicYear: {
    type: String,
    default: '2025/2026',
  },

  expectedEnrollment: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Virtual: compute default session types from credit hours if not specified
courseSchema.virtual('effectiveSessionTypes').get(function () {
  if (this.sessionTypes && this.sessionTypes.length > 0) {
    return this.sessionTypes;
  }
  // Default mapping based on credit hours:
  // 3 credits = 2hr lecture + 1hr tutorial
  // 2 credits = 2hr lecture
  // 1 credit = 1hr lecture
  const ch = this.creditHours || 3;
  if (ch >= 3) {
    return [
      { type: 'lecture', hoursPerWeek: 2 },
      { type: 'tutorial', hoursPerWeek: ch - 2 },
    ];
  } else if (ch === 2) {
    return [{ type: 'lecture', hoursPerWeek: 2 }];
  } else {
    return [{ type: 'lecture', hoursPerWeek: 1 }];
  }
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Course', courseSchema);
