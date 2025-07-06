// insertUser.js
import mongoose from 'mongoose';
import User from './models/User.js';

const MONGO_URI = 'mongodb+srv://hebradalton:hd75TDMzjleRpmCP@classease.y5igppb.mongodb.net/';

async function insertUser() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123', // In production, use a real hash
      role: 'student',
      department: 'Computer Science',
    });

    const savedUser = await user.save();
    console.log('User inserted:', savedUser);
  } catch (error) {
    console.error('Error inserting user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

insertUser(); 