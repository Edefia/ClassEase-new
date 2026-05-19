import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import venueRoutes from './routes/venues.js';
import bookingRoutes from './routes/bookings.js';
import usersRoutes from './routes/users.js';
import departmentsRoutes from './routes/departments.js';
import buildingsRoutes from './routes/buildings.js';
import statsRoutes from './routes/stats.js';
import notificationRoutes from './routes/notifications.js';
import courseRoutes from './routes/courses.js';
import timetableRoutes from './routes/timetable.js';
import schedulingRoutes from './routes/scheduling.js';
import semesterRoutes from './routes/semesters.js';
import timeslotRoutes from './routes/timeslots.js';
import submissionsRoutes from './routes/submissions.js';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'Not Loaded');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = [
  'http://localhost:5173', // Vite dev
  'http://localhost:3000', // React dev
  'https://class-ease-new.vercel.app',
  'https://classease.appxora.com' // Example Vercel deployment

];

const app = express();
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
// Serve uploaded images from the correct directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/submissions', submissionsRoutes);

// DB & Server Init
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("❌ DB connection error:", err));

