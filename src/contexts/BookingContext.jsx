import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';

// --- Remove Mock Data ---

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Replace with your actual API calls
    fetchVenues();
    if (isAuthenticated && user) {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/venues');
      setVenues(res.data);
    } catch (err) {
      setVenues([]);
    }
    setIsLoading(false);
  };

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await API.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      setBookings([]);
    }
    setIsLoading(false);
  };
  
  const createBooking = async (bookingData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a booking.", variant: "destructive" });
      return { success: false, error: "User not authenticated" };
    }
    setIsLoading(true);

    try {
      let payload;
      if (Array.isArray(bookingData)) {
        // Recurring bookings
        payload = {
          bookings: bookingData.map(b => ({
            venue: b.venueId,
            date: b.date,
            timeStart: b.startTime,
            timeEnd: b.endTime,
            purpose: b.purpose,
            type: b.recurrence === 'weekly' ? 'recurring' : 'once',
          }))
        };
      } else {
        // Single booking
        payload = {
          venue: bookingData.venueId,
          date: bookingData.date,
          timeStart: bookingData.startTime,
          timeEnd: bookingData.endTime,
          purpose: bookingData.purpose,
          type: bookingData.recurrence === 'weekly' ? 'recurring' : 'once',
        };
      }
      const res = await API.post('/bookings', payload);
      setIsLoading(false);
      toast({
        title: "Booking Created",
        description: "Your booking request has been submitted for approval.",
      });
      await fetchBookings(); // Refresh bookings after successful booking
      return { success: true, booking: res.data };
    } catch (err) {
      setIsLoading(false);
      let msg = err.response?.data?.message || err.message;
      toast({ title: "Booking Failed", description: msg, variant: "destructive" });
      return { success: false, error: msg };
    }
  };

  const updateBookingStatus = async (bookingId, status, userName, reason = null) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Action requires authentication.", variant: "destructive" });
      return { success: false, error: "User not authenticated" };
    }
    setIsLoading(true);

    try {
      let res;
      if (status === 'approved') {
        res = await API.put(`/bookings/${bookingId}/approve`);
      } else if (status === 'declined') {
        res = await API.put(`/bookings/${bookingId}/decline`, { reason });
      } else {
        throw new Error('Invalid status');
      }
      await fetchBookings(); // Refresh bookings after update
      setIsLoading(false);
      toast({
        title: "Booking Updated",
        description: `Booking has been ${status}.`,
      });
      return { success: true, booking: res.data };
    } catch (err) {
      setIsLoading(false);
      let msg = err.response?.data?.message || err.message;
      toast({ title: "Update Failed", description: msg, variant: "destructive" });
      return { success: false, error: msg };
    }
  };

  const getUserBookings = (userIdToFilter) => {
    return bookings.filter(booking => booking.user_id === userIdToFilter);
  };

  const getPendingBookings = () => {
    return bookings.filter(booking => booking.status === 'pending');
  };

  const getVenueBookings = (venueId, date) => {
    return bookings.filter(booking => 
      booking.venue_id === venueId && 
      booking.date === date &&
      booking.status === 'approved'
    );
  };

  const getBookingStats = () => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;
    const declined = bookings.filter(b => b.status === 'declined').length;
    return { total, pending, approved, declined };
  };

  const value = {
    bookings,
    venues,
    isLoading,
    createBooking,
    updateBookingStatus,
    getUserBookings,
    getPendingBookings,
    getVenueBookings,
    getBookingStats,
    fetchBookings,
    fetchVenues, // <-- Add this line
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};