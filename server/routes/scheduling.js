// routes/scheduling.js
import express from 'express';
import SchedulingRun from '../models/SchedulingRun.js';
import Semester from '../models/Semester.js';
import Course from '../models/Course.js';
import Venue from '../models/Venue.js';
import TimeSlotTemplate from '../models/TimeSlotTemplate.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';
import { runPreflightCheck } from '../services/preflightValidator.js';
import { generateLectureTimetable } from '../services/lectureSchedulingEngine.js';
import { generateExamTimetable } from '../services/examSchedulingEngine.js';

const router = express.Router();

// GET /api/scheduling/preflight/:semesterId
// Runs the pre-flight checks and returns errors/warnings
router.get('/preflight/:semesterId', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const result = await runPreflightCheck(req.params.semesterId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scheduling/generate-lecture
// Triggers the lecture scheduling engine asynchronously
router.post('/generate-lecture', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId, mode = 'semi_auto' } = req.body;
    if (!semesterId) return res.status(400).json({ error: 'semesterId is required' });

    // Validate semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    // Validate prerequisites
    const courseCount = await Course.countDocuments({
      $or: [
        { semesterRef: semesterId },
        { semester: semester.name.toLowerCase().includes('first') ? 'first' : 'second', academicYear: semester.academicYear },
      ],
      isActive: true,
    });
    if (courseCount === 0) return res.status(400).json({ error: 'No courses found for this semester. Add courses first.' });

    const venueCount = await Venue.countDocuments({ isAvailable: true });
    if (venueCount === 0) return res.status(400).json({ error: 'No available venues. Configure venues first.' });

    const slotCount = await TimeSlotTemplate.countDocuments({ isActive: true });
    if (slotCount === 0) return res.status(400).json({ error: 'No time slot templates defined. Create time slots first.' });

    // Create a "running" SchedulingRun immediately
    const prevRun = await SchedulingRun.findOne({ semester: semesterId, runType: 'lecture' }).sort({ version: -1 });
    const version = (prevRun?.version || 0) + 1;

    const run = await SchedulingRun.create({
      semester: semesterId,
      runType: 'lecture',
      mode,
      version,
      status: 'running',
      triggeredBy: req.user.id,
      ranAt: new Date(),
    });

    // Return 202 immediately
    res.status(202).json({
      success: true,
      runId: run._id,
      message: 'Lecture scheduling started',
      version,
    });

    // Run engine asynchronously
    try {
      const result = await generateLectureTimetable(semesterId, { mode, userId: req.user.id });

      // Update the run with results (the engine also creates a run, so update existing)
      await SchedulingRun.findByIdAndUpdate(run._id, {
        status: 'complete',
        completedAt: new Date(),
        durationMs: result.durationMs,
        placementRate: result.placementRate,
        summary: result.summary,
        failedCourses: result.failedSessions,
        softConstraintViolations: result.softConstraintViolations,
      });
    } catch (engineError) {
      await SchedulingRun.findByIdAndUpdate(run._id, {
        status: 'failed',
        completedAt: new Date(),
        error: engineError.message,
      });
      console.error('Lecture scheduling engine error:', engineError);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scheduling/generate-exam
router.post('/generate-exam', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId, mode = 'semi_auto' } = req.body;
    if (!semesterId) return res.status(400).json({ error: 'semesterId is required' });

    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    if (!semester.examPeriod?.startDate || !semester.examPeriod?.endDate) {
      return res.status(400).json({ error: 'Exam period dates not configured for this semester' });
    }

    const prevRun = await SchedulingRun.findOne({ semester: semesterId, runType: 'exam' }).sort({ version: -1 });
    const version = (prevRun?.version || 0) + 1;

    const run = await SchedulingRun.create({
      semester: semesterId,
      runType: 'exam',
      mode,
      version,
      status: 'running',
      triggeredBy: req.user.id,
      ranAt: new Date(),
    });

    res.status(202).json({
      success: true,
      runId: run._id,
      message: 'Exam scheduling started',
      version,
    });

    try {
      const result = await generateExamTimetable(semesterId, { mode, userId: req.user.id });
      await SchedulingRun.findByIdAndUpdate(run._id, {
        status: 'complete',
        completedAt: new Date(),
        durationMs: result.durationMs,
        placementRate: result.placementRate,
        summary: result.summary,
        failedCourses: result.failedExams?.map((f) => ({
          course: f.course,
          sessionsNeeded: 1,
          sessionsPlaced: 0,
          reason: f.reason,
        })) || [],
        softConstraintViolations: result.softConstraintViolations,
      });
    } catch (engineError) {
      await SchedulingRun.findByIdAndUpdate(run._id, {
        status: 'failed',
        completedAt: new Date(),
        error: engineError.message,
      });
      console.error('Exam scheduling engine error:', engineError);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scheduling/run/:runId — Poll run status
router.get('/run/:runId', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const run = await SchedulingRun.findById(req.params.runId)
      .populate('semester', 'name academicYear')
      .populate('triggeredBy', 'name email')
      .populate('failedCourses.course', 'code name expectedEnrollment level');
    if (!run) return res.status(404).json({ error: 'Scheduling run not found' });
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scheduling/runs — List all runs for a semester
router.get('/runs', verifyToken, requireRole('admin', 'academic_affairs'), async (req, res) => {
  try {
    const { semesterId, runType } = req.query;
    const query = {};
    if (semesterId) query.semester = semesterId;
    if (runType) query.runType = runType;

    const runs = await SchedulingRun.find(query)
      .populate('semester', 'name academicYear')
      .populate('triggeredBy', 'name')
      .sort({ ranAt: -1 })
      .limit(20);

    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
