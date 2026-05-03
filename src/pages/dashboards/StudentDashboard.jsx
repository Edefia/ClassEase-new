import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Plus, CheckCircle, AlertCircle, BookOpen
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';
import API from '@/lib/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [prefillVenue, setPrefillVenue] = useState(null);

  const userBookings = getUserBookings(user?.id);
  const recentBookings = userBookings.slice(0, 5);

  const stats = [
    {
      title: 'Total Bookings',
      value: userBookings.length,
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Approved',
      value: userBookings.filter((b) => b.status === 'approved').length,
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Pending',
      value: userBookings.filter((b) => b.status === 'pending').length,
      icon: AlertCircle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Available Venues',
      value: venues.length,
      icon: MapPin,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      approved: 'badge badge-approved',
      pending: 'badge badge-pending',
      declined: 'badge badge-declined',
    };
    return map[status] || 'badge badge-info';
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatTime = (t) => {
    try {
      return new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch {
      return t;
    }
  };

  // Suggested venues (not already booked)
  const today = new Date();
  const upcomingVenueIds = userBookings
    .filter((b) => new Date(b.date) >= today)
    .map((b) => b.venue_id || b.venue?._id || b.venue);
  const suggestedVenues = venues
    .filter((v) => !upcomingVenueIds.includes(v._id))
    .slice(0, 4);

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Banner */}
      <div className="card-institutional p-6 mb-6 border-l-4 border-l-ucc-crimson">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ucc-navy mb-1">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-gray-500 text-sm">
              Ready to book your next venue? Check availability and reserve now.
            </p>
          </div>
          <Button
            onClick={() => setShowBookingModal(true)}
            className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Book Venue
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-card-label">{stat.title}</p>
                <p className="stat-card-value">{stat.value}</p>
              </div>
              <div className={`stat-card-icon ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggested Venues */}
      {suggestedVenues.length > 0 && (
        <div className="card-institutional p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-ucc-navy">Suggested Venues</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedVenues.map((venue) => (
              <div
                key={venue._id}
                className="border border-gray-100 rounded-lg p-4 hover:shadow-card-hover transition-shadow"
              >
                {venue.image && (
                  <img
                    src={
                      venue.image.startsWith('/uploads')
                        ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${venue.image}`
                        : venue.image
                    }
                    alt={venue.name}
                    className="w-full h-24 object-cover rounded-md mb-3"
                  />
                )}
                <h4 className="font-semibold text-sm text-ucc-navy truncate">{venue.name}</h4>
                <p className="text-xs text-gray-500 mb-1">
                  {venue.type} • Capacity: {venue.capacity}
                </p>
                <Button
                  size="sm"
                  className="w-full mt-2 bg-ucc-navy hover:bg-ucc-navy-600 text-white text-xs"
                  onClick={() => {
                    setPrefillVenue(venue);
                    setShowBookingModal(true);
                  }}
                >
                  Book Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="card-institutional p-5">
          <h3 className="font-heading font-bold text-ucc-navy mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const venueName =
                    booking.venue?.name || booking.venueName || 'Unknown Venue';
                  const startTime = booking.timeStart || booking.start_time;
                  const endTime = booking.timeEnd || booking.end_time;

                  return (
                    <tr key={booking._id || booking.id}>
                      <td className="font-medium">{venueName}</td>
                      <td>{booking.date ? formatDate(booking.date) : '—'}</td>
                      <td>
                        {startTime && endTime
                          ? `${formatTime(startTime)} – ${formatTime(endTime)}`
                          : '—'}
                      </td>
                      <td className="max-w-[200px] truncate">{booking.purpose}</td>
                      <td>
                        <span className={getStatusBadge(booking.status)}>
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {userBookings.length === 0 && (
        <div className="card-institutional">
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3 className="empty-state-title">No Bookings Yet</h3>
            <p className="empty-state-description">
              You haven't made any venue bookings. Get started by booking your first venue!
            </p>
            <Button
              onClick={() => setShowBookingModal(true)}
              className="mt-4 bg-ucc-crimson hover:bg-ucc-crimson-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Book a Venue
            </Button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setPrefillVenue(null);
        }}
        initialVenueId={prefillVenue?._id}
        initialBuildingId={prefillVenue?.building?._id || prefillVenue?.building}
      />
    </DashboardLayout>
  );
};

export default StudentDashboard;
