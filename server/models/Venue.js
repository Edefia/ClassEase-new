// models/Venue.js
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  building: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  capacity: {
    type: Number,
    required: true,
  },
  amenities: [{
    type: String, // e.g., ['AC', 'Projector', 'WiFi']
  }],
  images: [{
    type: String, // URLs or file paths to images
  }],
}, { timestamps: true });

export default mongoose.model('Venue', venueSchema);
