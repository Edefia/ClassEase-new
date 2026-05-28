import express from 'express';
import DepartmentSubmission from '../models/DepartmentSubmission.js';
import Course from '../models/Course.js';
import verifyToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleGuard.js';

const router = express.Router();

// Get submissions for a specific semester
router.get('/semester/:semesterId', verifyToken, requireRole('admin', 'academic_affairs', 'manager', 'department_coordinator'), async (req, res) => {
  try {
    let query = { semester: req.params.semesterId };
    
    // If coordinator, only see their department's submission
    if (req.user.role === 'department_coordinator') {
      if (!req.user.department) return res.status(400).json({ error: 'User has no department assigned' });
      query.department = req.user.department;
    }

    const submissions = await DepartmentSubmission.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');
      
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a department's courses
router.post('/semester/:semesterId/submit', verifyToken, requireRole('department_coordinator', 'admin'), async (req, res) => {
  try {
    const departmentId = req.user.role === 'admin' ? req.body.departmentId : req.user.department;
    if (!departmentId) return res.status(400).json({ error: 'Department ID required' });

    // Update all courses for this department in this semester to 'submitted'
    // if they were in 'draft' or 'rejected'
    const result = await Course.updateMany(
      { 
        semesterRef: req.params.semesterId, 
        department: departmentId,
        submissionStatus: { $in: ['draft', 'rejected'] } 
      },
      { 
        submissionStatus: 'submitted',
        submittedBy: req.user._id 
      }
    );

    // Get total counts
    const courses = await Course.find({ semesterRef: req.params.semesterId, department: departmentId });
    const totalByLevel = { level100: 0, level200: 0, level300: 0, level400: 0, level500: 0, level600: 0 };
    courses.forEach(c => {
      if (c.level && totalByLevel[`level${c.level}`] !== undefined) {
        totalByLevel[`level${c.level}`]++;
      }
    });

    // Update or create submission record
    const submission = await DepartmentSubmission.findOneAndUpdate(
      { semester: req.params.semesterId, department: departmentId },
      { 
        status: 'submitted',
        submittedBy: req.user._id,
        submittedAt: new Date(),
        totalCourses: courses.length,
        totalByLevel,
        rejectionReason: ''
      },
      { new: true, upsert: true }
    );

    res.json({ message: `Successfully submitted ${result.modifiedCount} courses`, submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a submission
router.post('/:id/review', verifyToken, requireRole('academic_affairs', 'admin', 'manager'), async (req, res) => {
  try {
    const { action, reason } = req.body; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
    }
    
    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const submission = await DepartmentSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    submission.status = newStatus;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.rejectionReason = reason || '';
    
    await submission.save();

    // Update all related courses
    await Course.updateMany(
      { semesterRef: submission.semester, department: submission.department },
      { 
        submissionStatus: newStatus,
        approvedBy: action === 'approve' ? req.user._id : null,
        rejectionReason: reason || ''
      }
    );

    res.json({ message: `Submission ${newStatus}`, submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
