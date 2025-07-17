import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Building from '../models/Building.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

// Get notifications for current user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    const query = {
      $or: [
        { recipients: userId },
        { recipient_type: 'all' },
        { recipient_type: 'role', role_filter: req.user.role },
        { recipient_type: 'building', building_id: { $in: req.user.assigned_buildings || [] } }
      ]
    };

    if (unread_only === 'true') {
      query.read_by = { $not: { $elemMatch: { user: userId } } };
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .populate('building_id', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Mark which notifications are read by current user
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      is_read: notification.read_by?.some(read => read.user.toString() === userId) || false
    }));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications: notificationsWithReadStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count for current user
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = {
      $or: [
        { recipients: userId },
        { recipient_type: 'all' },
        { recipient_type: 'role', role_filter: req.user.role },
        { recipient_type: 'building', building_id: { $in: req.user.assigned_buildings || [] } }
      ],
      read_by: { $not: { $elemMatch: { user: userId } } }
    };

    const count = await Notification.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = {
      $or: [
        { recipients: userId },
        { recipient_type: 'all' },
        { recipient_type: 'role', role_filter: req.user.role },
        { recipient_type: 'building', building_id: { $in: req.user.assigned_buildings || [] } }
      ],
      read_by: { $not: { $elemMatch: { user: userId } } }
    };

    await Notification.updateMany(query, {
      $push: { read_by: { user: userId, read_at: new Date() } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Create notification (Admin/Manager only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, message, type, recipient_type, recipients, building_id, role_filter, priority, category, expires_at, link } = req.body;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Validate required fields
    if (!title || !message || !recipient_type) {
      return res.status(400).json({ error: 'Title, message, and recipient type are required' });
    }

    // Handle different recipient types
    let finalRecipients = [];
    let finalBuildingId = building_id;

    switch (recipient_type) {
      case 'all':
        // No specific recipients needed
        break;
      
      case 'specific':
        if (!recipients || recipients.length === 0) {
          return res.status(400).json({ error: 'Recipients are required for specific notifications' });
        }
        finalRecipients = recipients;
        break;
      
      case 'building':
        if (!building_id) {
          return res.status(400).json({ error: 'Building ID is required for building notifications' });
        }
        
        // For managers, ensure they can only send to their assigned buildings
        if (req.user.role === 'manager') {
          const userBuildings = req.user.assigned_buildings || [];
          if (!userBuildings.includes(building_id)) {
            return res.status(403).json({ error: 'You can only send notifications to your assigned buildings' });
          }
        }
        
        // Get all users in the building
        const buildingUsers = await User.find({ 
          $or: [
            { assigned_buildings: building_id },
            { role: 'student' }, // Students can receive building notifications
            { role: 'lecturer' }  // Lecturers can receive building notifications
          ]
        }).select('_id');
        
        finalRecipients = buildingUsers.map(user => user._id);
        break;
      
      case 'role':
        if (!role_filter) {
          return res.status(400).json({ error: 'Role filter is required for role-based notifications' });
        }
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid recipient type' });
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      recipient_type,
      recipients: finalRecipients,
      building_id: finalBuildingId,
      role_filter,
      sender: req.user.id,
      priority: priority || 'medium',
      category: category || 'announcement',
      expires_at: expires_at ? new Date(expires_at) : null,
      link
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('sender', 'name email');

    res.status(201).json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get all notifications (Admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { page = 1, limit = 20, type, category, recipient_type } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (recipient_type) query.recipient_type = recipient_type;

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .populate('building_id', 'name')
      .populate('recipients', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Delete notification (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get users for notification recipients (Admin/Manager only)
router.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { building_id, role } = req.query;
    let query = {};

    // Managers can only see users in their assigned buildings
    if (req.user.role === 'manager') {
      const userBuildings = req.user.assigned_buildings || [];
      if (building_id && !userBuildings.includes(building_id)) {
        return res.status(403).json({ error: 'You can only view users in your assigned buildings' });
      }
      query.assigned_buildings = { $in: userBuildings };
    }

    if (building_id) {
      query.assigned_buildings = building_id;
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email role assigned_buildings')
      .populate('assigned_buildings', 'name')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get buildings for notification (Admin/Manager only)
router.get('/buildings', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    let query = {};

    // Managers can only see their assigned buildings
    if (req.user.role === 'manager') {
      const userBuildings = req.user.assigned_buildings || [];
      query._id = { $in: userBuildings };
    }

    const buildings = await Building.find(query)
      .select('name location')
      .sort({ name: 1 });

    res.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

export default router; 