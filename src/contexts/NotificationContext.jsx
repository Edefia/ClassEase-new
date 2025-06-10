import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// --- Mock Data ---
const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'mock-user-id',
    title: 'Booking Approved',
    message: 'Your booking for Conference Hall A has been approved.',
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'mock-user-id',
    title: 'Upcoming Maintenance',
    message: 'The West Wing will be closed for maintenance tomorrow.',
    type: 'warning',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'notif-3',
    user_id: null, // Global notification
    title: 'Welcome to the new ClassEase!',
    message: 'We have updated our system. Enjoy the new features!',
    type: 'info',
    is_read: false,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];
// --- End Mock Data ---

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

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    // TODO: Replace with your actual API call
    setTimeout(() => {
      // Filter mock data for the current user + global notifications
      const userNotifications = mockNotifications.filter(
        n => n.user_id === user.id || n.user_id === null
      );
      setNotifications(userNotifications);
      setIsLoading(false);
    }, 500);
  };

  const markAsRead = async (notificationId) => {
    // TODO: Replace with your actual API call
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    // No toast needed for this simple action
  };

  const markAllAsRead = async () => {
    // TODO: Replace with your actual API call
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const addNotification = async (notificationData) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({ title: "Permission Denied", description: "You do not have permission to send notifications.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    // TODO: Replace with your actual API call
    console.log("Sending notification:", notificationData);
    setTimeout(() => {
        const newNotification = {
            id: `notif-${Date.now()}`,
            created_at: new Date().toISOString(),
            is_read: false,
            ...notificationData
        };
        // Add to local state if it's for the current user or global
        if (!newNotification.user_id || newNotification.user_id === user.id) {
            setNotifications(prev => [newNotification, ...prev]);
        }
        setIsLoading(false);
        toast({ title: "Notification Sent", description: "The notification has been sent successfully." });
    }, 500);
  };

  const sendNotificationToAll = async (title, message, type = 'info', link = null) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        toast({ title: "Permission Denied", description: "You do not have permission to send global notifications.", variant: "destructive" });
        return { success: false, error: "Permission Denied" };
    }
    // This is a mock. In a real app, this would hit a backend endpoint.
    console.log(`Sending global notification: ${title}`);
    addNotification({ user_id: null, title, message, type, link });
    return { success: true };
  };

  const removeNotification = async (notificationId) => {
    // This is a local removal for UI purposes.
    // TODO: Replace with your actual API call if needed.
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const value = {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    sendNotificationToAll,
    removeNotification,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};