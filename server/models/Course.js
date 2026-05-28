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
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  level: {
    type: Number,
    enum: [100, 200, 300, 400, 500, 600],
    required: true,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
  courseType: {
    type: String,
    enum: ['core', 'elective'],
    default: 'core',
  },
  creditHours: {
    type: Number,
    default: 3,
    min: 1,
    max: 6,
  },
  practicalHoursPerWeek: {
    type: Number,
    default: 0,
  },
  // Session types for the scheduling engine (Legacy support)
  sessionTypes: {
    type: [sessionTypeSchema],
    default: [],
  },

  // --- Semester scoping ---
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null,
  },
  academicYear: {
    type: String,
    default: '2025/2026',
  },

  estimatedStudents: {
    type: Number,
    default: 0,
  },
  numberOfGroups: {
    type: Number,
    default: 1,
    min: 1,
  },
  studentsPerGroup: {
    type: Number,
    default: 0,
  },
  // Submission workflow
  submissionStatus: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
  },
  approvedAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, suppressReservedKeysWarning: true });

courseSchema.pre('save', function (next) {
  if (this.estimatedStudents > 0 && this.numberOfGroups > 0) {
    this.studentsPerGroup = Math.ceil(this.estimatedStudents / this.numberOfGroups);
  } else {
    this.studentsPerGroup = this.estimatedStudents || 0;
  }
  
  // Backward compatibility / Migration for lecturers
  if (this.lecturer && (!this.lecturers || this.lecturers.length === 0)) {
    this.lecturers = [this.lecturer];
  } else if (this.lecturers && this.lecturers.length > 0 && !this.lecturer) {
    this.lecturer = this.lecturers[0];
  }
  
  next();
});

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
