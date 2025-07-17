// models/Venue.js
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    default: 'Lecture Hall',
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
  image: {
    type: String, // URL or file path to the image
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Venue', venueSchema);
