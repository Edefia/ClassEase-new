import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import BookingModal from '@/components/modals/BookingModal'; // For editing
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

  useEffect(() => {
    if (user) {
      fetchBookings(); // Ensure bookings are fetched for the current user
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
    // For simplicity, we'll re-use the BookingModal.
    // In a real app, you might have a dedicated edit modal or pre-fill the form.
    // This example will just open the booking modal; actual edit logic needs to be added to BookingModal.
    setEditingBooking(booking); // You might pass this to BookingModal to prefill
    setShowBookingModal(true); 
  };

  const handleCancelBooking = async (bookingId) => {
    // This assumes 'cancelled' is a valid status in your DB schema and RLS allows users to cancel their own pending/approved bookings.
    const result = await updateBookingStatus(bookingId, 'cancelled', 'Cancelled by user');
    if (result.success) {
      fetchBookings(); // Refresh
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'declined':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center"><XCircle className="w-3 h-3 mr-1" />Declined</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center"><Trash2 className="w-3 h-3 mr-1" />Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-foreground"
        >
          Your Bookings
        </motion.h1>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner-large border-primary"></div>
          </div>
        )}

        {!isLoading && userBookings.length === 0 && (
          <Card className="bg-card text-card-foreground border-border">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Bookings Found</h3>
              <p className="text-muted-foreground mt-2">
                You haven't made any bookings yet.
              </p>
              <Button onClick={() => setShowBookingModal(true)} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                Book a Venue
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && userBookings.length > 0 && (
          <div className="space-y-4">
            {userBookings.map((booking, index) => {
              // Try all possible ways to get the venue ID
              const venueId =
                booking.venue_id ||
                booking.venue?._id ||
                booking.venue?.id ||
                booking.venue ||
                booking.venueId;

              // Find the venue in the venues array
              const venue = venues.find(
                v => v._id?.toString() === venueId?.toString() || v.id?.toString() === venueId?.toString()
              );

              // Optionally, for debugging:
              // console.log('Booking:', booking, 'VenueId:', venueId, 'Venue:', venue);

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-card text-card-foreground border-border shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                      <CardTitle className="text-lg text-foreground">{venue ? venue.name : 'Venue Name Missing'}</CardTitle>
                      {getStatusBadge(booking.status)}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground text-sm">Purpose: {booking.purpose}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 text-primary" />
                          Date: {booking.date ? format(parseISO(booking.date), 'PPP') : 'Invalid Date'}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          Time: {booking.start_time && booking.end_time ? `${format(parseISO(`1970-01-01T${booking.start_time}Z`), 'p')} - ${format(parseISO(`1970-01-01T${booking.end_time}Z`), 'p')}` : 'Invalid Time'}
                        </div>
                      </div>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-primary" />
                        Location: {venue ? (venue.location || 'N/A') : 'N/A'}
                      </div>
                      {booking.status === 'declined' && booking.reason_if_declined && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          Reason for decline: {booking.reason_if_declined}
                        </div>
                      )}
                      <div className="flex space-x-2 pt-2">
                        {(booking.status === 'pending' || booking.status === 'approved') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This action will cancel your booking for {venue ? venue.name : 'Venue'} on {booking.date ? format(parseISO(booking.date), 'PPP') : 'Invalid Date'}. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-muted">Keep Booking</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelBooking(booking.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        // Pass `editingBooking` to prefill the modal if implementing edit functionality
        // initialData={editingBooking} 
      />
    </DashboardLayout>
  );
};

export default MyBookingsPage;