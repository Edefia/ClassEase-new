import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import API from '@/lib/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await API.get('/notifications/my');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await API.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({ 
        title: "Error", 
        description: "Failed to mark notification as read", 
        variant: "destructive" 
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({ 
        title: "Success", 
        description: "All notifications marked as read" 
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({ 
        title: "Error", 
        description: "Failed to mark all notifications as read", 
        variant: "destructive" 
      });
    }
  };

  const addNotification = async (notificationData) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({ 
        title: "Permission Denied", 
        description: "You do not have permission to send notifications.", 
        variant: "destructive" 
      });
      return { success: false, error: "Permission Denied" };
    }

    setIsLoading(true);
    try {
      const response = await API.post('/notifications', notificationData);
      
      // If the notification is for the current user or global, add it to local state
      if (!notificationData.recipients || 
          notificationData.recipients.includes(user.id) || 
          notificationData.recipient_type === 'all') {
        setNotifications(prev => [response.data.notification, ...prev]);
      }
      
      setIsLoading(false);
      toast({ 
        title: "Success", 
        description: "Notification sent successfully" 
      });
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      console.error('Error sending notification:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send notification';
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
      return { success: false, error: errorMessage };
    }
  };

  const sendNotificationToAll = async (title, message, type = 'info', link = null) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({ 
        title: "Permission Denied", 
        description: "You do not have permission to send global notifications.", 
        variant: "destructive" 
      });
      return { success: false, error: "Permission Denied" };
    }

    return await addNotification({
      title,
      message,
      type,
      recipient_type: 'all',
      link
    });
  };

  const sendNotificationToBuilding = async (title, message, buildingId, type = 'info') => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({ 
        title: "Permission Denied", 
        description: "You do not have permission to send building notifications.", 
        variant: "destructive" 
      });
      return { success: false, error: "Permission Denied" };
    }

    return await addNotification({
      title,
      message,
      type,
      recipient_type: 'building',
      building_id: buildingId
    });
  };

  const sendNotificationToRole = async (title, message, role, type = 'info') => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({ 
        title: "Permission Denied", 
        description: "You do not have permission to send role-based notifications.", 
        variant: "destructive" 
      });
      return { success: false, error: "Permission Denied" };
    }

    return await addNotification({
      title,
      message,
      type,
      recipient_type: 'role',
      role_filter: role
    });
  };

  const removeNotification = async (notificationId) => {
    if (!user || user.role !== 'admin') {
      toast({ 
        title: "Permission Denied", 
        description: "Only admins can delete notifications.", 
        variant: "destructive" 
      });
      return { success: false, error: "Permission Denied" };
    }

    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast({ 
        title: "Success", 
        description: "Notification deleted successfully" 
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete notification", 
        variant: "destructive" 
      });
      return { success: false, error: "Failed to delete notification" };
    }
  };

  const getUnreadCount = () => {
    return unreadCount;
  };

  const refreshNotifications = () => {
    fetchNotifications();
    fetchUnreadCount();
  };

  const value = {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    sendNotificationToAll,
    sendNotificationToBuilding,
    sendNotificationToRole,
    removeNotification,
    getUnreadCount,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};