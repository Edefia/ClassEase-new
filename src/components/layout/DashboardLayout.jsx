import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, Clock, MapPin, Users, Building, Settings, LogOut,
  Menu, X, Bell, BarChart3, BookOpen, Shield, Send, ChevronRight,
  GraduationCap, ClipboardList, AlertTriangle, Wrench, UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

// Role-specific navigation items
const getNavigationConfig = (role) => {
  const common = [
    { section: 'Main' },
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
  ];

  const studentItems = [
    { icon: Calendar, label: 'Book Venue', path: '/dashboard/book' },
    { icon: Clock, label: 'My Bookings', path: '/dashboard/bookings' },
    { icon: MapPin, label: 'Find Venues', path: '/dashboard/venues' },
    { section: 'Academic' },
    { icon: BookOpen, label: 'My Timetable', path: '/dashboard/my-timetable' },
    { section: 'More' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  ];

  const lecturerItems = [
    { icon: Calendar, label: 'Book Venue', path: '/dashboard/book' },
    { icon: Clock, label: 'My Bookings', path: '/dashboard/bookings' },
    { icon: MapPin, label: 'Find Venues', path: '/dashboard/venues' },
    { section: 'Academic' },
    { icon: BookOpen, label: 'My Schedule', path: '/dashboard/my-schedule' },
    { icon: ClipboardList, label: 'Timetable', path: '/dashboard/timetable' },
    { section: 'More' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  ];

  const coordinatorItems = [
    { icon: Calendar, label: 'Book Venue', path: '/dashboard/book' },
    { icon: Clock, label: 'My Bookings', path: '/dashboard/bookings' },
    { icon: MapPin, label: 'Find Venues', path: '/dashboard/venues' },
    { section: 'Department' },
    { icon: BookOpen, label: 'Courses', path: '/dashboard/courses' },
    { icon: ClipboardList, label: 'Dept Timetable', path: '/dashboard/timetable' },
    { section: 'More' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  ];

  const managerItems = [
    { section: 'Management' },
    { icon: ClipboardList, label: 'Manage Bookings', path: '/dashboard/manage' },
    { section: 'Facilities' },
    { icon: Building, label: 'Manage Venues', path: '/dashboard/venues-manage' },
    { icon: MapPin, label: 'Browse Venues', path: '/dashboard/venues' },
    { section: 'Academic' },
    { icon: BookOpen, label: 'Timetable', path: '/dashboard/timetable' },
    { section: 'More' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Send, label: 'Send Notification', path: '/dashboard/send-notification' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  ];

  const adminItems = [
    { section: 'Management' },
    { icon: ClipboardList, label: 'Manage Bookings', path: '/dashboard/manage' },
    { section: 'Scheduling' },
    { icon: Wrench, label: 'Scheduling Panel', path: '/dashboard/scheduling' },
    { icon: Calendar, label: 'Semesters', path: '/dashboard/semesters' },
    { icon: Clock, label: 'Time Slots', path: '/dashboard/timeslot-settings' },
    { section: 'Academic' },
    { icon: BookOpen, label: 'Courses', path: '/dashboard/courses' },
    { icon: ClipboardList, label: 'Timetable', path: '/dashboard/timetable' },
    { section: 'Administration' },
    { icon: Users, label: 'Users', path: '/dashboard/users' },
    { icon: Building, label: 'Buildings', path: '/dashboard/buildings' },
    { icon: MapPin, label: 'Venues', path: '/dashboard/venues-manage' },
    { icon: GraduationCap, label: 'Departments', path: '/dashboard/departments' },
    { section: 'Insights' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { section: 'System' },
    { icon: Send, label: 'Send Notification', path: '/dashboard/send-notification' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const academicAffairsItems = [
    { section: 'Scheduling' },
    { icon: Wrench, label: 'Scheduling Panel', path: '/dashboard/scheduling' },
    { icon: Calendar, label: 'Semesters', path: '/dashboard/semesters' },
    { icon: Clock, label: 'Time Slots', path: '/dashboard/timeslot-settings' },
    { section: 'Academic' },
    { icon: BookOpen, label: 'Courses', path: '/dashboard/courses' },
    { icon: ClipboardList, label: 'Timetable', path: '/dashboard/timetable' },
    { section: 'More' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  ];

  const roleMap = {
    student: studentItems,
    lecturer: lecturerItems,
    department_coordinator: coordinatorItems,
    manager: managerItems,
    admin: adminItems,
    academic_affairs: academicAffairsItems,
  };

  return [...common, ...(roleMap[role] || studentItems)];
};

const DashboardLayout = ({ children, title, breadcrumbs = [] }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { unreadCount = 0 } = useNotifications();

  const navItems = getNavigationConfig(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: Shield,
      manager: Building,
      lecturer: BookOpen,
      student: GraduationCap,
      department_coordinator: ClipboardList,
      academic_affairs: Calendar,
    };
    return icons[role] || GraduationCap;
  };

  const RoleIcon = getRoleIcon(user?.role);

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`sidebar-institutional ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="w-9 h-9 bg-ucc-crimson rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="sidebar-brand-text">ClassEase</div>
            <div className="text-[10px] text-white/50 font-medium tracking-wide">UCC • Scheduling</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-white/60 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ucc-crimson-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{getUserInitials(user?.name)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="sidebar-user-name truncate">{user?.name}</div>
              <div className="sidebar-user-role flex items-center gap-1">
                <RoleIcon className="w-3 h-3" />
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={`section-${index}`} className="sidebar-nav-section">
                  {item.section}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-ucc-crimson text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-red-300 hover:text-red-200 hover:bg-red-500/10"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="breadcrumb hidden sm:flex">
              <Link to="/dashboard">Home</Link>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3 breadcrumb-separator" />
                  {crumb.path ? (
                    <Link to={crumb.path}>{crumb.label}</Link>
                  ) : (
                    <span className="breadcrumb-current">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
              {!breadcrumbs.length && title && (
                <>
                  <ChevronRight className="w-3 h-3 breadcrumb-separator" />
                  <span className="breadcrumb-current">{title}</span>
                </>
              )}
            </div>

            {/* Mobile title */}
            <h1 className="sm:hidden text-lg font-heading font-bold text-foreground">
              {title || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Link
              to="/dashboard/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>

            {/* User avatar */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
              <div className="w-8 h-8 bg-ucc-navy rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{getUserInitials(user?.name)}</span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-foreground leading-tight">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {title && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl font-heading font-bold text-foreground">{title}</h1>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
