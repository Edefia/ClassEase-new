
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Plus, CheckCircle, XCircle, AlertCircle, Users, Menu, X, User, Bell, Settings, LogOut 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';
import API from '@/lib/api';
import FindVenuesPage from './shared/FindVenuesPage';

const LecturerDashboard = () => {
  const { user, logout } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [venuesData, setVenuesData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  useEffect(() => {
    setLoadingVenues(true);
    API.get('/venues').then(res => setVenuesData(res.data)).finally(() => setLoadingVenues(false));
    setLoadingBookings(true);
    API.get('/bookings').then(res => setBookingsData(res.data)).finally(() => setLoadingBookings(false));
  }, []);

  const userBookings = getUserBookings(user?.id);
  const recentBookings = userBookings.slice(0, 5);
  const upcomingBookings = userBookings.filter(booking => 
    booking.status === 'approved' && new Date(booking.date) >= new Date()
  );

  const stats = [
    {
      title: 'Total Bookings',
      value: userBookings.length,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Upcoming Classes',
      value: upcomingBookings.length,
      icon: Clock,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Pending Approval',
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
                <Users className="w-5 h-5 text-white" />
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => setSelectedTab('dashboard')}>
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'findVenues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => setSelectedTab('findVenues')}>
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Find Venues</span>
            </button>
            <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'myBookings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => setSelectedTab('myBookings')}>
              <Users className="w-5 h-5" />
              <span className="font-medium">My Bookings</span>
            </button>
            <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => setSelectedTab('settings')}>
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
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
                  <Users className="w-5 h-5 text-white" />
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

        {/* Tab Content */}
        {selectedTab === 'dashboard' && (
          <div className="flex-1 p-6 flex flex-col space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Welcome, {user?.name}
                  </h2>
                  <p className="text-white/70 text-lg">
                    Manage your lectures and book venues for your classes.
                  </p>
                  <div className="mt-4 flex items-center space-x-4 text-white/60">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {user?.department}
                    </span>
                    <span>Staff ID: {user?.staffId}</span>
                  </div>
                </div>
                <div className="mt-6 md:mt-0">
                  <Button
                    onClick={() => setShowBookingModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Book Lecture Hall
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Upcoming Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Upcoming Classes</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      View Schedule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No upcoming classes
                      </h3>
                      <p className="text-white/70 mb-6">
                        Book a venue for your next lecture!
                      </p>
                      <Button
                        onClick={() => setShowBookingModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Book Venue
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.slice(0, 3).map((booking) => (
                        <motion.div
                          key={booking.id}
                          whileHover={{ scale: 1.02 }}
                            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold">
                                    {booking.venueName}
                                  </h4>
                                  <p className="text-white/70 text-sm">
                                    {booking.purpose}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center text-white/70 text-sm mb-1">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(booking.date)}
                                  </div>
                                  <div className="flex items-center text-white/70 text-sm">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className="px-3 py-1 rounded-full text-white text-xs font-medium status-approved">
                                Confirmed
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Booking Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        whileHover={{ scale: 1.02 }}
                          className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold">
                                  {booking.venueName}
                                </h4>
                                <p className="text-white/70 text-sm">
                                  {booking.purpose}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center text-white/70 text-sm mb-1">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(booking.date)}
                                </div>
                                <div className="flex items-center text-white/70 text-sm">
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Book Lecture Hall</h3>
                  <p className="text-white/70 text-sm">
                    Reserve a venue for your next lecture or seminar
                  </p>
                </CardContent>
              </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Find Venues</h3>
                  <p className="text-white/70 text-sm">
                    Explore available lecture halls and facilities
                  </p>
                </CardContent>
              </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Class Schedule</h3>
                  <p className="text-white/70 text-sm">
                    View and manage your teaching schedule
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
        {selectedTab === 'findVenues' && (
          <FindVenuesPage onBookNow={venue => {
            setSelectedVenue(venue);
            setShowBookingModal(true);
          }} />
        )}
        {selectedTab === 'myBookings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>
            {/* Render a table or cards of userBookings with status, venue, date, time, and actions */}
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-4 text-left">Venue</th>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Time</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {userBookings.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-white/70">No bookings found.</td></tr>
                  ) : (
                    userBookings.map((b, idx) => (
                      <tr key={b._id || idx} className="border-b border-white/10">
                        <td className="py-2 px-4">{b.venue?.name || 'N/A'}</td>
                        <td className="py-2 px-4">{formatDate(b.date)}</td>
                        <td className="py-2 px-4">{formatTime(b.timeStart)} - {formatTime(b.timeEnd)}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="py-2 px-4">{b.purpose || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Profile & Settings</h2>
            <div className="bg-white/5 rounded-lg p-6 max-w-lg">
              <div className="mb-4">
                <span className="block text-white/70 text-sm mb-1">Name</span>
                <span className="block text-white font-semibold">{user?.name}</span>
              </div>
              <div className="mb-4">
                <span className="block text-white/70 text-sm mb-1">Email</span>
                <span className="block text-white font-semibold">{user?.email}</span>
              </div>
              <div className="mb-4">
                <span className="block text-white/70 text-sm mb-1">Role</span>
                <span className="block text-white font-semibold capitalize">{user?.role}</span>
              </div>
              {/* Add more settings/profile actions here */}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedVenue(null);
        }}
        initialVenueId={selectedVenue?._id || selectedVenue?.id}
        initialBuildingId={selectedVenue?.building?._id || selectedVenue?.building?.id}
      />
    </div>
  );
};

export default LecturerDashboard;
