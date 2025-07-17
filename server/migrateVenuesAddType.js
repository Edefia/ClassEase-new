import mongoose from 'mongoose';
import Venue from './models/Venue.js';

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://hebradalton:hd75TDMzjleRpmCP@classease.y5igppb.mongodb.net/';

async function migrateVenues() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all venues
    const venues = await Venue.find({});
    console.log(`Found ${venues.length} venues total`);

    // Update each venue with a type based on their name
    for (const venue of venues) {
      let venueType = 'Lecture Hall'; // default type
      
      // Determine type based on venue name
      const name = venue.name.toLowerCase();
      if (name.includes('lab') || name.includes('laboratory')) {
        venueType = 'Laboratory';
      } else if (name.includes('calc') || name.includes('computer')) {
        venueType = 'Computer Lab';
      } else if (name.includes('swlt') || name.includes('nlt') || name.includes('lecture')) {
        venueType = 'Lecture Hall';
      } else if (name.includes('seminar') || name.includes('tutorial')) {
        venueType = 'Seminar Room';
      } else if (name.includes('conference') || name.includes('meeting')) {
        venueType = 'Conference Room';
      } else if (name.includes('auditorium') || name.includes('theater')) {
        venueType = 'Auditorium';
      }

      // Update the venue with the type field
      await Venue.findByIdAndUpdate(venue._id, { type: venueType });
      console.log(`Updated venue ${venue.name} with type: ${venueType}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateVenues(); 