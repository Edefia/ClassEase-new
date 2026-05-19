import mongoose from 'mongoose';

const departmentSubmissionSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['not_started', 'draft', 'submitted', 'approved', 'rejected'],
    default: 'not_started',
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  // Summary counts for the dashboard
  totalCourses: {
    type: Number,
    default: 0,
  },
  totalByLevel: {
    level100: { type: Number, default: 0 },
    level200: { type: Number, default: 0 },
    level300: { type: Number, default: 0 },
    level400: { type: Number, default: 0 },
    level500: { type: Number, default: 0 },
    level600: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Compound index: A department can only have one submission per semester
departmentSubmissionSchema.index({ department: 1, semester: 1 }, { unique: true });

export default mongoose.model('DepartmentSubmission', departmentSubmissionSchema);
