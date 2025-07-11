import mongoose from 'mongoose';
import Building from './models/Building.js';
import User from './models/User.js';

// TODO: Replace with your actual MongoDB connection string
const MONGODB_URI = "mongodb+srv://hebradalton:hd75TDMzjleRpmCP@classease.y5igppb.mongodb.net/";

// Set these to the correct values:
const managerId = '686e6b91e0f599f699cd62ed'; // The manager's user _id
const buildingIds = [
  '686d61b568f445297c5fe3e1' // Replace with actual building _id(s)
 
];

async function assignManager() {
  await mongoose.connect(MONGODB_URI);

  // Optional: Check if manager exists
  const manager = await User.findById(managerId);
  if (!manager) {
    console.error('Manager not found!');
    process.exit(1);
  }

  // Assign manager to each building
  for (const buildingId of buildingIds) {
    const updated = await Building.findByIdAndUpdate(
      buildingId,
      { manager: managerId },
      { new: true }
    );
    if (updated) {
      console.log(`Assigned manager ${manager.email} to building ${updated.name}`);
    } else {
      console.warn(`Building with ID ${buildingId} not found.`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

assignManager().catch(err => {
  console.error(err);
  process.exit(1);
}); 