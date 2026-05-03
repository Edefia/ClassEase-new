// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },

  // Session type
  sessionType: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time',
  },

  // Legacy field kept for backward compat
  type: {
    type: String,
    enum: ['once', 'recurring'],
    default: 'once',
  },

  // For one-time bookings
  date: {
    type: Date,
  },
  timeStart: {
    type: String, // e.g., "14:00"
  },
  timeEnd: {
    type: String, // e.g., "16:00"
  },

  // For recurring bookings (legacy)
  dayOfWeek: {
    type: String,
  },
  timeSlotStart: {
    type: String,
  },
  timeSlotEnd: {
    type: String,
  },
  semesterWeeks: {
    type: [Number],
  },

  // New recurrence pattern (flexible)
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'custom'],
    },
    daysOfWeek: [String], // ["monday", "wednesday"]
    endDate: Date,
    customDates: [Date],
  },

  purpose: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNote: {
    type: String,
    default: '',
  },
  reasonIfDeclined: {
    type: String,
  },

  // External / guest booking fields
  isExternal: {
    type: Boolean,
    default: false,
  },
  externalOrgName: {
    type: String,
    default: '',
  },
  externalContactEmail: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
