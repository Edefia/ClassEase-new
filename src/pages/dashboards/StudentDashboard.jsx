
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Info
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';
import MyBookingsPage from './shared/MyBookingsPage';
import CampusMapPage from './shared/CampusMapPage';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const userBookings = getUserBookings(user?.id);
  const recentBookings = userBookings.slice(0, 5);

  const stats = [
    {
      title: 'Total Bookings',
      value: userBookings.length,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Approved',
      value: userBookings.filter(b => b.status === 'approved').length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Pending',
      value: userBookings.filter(b => b.status === 'pending').length,
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Available Venues',
      value: venues.length,
      icon: MapPin,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', value: 'dashboard' },
    { icon: BookOpen, label: 'My Bookings', value: 'bookings' },
    { icon: Bell, label: 'Notifications', value: 'notifications' },
    { icon: Settings, label: 'Settings', value: 'settings' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'declined':
        return 'status-declined';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col duration-300 ease-in-out lg:translate-x-0  lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">ClassEase</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name}</p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                <p className="text-blue-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation in Sidebar */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.value}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === item.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setSelectedTab(item.value)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen max-h-screen overflow-y-auto flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            {/* Mobile/Tablet: App Logo/Name on left, Bell & Hamburger on right */}
            <div className="flex items-center w-full lg:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">ClassEase</span>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <Bell className="w-5 h-5 text-white" />
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-white hover:text-gray-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Desktop: Notifications on right */}
            <div className="hidden lg:flex items-center space-x-2 text-white ml-auto">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 flex flex-col">
          {selectedTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30"
              >
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Welcome back, {user?.name}!
                    </h2>
                    <p className="text-white/70 text-lg">
                      Ready to book your next venue? Let's get started.
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-6 py-3"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Book Venue
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm font-medium">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">
                              {stat.value}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Bookings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>Recent Bookings</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        View All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No bookings yet
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Start by booking your first venue!
                        </p>
                        <Button
                          onClick={() => setShowBookingModal(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentBookings.map((booking) => (
                          <motion.div
                            key={booking.id}
                            whileHover={{ scale: 1.01 }}
                            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1">
                                    <h4 className="text-white font-semibold">
                                      {booking.venueName}
                                    </h4>
                                    <p className="text-gray-300 text-sm">
                                      {booking.purpose}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center text-gray-300 text-sm mb-1">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {formatDate(booking.date)}
                                    </div>
                                    <div className="flex items-center text-gray-300 text-sm">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            {booking.status === 'declined' && booking.reasonIfDeclined && (
                              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-300 text-sm">
                                  <strong>Reason:</strong> {booking.reasonIfDeclined}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
              >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Quick Book</h3>
                    <p className="text-gray-300 text-sm">
                      Book a venue for your next class or event
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Campus Map</h3>
                    <p className="text-gray-300 text-sm">
                      Explore available venues on the interactive map
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">My Schedule</h3>
                    <p className="text-gray-300 text-sm">
                      View your upcoming bookings and schedule
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
          {selectedTab === 'bookings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-3xl">
                <div className="flex items-center mb-6">
                  <BookOpen className="w-7 h-7 text-primary mr-3" />
                  <h2 className="text-2xl font-bold text-white">My Bookings</h2>
                </div>
                {/* Booking List or Empty State */}
                {userBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center bg-gray-900/80 rounded-xl p-10 border border-gray-800">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
                    <p className="text-muted-foreground mb-4">You haven't made any bookings yet.</p>
                    <Button onClick={() => setShowBookingModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Book a Venue</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-1">{booking.venueName || 'Venue Name Missing'}</h4>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              {formatDate(booking.date)}
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <Clock className="w-4 h-4 mr-2 text-primary" />
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              {booking.location || 'Location N/A'}
                            </div>
                            <p className="text-muted-foreground text-xs">Purpose: {booking.purpose}</p>
                          </div>
                          <div className="flex flex-col items-end mt-4 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(booking.status)}`}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            {booking.status === 'declined' && booking.reasonIfDeclined && (
                              <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs mt-2">
                                <strong>Reason:</strong> {booking.reasonIfDeclined}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {selectedTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-xl bg-gray-900/80 rounded-xl p-10 border border-gray-800 flex flex-col items-center">
                <Bell className="w-14 h-14 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
                <p className="text-muted-foreground mb-2">You have no notifications at this time.</p>
                <p className="text-muted-foreground text-sm">Important updates and alerts will appear here.</p>
              </div>
            </motion.div>
          )}
          {selectedTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-xl bg-gray-900/80 rounded-xl p-10 border border-gray-800 flex flex-col items-center">
                <Settings className="w-14 h-14 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
                <p className="text-muted-foreground mb-2">Settings page coming soon.</p>
                <p className="text-muted-foreground text-sm">Manage your account and preferences here.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
};

export default StudentDashboard;
