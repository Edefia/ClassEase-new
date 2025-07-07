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

  // Type: 'once' for one-time, 'recurring' for semester-long bookings
  type: {
    type: String,
    enum: ['once', 'recurring'],
    default: 'once',
    required: true,
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

  // For recurring bookings
  dayOfWeek: {
    type: String, // e.g., "Monday"
  },
  timeSlotStart: {
    type: String, // e.g., "08:00"
  },
  timeSlotEnd: {
    type: String, // e.g., "10:00"
  },
  semesterWeeks: {
    type: [Number], // e.g., [1,2,3,...,14]
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
  reasonIfDeclined: {
    type: String,
  }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
