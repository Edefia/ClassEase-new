import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// --- Mock Data ---
const mockVenues = [
  { id: 'venue-1', name: 'Conference Hall A', location: 'North Wing', capacity: 150, image_url: '/placeholder.svg', is_active: true },
  { id: 'venue-2', name: 'Lecture Theatre B', location: 'East Wing', capacity: 80, image_url: '/placeholder.svg', is_active: true },
  { id: 'venue-3', name: 'Meeting Room C', location: 'West Wing', capacity: 25, image_url: '/placeholder.svg', is_active: true },
];

const mockBookings = [
  {
    id: 'booking-1',
    user_id: 'mock-user-id',
    venue_id: 'venue-1',
    date: new Date().toISOString().split('T')[0], // Today's date
    start_time: '10:00:00',
    end_time: '12:00:00',
    purpose: 'Annual Department Meeting',
    status: 'approved',
    userName: 'John Doe',
    venueName: 'Conference Hall A',
    venueImage: '/placeholder.svg',
  },
  {
    id: 'booking-2',
    user_id: 'another-user-id',
    venue_id: 'venue-2',
    date: new Date().toISOString().split('T')[0], // Today's date
    start_time: '14:00:00',
    end_time: '15:00:00',
    purpose: 'Guest Lecture on AI',
    status: 'pending',
    userName: 'Jane Smith',
    venueName: 'Lecture Theatre B',
    venueImage: '/placeholder.svg',
  },
];
// --- End Mock Data ---

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
    // Simulate API call
    setTimeout(() => {
      setVenues(mockVenues);
      setIsLoading(false);
    }, 500);
  };

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In a real app, you'd filter bookings based on the user's role here.
      // For this mock, we'll show all bookings to any logged-in user.
      setBookings(mockBookings);
      setIsLoading(false);
    }, 500);
  };
  
  const createBooking = async (bookingData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a booking.", variant: "destructive" });
      return { success: false, error: "User not authenticated" };
    }
    setIsLoading(true);
    
    // TODO: Replace with your actual API call to create a booking
    console.log("Creating booking with:", bookingData);

    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        const venue = venues.find(v => v.id === bookingData.venueId);
        const newBooking = {
          id: `booking-${Date.now()}`,
          user_id: user.id,
          venue_id: bookingData.venueId,
          date: bookingData.date,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          purpose: bookingData.purpose,
          status: 'pending', // New bookings are pending approval
          userName: user.name,
          venueName: venue?.name || 'N/A',
          venueImage: venue?.image_url || '/placeholder.svg',
        };

        setBookings(prev => [...prev, newBooking]);
        setIsLoading(false);
        toast({
          title: "Booking Created",
          description: "Your booking request has been submitted for approval.",
        });
        resolve({ success: true, booking: newBooking });
      }, 500);
    });
  };

  const updateBookingStatus = async (bookingId, status, reason = null) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Action requires authentication.", variant: "destructive" });
      return { success: false, error: "User not authenticated" };
    }
    setIsLoading(true);

    // TODO: Replace with your actual API call to update status
    console.log(`Updating booking ${bookingId} to ${status} with reason: ${reason}`);

    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        let updatedBooking = null;
        setBookings(prev => prev.map(b => {
          if (b.id === bookingId) {
            updatedBooking = { ...b, status, reason_if_declined: reason };
            return updatedBooking;
          }
          return b;
        }));

        setIsLoading(false);
        if (updatedBooking) {
          toast({
            title: "Booking Updated",
            description: `Booking has been ${status}.`,
          });
          resolve({ success: true, booking: updatedBooking });
        } else {
          toast({ title: "Update Failed", description: "Booking not found.", variant: "destructive" });
          resolve({ success: false, error: "Booking not found" });
        }
      }, 500);
    });
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
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};