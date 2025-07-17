import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Building, Users, BookOpen, TrendingUp, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import BookingModal from '@/components/modals/BookingModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyBookingsPage = () => {
  const { user } = useAuth();
  const { bookings, isLoading, fetchBookings, updateBookingStatus, venues } = useBooking();
  const [userBookings, setUserBookings] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, fetchBookings]);

  useEffect(() => {
    if (user && bookings.length > 0) {
      setUserBookings(bookings.filter(b => b.user_id === user.id));
    } else {
      setUserBookings([]);
    }
  }, [user, bookings]);

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowBookingModal(true); 
  };

  const handleCancelBooking = async (bookingId) => {
    const result = await updateBookingStatus(bookingId, 'cancelled', 'Cancelled by user');
    if (result.success) {
      fetchBookings();
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200";
    
    switch (status) {
      case 'approved':
        return (
          <span className={`${baseClasses} bg-emerald-100 text-emerald-700 border border-emerald-200`}>
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-amber-100 text-amber-700 border border-amber-200`}>
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'declined':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-700 border border-red-200`}>
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`}>
            <Trash2 className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`}>
            {status}
          </span>
        );
    }
  };

  const getDateBadge = (date) => {
    try {
      const parsedDate = parseISO(date);
      if (isToday(parsedDate)) {
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Today</span>;
      } else if (isTomorrow(parsedDate)) {
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">Tomorrow</span>;
      } else if (isYesterday(parsedDate)) {
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Yesterday</span>;
      }
    } catch {}
    return null;
  };

  const filteredBookings = userBookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const stats = {
    total: userBookings.length,
    approved: userBookings.filter(b => b.status === 'approved').length,
    pending: userBookings.filter(b => b.status === 'pending').length,
    upcoming: userBookings.filter(b => {
      try {
        return b.status === 'approved' && parseISO(b.date) > new Date();
      } catch {
        return false;
      }
    }).length
  };

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-white/70">Manage and track your venue reservations</p>
          </div>
          <Button 
            onClick={() => setShowBookingModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Book New Venue
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <CalendarDays className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.approved}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Upcoming</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.upcoming}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {[
            { key: 'all', label: 'All Bookings', count: stats.total },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'declined', label: 'Declined', count: userBookings.filter(b => b.status === 'declined').length },
            { key: 'cancelled', label: 'Cancelled', count: userBookings.filter(b => b.status === 'cancelled').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterStatus === filter.key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredBookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-white/50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              {filterStatus === 'all' 
                ? "You haven't made any bookings yet. Start by booking your first venue!"
                : `No ${filterStatus} bookings found.`
              }
              </p>
            {filterStatus === 'all' && (
              <Button 
                onClick={() => setShowBookingModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Book Your First Venue
              </Button>
            )}
          </motion.div>
        )}

        {/* Bookings Grid */}
        {!isLoading && filteredBookings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking, index) => {
              const venueObj = booking.venue && typeof booking.venue === 'object' ? booking.venue :
                venues.find(v => v._id?.toString() === (booking.venue?._id?.toString() || booking.venue?.toString() || booking.venueId?.toString()));
              const venueName = venueObj?.name || 'Venue Name Missing';
              const venueLocation = venueObj?.location || 'N/A';
              const venueType = venueObj?.type || 'N/A';
              const venueCapacity = venueObj?.capacity || 'N/A';

              let dateStr = 'Invalid Date';
              let timeStr = 'Invalid Time';
              let dateObj = null;
              
              if (booking.date) {
                try {
                  dateObj = parseISO(booking.date);
                  dateStr = format(dateObj, 'EEEE, MMMM d, yyyy');
                } catch {}
              }
              
              const startTime = booking.timeStart || booking.start_time;
              const endTime = booking.timeEnd || booking.end_time;
              if (startTime && endTime) {
                try {
                  timeStr = `${format(parseISO(`1970-01-01T${startTime}Z`), 'h:mm a')} - ${format(parseISO(`1970-01-01T${endTime}Z`), 'h:mm a')}`;
                } catch {}
              }

              return (
                <motion.div
                  key={booking._id || booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-white mb-1">{venueName}</CardTitle>
                          <div className="flex items-center gap-2 text-white/70 text-sm">
                            <Building className="w-4 h-4" />
                            <span>{venueType}</span>
                            <span>•</span>
                            <Users className="w-4 h-4" />
                            <span>Capacity: {venueCapacity}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                          {dateObj && getDateBadge(booking.date)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Purpose */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/90 font-medium mb-1">Purpose</p>
                        <p className="text-white/70 text-sm">{booking.purpose}</p>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white/70 text-xs font-medium">Date</p>
                            <p className="text-white font-medium">{dateStr}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Clock className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white/70 text-xs font-medium">Time</p>
                            <p className="text-white font-medium">{timeStr}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <MapPin className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-medium">Location</p>
                          <p className="text-white font-medium">{venueLocation}</p>
                        </div>
                      </div>

                      {/* Decline Reason */}
                      {booking.status === 'declined' && (booking.reason_if_declined || booking.reasonIfDeclined) && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-red-400 text-xs font-medium mb-1">Reason for Decline</p>
                              <p className="text-red-300 text-sm">{booking.reason_if_declined || booking.reasonIfDeclined}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {(booking.status === 'pending' || booking.status === 'approved') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Cancel Booking
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Cancel Booking</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Are you sure you want to cancel your booking for <strong>{venueName}</strong> on {dateStr}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-800 text-gray-300 hover:bg-gray-700">Keep Booking</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelBooking(booking._id || booking.id)} 
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Confirm Cancellation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setEditingBooking(null);
        }}
      />
    </DashboardLayout>
  );
};

export default MyBookingsPage;