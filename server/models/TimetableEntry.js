// models/TimetableEntry.js
import mongoose from 'mongoose';

const studentDistributionSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },
  rangeDescription: {
    type: String,
    default: '',
    // e.g., "Index 10001001 – 10001120"
  },
  count: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const timetableEntrySchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  
  // --- Grouping ---
  groupNumber: {
    type: Number,
    default: 1,
  },
  totalGroups: {
    type: Number,
    default: 1,
  },
  studentsInThisGroup: {
    type: Number,
    default: 0,
  },

  // --- Venue(s) ---
  // Single venue (backward compat for manual entries)
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    default: null,
  },
  // Multi-venue (for exam entries spanning multiple rooms)
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
  }],

  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // --- Time scheduling ---
  // For manual/legacy entries: raw day + time strings
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  timeStart: {
    type: String, // "08:00"
  },
  timeEnd: {
    type: String, // "10:00"
  },

  // For engine-generated entries: reference to TimeSlotTemplate
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlotTemplate',
    default: null,
  },
  timeSlots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlotTemplate',
  }],

  // --- Entry classification ---
  entryType: {
    type: String,
    enum: ['lecture', 'tutorial', 'practical', 'exam'],
    default: 'lecture',
  },

  // --- Status lifecycle ---
  status: {
    type: String,
    enum: ['draft', 'under_review', 'published'],
    default: 'draft',
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

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },

  // --- Exam-specific fields ---
  examDate: {
    type: Date,
    default: null,
  },
  examTimeBlock: {
    type: String,
    enum: ['morning', 'afternoon'],
    default: null,
  },
  studentDistribution: [studentDistributionSchema],

  // --- Audit fields ---
  isActive: {
    type: Boolean,
    default: true,
  },
  isManuallyAdjusted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  schedulingRun: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchedulingRun',
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Indexes for conflict detection
timetableEntrySchema.index({ venue: 1, dayOfWeek: 1, semester: 1, academicYear: 1 });
timetableEntrySchema.index({ lecturer: 1, dayOfWeek: 1, semester: 1, academicYear: 1 });
timetableEntrySchema.index({ semester: 1, status: 1 });
timetableEntrySchema.index({ schedulingRun: 1 });

// Virtual: get effective venue (backward compat)
timetableEntrySchema.virtual('effectiveVenues').get(function () {
  if (this.venues && this.venues.length > 0) return this.venues;
  if (this.venue) return [this.venue];
  return [];
});

// Virtual: get effective entry type
timetableEntrySchema.virtual('effectiveEntryType').get(function () {
  return this.entryType || 'lecture';
});

timetableEntrySchema.set('toJSON', { virtuals: true });
timetableEntrySchema.set('toObject', { virtuals: true });

export default mongoose.model('TimetableEntry', timetableEntrySchema);
