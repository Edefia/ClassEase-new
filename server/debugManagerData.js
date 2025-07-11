import mongoose from 'mongoose';
import Building from './models/Building.js';
import Venue from './models/Venue.js';
import Booking from './models/Booking.js';
import User from './models/User.js';

const MONGODB_URI = "mongodb+srv://hebradalton:hd75TDMzjleRpmCP@classease.y5igppb.mongodb.net/";
const managerId = '686e6b91e0f599f699cd62ed'; // The manager's user _id

async function main() {
  await mongoose.connect(MONGODB_URI);

  const manager = await User.findById(managerId);
  if (!manager) {
    console.log('Manager not found!');
    process.exit(1);
  }
  console.log(`Manager: ${manager.name} (${manager.email})`);

  // Find buildings managed by this manager
  const buildings = await Building.find({ manager: managerId });
  console.log(`\nBuildings managed by ${manager.name}:`);
  if (buildings.length === 0) {
    console.log('  None');
  } else {
    buildings.forEach(b => console.log(`  - ${b.name} (${b._id})`));
  }

  // Find venues in those buildings
  const buildingIds = buildings.map(b => b._id);
  const venues = await Venue.find({ building: { $in: buildingIds } });
  console.log(`\nVenues in managed buildings:`);
  if (venues.length === 0) {
    console.log('  None');
  } else {
    venues.forEach(v => console.log(`  - ${v.name} (${v._id}) in building ${v.building}`));
  }

  // Find bookings for those venues
  const venueIds = venues.map(v => v._id);
  const bookings = await Booking.find({ venue: { $in: venueIds } }).populate('venue user');
  console.log(`\nBookings for managed venues:`);
  if (bookings.length === 0) {
    console.log('  None');
  } else {
    bookings.forEach(b => {
      console.log(`  - Booking by ${b.user?.name || b.user} for venue ${b.venue?.name || b.venue} on ${b.date} (${b.status})`);
    });
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 