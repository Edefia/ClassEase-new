import mongoose from 'mongoose';
import Venue from './models/Venue.js';
import Booking from './models/Booking.js';

// TODO: Replace with your actual MongoDB connection string
const MONGODB_URI = "mongodb+srv://hebradalton:12345hdA@classease.uabvbsf.mongodb.net/?retryWrites=true&w=majority&appName=ClassEase";

// Set these to the correct values:
const buildingId = '686d61b568f445297c5fe3e1'; // The building _id
const studentUserId = '686adf886c2e13d9992f9374'; // Replace with an actual student user _id

async function main() {
  await mongoose.connect(MONGODB_URI);

  // Assign all venues to the building
  const venues = await Venue.find();
  if (venues.length === 0) {
    console.warn('No venues found in the database.');
    await mongoose.disconnect();
    return;
  }
  for (const venue of venues) {
    venue.building = buildingId;
    await venue.save();
    console.log(`Assigned venue ${venue.name} to building ${buildingId}`);
  }

  // Create a test booking for the first venue
  const testVenue = venues[0];
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const booking = new Booking({
    user: studentUserId,
    venue: testVenue._id,
    date: dateStr,
    timeStart: '10:00',
    timeEnd: '12:00',
    purpose: 'Test booking',
    status: 'pending',
    type: 'once',
  });
  await booking.save();
  console.log(`Created test booking for venue ${testVenue.name} on ${dateStr}`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 