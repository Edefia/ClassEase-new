
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  BarChart3,
  Clock,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/ui/notification-dropdown';

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getNavigationItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Calendar, label: 'Book Venue', path: '/dashboard/book' },
      { icon: Clock, label: 'My Bookings', path: '/dashboard/bookings' },
      { icon: MapPin, label: 'Campus Map', path: '/dashboard/map' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' }
    ];

    if (user?.role === 'manager' || user?.role === 'admin') {
      baseItems.push(
        { icon: Users, label: 'Manage Bookings', path: '/dashboard/manage' },
        { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' }
      );
    }

    if (user?.role === 'admin') {
      baseItems.push(
        { icon: Users, label: 'User Management', path: '/dashboard/users' },
        { icon: Settings, label: 'System Settings', path: '/dashboard/settings' }
      );
    }

    return baseItems;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className={`fixed lg:relative lg:translate-x-0 z-30 w-64 h-full sidebar-nav ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold gradient-text">ClassEase</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">{user?.name}</div>
                <div className="text-white/60 text-sm capitalize">{user?.role}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`nav-item flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white/70 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
