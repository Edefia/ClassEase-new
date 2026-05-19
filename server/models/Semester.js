// models/Semester.js
import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g., "First Semester", "Second Semester", "Summer"
  },
  academicYear: {
    type: String,
    required: true,
    trim: true,
    // e.g., "2025/2026"
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  examPeriod: {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    morningSlot: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '11:00' },
    },
    afternoonSlot: {
      start: { type: String, default: '13:00' },
      end: { type: String, default: '16:00' },
    },
  },
  submissionDeadline: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['setup', 'submission_open', 'submission_closed', 'scheduling', 'active', 'exam_period', 'closed'],
    default: 'setup',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

// Compound index: only one active semester allowed
semesterSchema.index({ academicYear: 1, name: 1 }, { unique: true });

// Virtual: check if semester is currently active
semesterSchema.virtual('isCurrent').get(function () {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Virtual: get total exam days count
semesterSchema.virtual('examDaysCount').get(function () {
  if (!this.examPeriod?.startDate || !this.examPeriod?.endDate) return 0;
  const start = new Date(this.examPeriod.startDate);
  const end = new Date(this.examPeriod.endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // Mon-Fri only
    current.setDate(current.getDate() + 1);
  }
  return count;
});

semesterSchema.set('toJSON', { virtuals: true });
semesterSchema.set('toObject', { virtuals: true });

export default mongoose.model('Semester', semesterSchema);
