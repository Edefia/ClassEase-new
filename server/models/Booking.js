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
  date: {
    type: Date,
    required: true,
  },
  timeStart: {
    type: String, // e.g., "14:00"
    required: true,
  },
  timeEnd: {
    type: String, // e.g., "16:00"
    required: true,
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
  },
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
