
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, TrendingUp, Building, Eye, Menu, X, User, Bell, LogOut, Settings 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const { bookings, venues, getPendingBookings, getBookingStats } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingBookings = Array.isArray(getPendingBookings()) ? getPendingBookings() : [];
  const stats = getBookingStats ? getBookingStats() : { total: 0, pending: 0, approved: 0 };
  const recentBookings = Array.isArray(bookings) ? bookings.slice(0, 10) : [];

  const dashboardStats = [
    {
      title: 'Total Bookings',
      value: stats.total,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      change: '+12%'
    },
    {
      title: 'Pending Approval',
      value: stats.pending,
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-500',
      change: '+5%'
    },
    {
      title: 'Approved Today',
      value: stats.approved,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      change: '+8%'
    },
    {
      title: 'Available Venues',
      value: Array.isArray(venues) ? venues.length : 0,
      icon: Building,
      color: 'from-purple-500 to-pink-500',
      change: '0%'
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

  const handleReviewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowApprovalModal(true);
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
                <Building className="w-5 h-5 text-white" />
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
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white">
              <Building className="w-5 h-5" />
              <span className="font-medium">Manage Venues</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white">
              <Users className="w-5 h-5" />
              <span className="font-medium">Bookings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white">
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
                  <Building className="w-5 h-5 text-white" />
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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome, {user?.name}
              </h2>
              <p className="text-white/70 text-lg">
                Manage venue bookings and oversee facility operations.
              </p>
              <div className="mt-4 flex items-center space-x-4 text-white/60">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {user?.department}
                </span>
                <span>Staff ID: {user?.staffId}</span>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-4">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Building className="w-4 h-4 mr-2" />
                Manage Venues
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="dashboard-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm font-medium">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {stat.value}
                      </p>
                      <p className="text-green-400 text-sm mt-1">
                        {stat.change} from last week
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="pending" className="data-[state=active]:bg-white/20">
                Pending Approvals ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-white/20">
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="venues" className="data-[state=active]:bg-white/20">
                Venue Overview
              </TabsTrigger>
            </TabsList>

            {/* Pending Approvals */}
            <TabsContent value="pending">
              <Card className="dashboard-card border-0">
                <CardHeader>
                  <CardTitle className="text-white">Pending Booking Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        All caught up!
                      </h3>
                      <p className="text-white/70">
                        No pending bookings require your approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingBookings.map((booking) => (
                        <motion.div
                          key={booking.id}
                          whileHover={{ scale: 1.02 }}
                          className="booking-card p-6 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-white font-semibold text-lg">
                                    {booking.venueName}
                                  </h4>
                                  <p className="text-white/70 mb-2">
                                    Requested by: {booking.userName}
                                  </p>
                                  <p className="text-white/80 mb-3">
                                    Purpose: {booking.purpose}
                                  </p>
                                  <div className="flex items-center space-x-6 text-white/70 text-sm">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      {formatDate(booking.date)}
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleReviewBooking(booking)}
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Activity */}
            <TabsContent value="recent">
              <Card className="dashboard-card border-0">
                <CardHeader>
                  <CardTitle className="text-white">Recent Booking Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        whileHover={{ scale: 1.02 }}
                        className="booking-card p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold">
                                  {booking.venueName}
                                </h4>
                                <p className="text-white/70 text-sm">
                                  {booking.userName} • {booking.purpose}
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
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Venue Overview */}
            <TabsContent value="venues">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(venues) ? venues.map((venue) => (
                  <motion.div
                    key={venue.id}
                    whileHover={{ scale: 1.05 }}
                    className="dashboard-card p-6 rounded-lg"
                  >
                    <img  
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      alt={`${venue.name} - ${venue.location}`}
                     src={venue.image} />
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {venue.name}
                    </h3>
                    <p className="text-white/70 text-sm mb-3">
                      {venue.location} • Capacity: {venue.capacity}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.isArray(venue.amenities) ? venue.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs"
                        >
                          {amenity}
                        </span>
                      )) : null}
                      {Array.isArray(venue.amenities) && venue.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">
                          +{venue.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10"
                    >
                      View Details
                    </Button>
                  </motion.div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <Building className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No venues available
                    </h3>
                    <p className="text-white/70">
                      Venue data is currently unavailable.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
        </div>
      </div>

      {/* Booking Approval Modal */}
      <BookingApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        booking={selectedBooking}
      />
    </div>
  );
};

export default ManagerDashboard;
