// models/Venue.js
import mongoose from 'mongoose';

const maintenancePeriodSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { _id: true });

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Lecture Hall', 'Lab', 'Auditorium', 'Seminar Room', 'Outdoor Space', 'Other'],
    required: true,
    default: 'Lecture Hall',
  },
  location: {
    type: String,
    default: '',
  },
  floor: {
    type: String,
    default: '',
  },
  capacity: {
    type: Number,
    required: true,
  },
  capacityExam: {
    type: Number,
    default: null, // If null, use capacity * 0.5 as fallback
  },
  // Keep 'amenities' for backward compat, but prefer 'equipment' going forward
  amenities: [{
    type: String,
  }],
  equipment: [{
    type: String, // e.g., 'Projector', 'AC', 'Whiteboard', 'Microphone', 'WiFi'
  }],
  // Keep 'image' for backward compat
  image: {
    type: String,
  },
  images: [{
    type: String,
  }],
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  maintenancePeriods: [maintenancePeriodSchema],
}, { timestamps: true });

// Virtual: get effective exam capacity
venueSchema.virtual('effectiveExamCapacity').get(function () {
  return this.capacityExam || Math.floor(this.capacity * 0.5);
});

// Virtual: check if currently under maintenance
venueSchema.virtual('isUnderMaintenance').get(function () {
  const now = new Date();
  return this.maintenancePeriods.some(
    (p) => p.startDate <= now && p.endDate >= now
  );
});

// Ensure virtuals are included in JSON
venueSchema.set('toJSON', { virtuals: true });
venueSchema.set('toObject', { virtuals: true });

export default mongoose.model('Venue', venueSchema);
