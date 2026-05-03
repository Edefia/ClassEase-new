import express from 'express';
import Venue from '../models/Venue.js';
import Building from '../models/Building.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get all venues (public)
router.get('/', async (req, res) => {
  try {
    const { type, minCapacity, maxCapacity, building, available, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (building) query.building = building;
    if (available === 'true') query.isAvailable = true;
    if (minCapacity) query.capacity = { ...query.capacity, $gte: Number(minCapacity) };
    if (maxCapacity) query.capacity = { ...query.capacity, $lte: Number(maxCapacity) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const venues = await Venue.find(query).populate('building');
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single venue
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('building');
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Smart Venue Suggestion
// GET /api/venues/suggest?capacity=100&equipment=Projector,AC&date=2026-01-15&timeStart=08:00&timeEnd=10:00
router.get('/suggest', async (req, res) => {
  try {
    const { capacity, equipment, date, timeStart, timeEnd, type } = req.query;
    const query = { isAvailable: true };

    // Filter by type if provided
    if (type) query.type = type;

    // Find venues that meet minimum capacity
    if (capacity) query.capacity = { $gte: Number(capacity) };

    let venues = await Venue.find(query).populate('building');

    // Filter out venues under maintenance on the requested date
    if (date) {
      const requestedDate = new Date(date);
      venues = venues.filter((v) => {
        return !v.maintenancePeriods.some(
          (p) => requestedDate >= p.startDate && requestedDate <= p.endDate
        );
      });
    }

    // Check for booking conflicts if date and time provided
    if (date && timeStart && timeEnd) {
      const Booking = (await import('../models/Booking.js')).default;
      const conflictingBookings = await Booking.find({
        date: new Date(date),
        timeStart: { $lt: timeEnd },
        timeEnd: { $gt: timeStart },
        status: { $in: ['approved', 'pending'] },
      }).select('venue');

      const conflictingVenueIds = new Set(
        conflictingBookings.map((b) => b.venue.toString())
      );

      venues = venues.filter((v) => !conflictingVenueIds.has(v._id.toString()));
    }

    // Score and rank venues
    const requestedEquipment = equipment
      ? equipment.split(',').map((e) => e.trim().toLowerCase())
      : [];

    const scored = venues.map((v) => {
      let score = 0;
      const allEquip = [...(v.equipment || []), ...(v.amenities || [])].map((e) =>
        e.toLowerCase()
      );

      // Equipment match score (0-50 points)
      if (requestedEquipment.length > 0) {
        const matched = requestedEquipment.filter((e) =>
          allEquip.some((ve) => ve.includes(e) || e.includes(ve))
        );
        score += (matched.length / requestedEquipment.length) * 50;
      } else {
        score += 25; // Neutral if no equipment requested
      }

      // Capacity fit score (0-30 points) — prefer closest fit, not oversized
      if (capacity) {
        const ratio = Number(capacity) / v.capacity;
        if (ratio >= 0.5 && ratio <= 1.0) {
          score += 30 * ratio; // Perfect fit = 30 points
        } else if (ratio < 0.5) {
          score += 15; // Way too big
        } else {
          score += 0; // Too small (shouldn't happen due to query filter)
        }
      } else {
        score += 15;
      }

      // Availability bonus (20 points if no maintenance soon)
      const now = new Date();
      const hasUpcomingMaintenance = v.maintenancePeriods.some(
        (p) => p.startDate > now && p.startDate < new Date(now.getTime() + 7 * 86400000)
      );
      score += hasUpcomingMaintenance ? 5 : 20;

      return { venue: v, score: Math.round(score) };
    });

    // Sort by score (highest first) and return top 10
    scored.sort((a, b) => b.score - a.score);
    const suggestions = scored.slice(0, 10).map((s) => ({
      ...s.venue.toJSON(),
      suggestionScore: s.score,
    }));

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Venue Availability Calendar
// GET /api/venues/:id/availability?month=2026-01&startDate=2026-01-01&endDate=2026-01-31
router.get('/:id/availability', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    const { month, startDate, endDate } = req.query;
    let start, end;

    if (month) {
      // Parse "2026-01" format
      const [year, m] = month.split('-').map(Number);
      start = new Date(year, m - 1, 1);
      end = new Date(year, m, 0, 23, 59, 59); // Last day of month
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default: current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const Booking = (await import('../models/Booking.js')).default;

    // Get all bookings for this venue in the date range
    const bookings = await Booking.find({
      venue: req.params.id,
      date: { $gte: start, $lte: end },
      status: { $in: ['approved', 'pending'] },
    })
      .populate('user', 'name email role')
      .sort({ date: 1, timeStart: 1 });

    // Get maintenance periods that overlap with the range
    const maintenancePeriods = venue.maintenancePeriods.filter(
      (p) => p.endDate >= start && p.startDate <= end
    );

    // Build day-by-day availability map
    const days = {};
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayBookings = bookings.filter(
        (b) => new Date(b.date).toISOString().split('T')[0] === dateStr
      );
      const isMaintenanceDay = maintenancePeriods.some(
        (p) => current >= p.startDate && current <= p.endDate
      );

      days[dateStr] = {
        date: dateStr,
        bookings: dayBookings.map((b) => ({
          _id: b._id,
          timeStart: b.timeStart,
          timeEnd: b.timeEnd,
          purpose: b.purpose,
          status: b.status,
          user: b.user,
          isExternal: b.isExternal,
        })),
        bookingCount: dayBookings.length,
        isMaintenance: isMaintenanceDay,
        maintenanceReason: isMaintenanceDay
          ? maintenancePeriods.find((p) => current >= p.startDate && current <= p.endDate)?.reason
          : null,
      };
      current.setDate(current.getDate() + 1);
    }

    res.json({
      venue: {
        _id: venue._id,
        name: venue.name,
        capacity: venue.capacity,
        type: venue.type,
        isAvailable: venue.isAvailable,
      },
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      days,
      totalBookings: bookings.length,
      maintenancePeriods: maintenancePeriods.map((p) => ({
        _id: p._id,
        reason: p.reason,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new venue (admin/manager only)
router.post('/', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  const { building, ...venueData } = req.body;
  if (!building) {
    return res.status(400).json({ error: 'Building is required.' });
  }
  const buildingExists = await Building.findById(building);
  if (!buildingExists) {
    return res.status(400).json({ error: 'Invalid building.' });
  }

  // Map equipment from amenities if not provided
  if (!venueData.equipment && venueData.amenities) {
    venueData.equipment = venueData.amenities;
  }

  const venue = new Venue({ ...venueData, building });
  try {
    const saved = await venue.save();
    const populated = await saved.populate('building');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Image upload endpoint (admin/manager only)
router.post('/upload', verifyToken, requireRole('admin', 'manager'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Update a venue (admin/manager only)
router.put('/:id', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  const { building, ...venueData } = req.body;
  if (building) {
    const buildingExists = await Building.findById(building);
    if (!buildingExists) {
      return res.status(400).json({ error: 'Invalid building.' });
    }
  }
  try {
    const updated = await Venue.findByIdAndUpdate(
      req.params.id,
      { ...venueData, ...(building ? { building } : {}) },
      { new: true, runValidators: true }
    ).populate('building');
    if (!updated) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add maintenance period to venue
router.post('/:id/maintenance', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { reason, startDate, endDate } = req.body;
    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Reason, start date, and end date are required' });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    venue.maintenancePeriods.push({ reason, startDate, endDate });
    await venue.save();

    res.json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove maintenance period from venue
router.delete('/:id/maintenance/:maintenanceId', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    venue.maintenancePeriods = venue.maintenancePeriods.filter(
      (p) => p._id.toString() !== req.params.maintenanceId
    );
    await venue.save();

    res.json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a venue (admin/manager only)
router.delete('/:id', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const deleted = await Venue.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json({ message: 'Venue deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
