import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  image: {
    type: String,
    default: '/placeholder.svg'
  },
  amenities: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  operatingHours: {
    start: {
      type: String,
      required: [true, 'Operating hours start time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use valid 24-hour time format (HH:MM)']
    },
    end: {
      type: String,
      required: [true, 'Operating hours end time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use valid 24-hour time format (HH:MM)']
    }
  }
}, {
  timestamps: true
});

// Validate operating hours
venueSchema.pre('save', function(next) {
  if (this.operatingHours.start >= this.operatingHours.end) {
    next(new Error('Operating hours end time must be after start time'));
  }
  next();
});

const Venue = mongoose.model('Venue', venueSchema);

export default Venue; 