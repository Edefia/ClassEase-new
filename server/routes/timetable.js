// routes/timetable.js
import express from 'express';
import TimetableEntry from '../models/TimetableEntry.js';
import Venue from '../models/Venue.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

// Conflict detection helper
const findConflicts = async (entry, excludeId = null) => {
  const conflicts = [];
  const baseQuery = {
    dayOfWeek: entry.dayOfWeek,
    semester: entry.semester,
    academicYear: entry.academicYear,
    isActive: true,
    timeStart: { $lt: entry.timeEnd },
    timeEnd: { $gt: entry.timeStart },
  };
  if (excludeId) baseQuery._id = { $ne: excludeId };

  // 1. Venue conflict (same venue, same day, overlapping time)
  const venueConflicts = await TimetableEntry.find({
    ...baseQuery,
    venue: entry.venue,
  }).populate('course', 'code name').populate('venue', 'name');

  venueConflicts.forEach((c) => {
    conflicts.push({
      type: 'venue',
      message: `Venue "${c.venue?.name}" is already booked for ${c.course?.code} (${c.timeStart}-${c.timeEnd})`,
      entry: c,
    });
  });

  // 2. Lecturer conflict (same lecturer, same day, overlapping time)
  if (entry.lecturer) {
    const lecturerConflicts = await TimetableEntry.find({
      ...baseQuery,
      lecturer: entry.lecturer,
    }).populate('course', 'code name').populate('lecturer', 'name');

    lecturerConflicts.forEach((c) => {
      conflicts.push({
        type: 'lecturer',
        message: `Lecturer "${c.lecturer?.name}" already has ${c.course?.code} (${c.timeStart}-${c.timeEnd})`,
        entry: c,
      });
    });
  }

  return conflicts;
};

