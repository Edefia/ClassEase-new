import mongoose from 'mongoose';
import Venue from './models/Venue.js';
import Building from './models/Building.js';

const MONGO_URI = 'mongodb+srv://hebradalton:hd75TDMzjleRpmCP@classease.y5igppb.mongodb.net/'; // Update if needed

async function migrateVenues() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a building to assign (e.g., the first one)
    const building = await Building.findOne();
    if (!building) {
      console.error('No buildings found. Please create a building first.');
      return;
    }
    console.log('Assigning venues to building:', building.name, building._id);

    // Find venues without a building
    const venues = await Venue.find({ $or: [{ building: { $exists: false } }, { building: null }] });
    if (venues.length === 0) {
      console.log('All venues already have a building.');
      return;
    }
    for (const venue of venues) {
      venue.building = building._id;
      await venue.save();
      console.log(`Updated venue ${venue.name} (${venue._id})`);
    }
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateVenues(); 