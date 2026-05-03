// models/SchedulingRun.js
import mongoose from 'mongoose';

const failedCourseSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  sessionsNeeded: { type: Number, default: 0 },
  sessionsPlaced: { type: Number, default: 0 },
  reason: { type: String, default: '' },
}, { _id: false });

const schedulingRunSchema = new mongoose.Schema({
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  runType: {
    type: String,
    enum: ['lecture', 'exam'],
    required: true,
  },
  mode: {
    type: String,
    enum: ['semi_auto', 'auto_pilot'],
    default: 'semi_auto',
  },
  version: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['running', 'complete', 'failed'],
    default: 'running',
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ranAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  placementRate: {
    type: Number,
    default: 0,
    // percentage: e.g. 92.3
  },
  summary: {
    totalCourses: { type: Number, default: 0 },
    fullyScheduled: { type: Number, default: 0 },
    partiallyScheduled: { type: Number, default: 0 },
    unscheduled: { type: Number, default: 0 },
    totalSessionsPlaced: { type: Number, default: 0 },
  },
  failedCourses: [failedCourseSchema],
  softConstraintViolations: [{
    type: String,
  }],
  error: {
    type: String,
    default: null,
    // Populated if status === 'failed'
  },
}, { timestamps: true });

// Index for querying runs by semester
schedulingRunSchema.index({ semester: 1, runType: 1, version: -1 });

export default mongoose.model('SchedulingRun', schedulingRunSchema);
