
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Building,
  Eye
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { bookings, venues, getPendingBookings, getBookingStats } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const pendingBookings = getPendingBookings();
  const stats = getBookingStats();
  const recentBookings = bookings.slice(0, 10);

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
      value: venues.length,
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
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-8">
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
                {venues.map((venue) => (
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
                      {venue.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {venue.amenities.length > 3 && (
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
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Booking Approval Modal */}
      <BookingApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        booking={selectedBooking}
      />
    </DashboardLayout>
  );
};

export default ManagerDashboard;
