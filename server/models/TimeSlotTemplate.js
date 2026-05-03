// models/TimeSlotTemplate.js
import mongoose from 'mongoose';

const timeSlotTemplateSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    // e.g., "Period 1", "Period 2"
  },
  startTime: {
    type: String,
    required: true,
    // e.g., "07:00"
  },
  endTime: {
    type: String,
    required: true,
    // e.g., "09:00"
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true,
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Auto-calculate duration before save
timeSlotTemplateSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);
    this.durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
  }
  next();
});

// Compound index: unique slot per day+time
timeSlotTemplateSchema.index({ dayOfWeek: 1, startTime: 1 }, { unique: true });

export default mongoose.model('TimeSlotTemplate', timeSlotTemplateSchema);