// GET all timetable entries (with filters)
router.get('/', async (req, res) => {
  try {
    const { semester, academicYear, department, lecturer, venue, dayOfWeek, type } = req.query;
    const query = { isActive: true };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (department) query.department = department;
    if (lecturer) query.lecturer = lecturer;
    if (venue) query.venue = venue;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (type) query.type = type;

    const entries = await TimetableEntry.find(query)
      .populate('course', 'code name level creditHours')
      .populate('venue', 'name type capacity building')
      .populate('lecturer', 'name email')
      .populate('department', 'name code')
      .sort({ dayOfWeek: 1, timeStart: 1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET timetable as structured weekly grid
router.get('/grid', async (req, res) => {
  try {
    const { semester, academicYear, department, lecturer, venue } = req.query;
    const query = { isActive: true };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (department) query.department = department;
    if (lecturer) query.lecturer = lecturer;
    if (venue) query.venue = venue;

    const entries = await TimetableEntry.find(query)
      .populate('course', 'code name level creditHours')
      .populate('venue', 'name type capacity')
      .populate('lecturer', 'name email')
      .sort({ timeStart: 1 });

    // Structure into day-based grid
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const grid = {};
    days.forEach((day) => {
      grid[day] = entries
        .filter((e) => e.dayOfWeek === day)
        .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
    });

    res.json({
      grid,
      totalEntries: entries.length,
      filters: { semester, academicYear, department },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create timetable entry (with conflict detection)
router.post('/', verifyToken, requireRole('admin', 'department_coordinator', 'manager'), async (req, res) => {
  try {
    // Check conflicts first
    const conflicts = await findConflicts(req.body);
    if (conflicts.length > 0 && !req.body.forceOverride) {
      return res.status(409).json({
        error: 'Scheduling conflicts detected',
        conflicts,
        message: 'Set forceOverride=true to ignore conflicts',
      });
    }

    const entry = new TimetableEntry({
      ...req.body,
      createdBy: req.user.id,
    });
    await entry.save();

    const populated = await TimetableEntry.findById(entry._id)
      .populate('course', 'code name level')
      .populate('venue', 'name type capacity')
      .populate('lecturer', 'name email')
      .populate('department', 'name code');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST bulk create (for generating full timetable)
router.post('/bulk', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required' });
    }

    const results = { created: [], conflicts: [], errors: [] };

    for (const entryData of entries) {
      try {
        const conflicts = await findConflicts(entryData);
        if (conflicts.length > 0) {
          results.conflicts.push({ entry: entryData, conflicts });
          continue;
        }
        const entry = new TimetableEntry({ ...entryData, createdBy: req.user.id });
        await entry.save();
        results.created.push(entry);
      } catch (err) {
        results.errors.push({ entry: entryData, error: err.message });
      }
    }

    res.status(201).json({
      message: `${results.created.length} entries created, ${results.conflicts.length} conflicts, ${results.errors.length} errors`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update entry
router.put('/:id', verifyToken, requireRole('admin', 'department_coordinator', 'manager'), async (req, res) => {
  try {
    const conflicts = await findConflicts(req.body, req.params.id);
    if (conflicts.length > 0 && !req.body.forceOverride) {
      return res.status(409).json({
        error: 'Scheduling conflicts detected',
        conflicts,
      });
    }

    const entry = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('course', 'code name level')
      .populate('venue', 'name type capacity')
      .populate('lecturer', 'name email');

    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE entry
router.delete('/:id', verifyToken, requireRole('admin', 'department_coordinator'), async (req, res) => {
  try {
    const entry = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST check conflicts (preview, no save)
router.post('/check-conflicts', verifyToken, async (req, res) => {
  try {
    const conflicts = await findConflicts(req.body);
    res.json({ hasConflicts: conflicts.length > 0, conflicts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────
// TIMETABLE LIFECYCLE ENDPOINTS
// ──────────────────────────────────────────

// GET timetable entries by semester (role-filtered)
router.get('/semester/:semesterId', verifyToken, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { status, entryType } = req.query;
    const query = {
      $or: [{ semester: semesterId }],
      isActive: true,
    };
    if (status) query.status = status;
    if (entryType) query.entryType = entryType;

    // Role-based filtering
    const userRole = req.user.role;
    if (userRole === 'lecturer') {
      query.lecturer = req.user.id;
    }
    // Students and coordinators get all entries for their department
    // (filtering done on the frontend using user.department)

    const entries = await TimetableEntry.find(query)
      .populate('course', 'code name level creditHours estimatedStudents')
      .populate('venue', 'name type capacity')
      .populate('venues', 'name type capacity capacityExam')
      .populate('lecturer', 'name email')
      .populate('department', 'name code')
      .populate('timeSlot', 'label startTime endTime dayOfWeek')
      .sort({ dayOfWeek: 1, timeStart: 1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET clashes for a semester draft
router.get('/semester/:semesterId/clashes', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId } = req.params;
    const entries = await TimetableEntry.find({
      semester: semesterId,
      isActive: true,
      status: { $in: ['draft', 'under_review'] },
    })
      .populate('course', 'code name level estimatedStudents')
      .populate('venue', 'name type capacity')
      .populate('lecturer', 'name email')
      .populate('department', 'name code');

    const hardConflicts = [];
    const softConflicts = [];

    // Check for venue clashes
    const venueSlots = {};
    for (const entry of entries) {
      const key = `${entry.venue?.toString()}_${entry.dayOfWeek}_${entry.timeStart}`;
      if (!venueSlots[key]) venueSlots[key] = [];
      venueSlots[key].push(entry);
    }
    for (const [, group] of Object.entries(venueSlots)) {
      if (group.length > 1) {
        hardConflicts.push({
          type: 'venue_clash',
          message: `Venue "${group[0].venue?.name}" has ${group.length} entries at ${group[0].dayOfWeek} ${group[0].timeStart}`,
          entries: group.map((e) => ({ id: e._id, course: e.course?.code })),
        });
      }
    }

    // Check for lecturer clashes
    const lecturerSlots = {};
    for (const entry of entries) {
      if (!entry.lecturer) continue;
      const key = `${entry.lecturer._id?.toString()}_${entry.dayOfWeek}_${entry.timeStart}`;
      if (!lecturerSlots[key]) lecturerSlots[key] = [];
      lecturerSlots[key].push(entry);
    }
    for (const [, group] of Object.entries(lecturerSlots)) {
      if (group.length > 1) {
        hardConflicts.push({
          type: 'lecturer_clash',
          message: `${group[0].lecturer?.name} has ${group.length} sessions at ${group[0].dayOfWeek} ${group[0].timeStart}`,
          entries: group.map((e) => ({ id: e._id, course: e.course?.code })),
        });
      }
    }

    // Check for level clashes (soft)
    const levelSlots = {};
    for (const entry of entries) {
      if (!entry.department || !entry.course?.level) continue;
      const key = `${entry.department._id?.toString()}_${entry.course.level}_${entry.dayOfWeek}_${entry.timeStart}`;
      if (!levelSlots[key]) levelSlots[key] = [];
      levelSlots[key].push(entry);
    }
    for (const [, group] of Object.entries(levelSlots)) {
      if (group.length > 1) {
        softConflicts.push({
          type: 'level_clash',
          message: `${group.map((e) => e.course?.code).join(' and ')} share ${group[0].dayOfWeek} ${group[0].timeStart} — Level ${group[0].course?.level} ${group[0].department?.name} students affected`,
          entries: group.map((e) => ({ id: e._id, course: e.course?.code })),
        });
      }
    }

    res.json({
      hardConflicts,
      softConflicts,
      totalHard: hardConflicts.length,
      totalSoft: softConflicts.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST publish timetable
router.post('/semester/:semesterId/publish', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId } = req.params;

    const result = await TimetableEntry.updateMany(
      { semester: semesterId, status: { $in: ['draft', 'under_review'] }, isActive: true },
      { status: 'published' }
    );

    res.json({
      message: `${result.modifiedCount} entries published`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST unpublish timetable
router.post('/semester/:semesterId/unpublish', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { semesterId } = req.params;

    const result = await TimetableEntry.updateMany(
      { semester: semesterId, status: 'published', isActive: true },
      { status: 'under_review' }
    );

    res.json({
      message: `${result.modifiedCount} entries unpublished`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST begin review (move draft → under_review)
router.post('/semester/:semesterId/review', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId } = req.params;

    const result = await TimetableEntry.updateMany(
      { semester: semesterId, status: 'draft', isActive: true },
      { status: 'under_review' }
    );

    res.json({
      message: `${result.modifiedCount} entries moved to review`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST clear draft (delete all draft entries for a semester)
router.post('/semester/:semesterId/clear-draft', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { semesterId } = req.params;

    const result = await TimetableEntry.deleteMany({
      semester: semesterId,
      status: 'draft',
    });

    res.json({
      message: `${result.deletedCount} draft entries cleared`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET timetable status summary for a semester
router.get('/semester/:semesterId/status', verifyToken, async (req, res) => {
  try {
    const { semesterId } = req.params;

    const draft = await TimetableEntry.countDocuments({ semester: semesterId, status: 'draft', isActive: true });
    const underReview = await TimetableEntry.countDocuments({ semester: semesterId, status: 'under_review', isActive: true });
    const published = await TimetableEntry.countDocuments({ semester: semesterId, status: 'published', isActive: true });

    let currentStatus = 'not_generated';
    if (published > 0) currentStatus = 'published';
    else if (underReview > 0) currentStatus = 'under_review';
    else if (draft > 0) currentStatus = 'draft';

    res.json({
      currentStatus,
      counts: { draft, underReview, published, total: draft + underReview + published },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

