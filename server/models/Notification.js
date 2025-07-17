import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'booking', 'system'],
    default: 'info',
  },
  recipient_type: {
    type: String,
    enum: ['all', 'specific', 'building', 'role'],
    required: true,
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  building_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
  },
  role_filter: {
    type: String,
    enum: ['student', 'lecturer', 'manager', 'admin'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  read_by: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    read_at: {
      type: Date,
      default: Date.now,
    },
  }],
  link: {
    type: String,
    trim: true,
  },
  expires_at: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  category: {
    type: String,
    enum: ['booking', 'system', 'maintenance', 'announcement', 'reminder'],
    default: 'announcement',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for efficient queries
notificationSchema.index({ recipients: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ recipient_type: 1, building_id: 1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expires_at && new Date() > this.expires_at;
});

// Method to mark as read for a specific user
notificationSchema.methods.markAsRead = function(userId) {
  const existingRead = this.read_by.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.read_by.push({ user: userId, read_at: new Date() });
  }
  return this.save();
};

// Method to check if user has read this notification
notificationSchema.methods.isReadByUser = function(userId) {
  return this.read_by.some(read => read.user.toString() === userId.toString());
};

// Static method to create system notifications
notificationSchema.statics.createSystemNotification = function(data) {
  return this.create({
    ...data,
    recipient_type: 'all',
    type: 'system',
    category: 'system',
  });
};

// Static method to create booking notifications
notificationSchema.statics.createBookingNotification = function(booking, action) {
  const notifications = [];
  
  // Notification for the user who made the booking
  notifications.push({
    title: `Booking ${action}`,
    message: `Your booking for ${booking.venue?.name || 'venue'} on ${booking.date} has been ${action}.`,
    recipient_type: 'specific',
    recipients: [booking.user_id],
    type: action === 'approved' ? 'success' : action === 'declined' ? 'error' : 'info',
    category: 'booking',
    metadata: { booking_id: booking._id, action },
  });

  // If declined, include reason
  if (action === 'declined' && booking.reason_if_declined) {
    notifications[0].message += ` Reason: ${booking.reason_if_declined}`;
  }

  return this.insertMany(notifications);
};

export default mongoose.model('Notification', notificationSchema); 