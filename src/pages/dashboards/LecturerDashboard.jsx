import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Plus, CheckCircle, AlertCircle, BookOpen, Users
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [prefillVenue, setPrefillVenue] = useState(null);

  const userBookings = getUserBookings(user?.id);
  const upcomingBookings = userBookings.filter(
    (b) => b.status === 'approved' && new Date(b.date) >= new Date()
  );

  const stats = [
    { title: 'Total Bookings', value: userBookings.length, icon: Calendar, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Upcoming Classes', value: upcomingBookings.length, icon: Clock, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'Pending Approval', value: userBookings.filter((b) => b.status === 'pending').length, icon: AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Available Venues', value: venues.length, icon: MapPin, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  const getStatusBadge = (status) => {
    const map = { approved: 'badge badge-approved', pending: 'badge badge-pending', declined: 'badge badge-declined' };
    return map[status] || 'badge badge-info';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
  const formatTime = (t) => {
    try { return new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return t || '—'; }
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Banner */}
      <div className="card-institutional p-6 mb-6 border-l-4 border-l-ucc-crimson">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ucc-navy mb-1">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your lectures and book venues for your classes.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {user?.department && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {user.department}
                </span>
              )}
              {user?.staffId && <span>Staff ID: {user.staffId}</span>}
            </div>
          </div>
          <Button
            onClick={() => setShowBookingModal(true)}
            className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Book Lecture Hall
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="stat-card">
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

      {/* Upcoming Classes */}
      {upcomingBookings.length > 0 && (
        <div className="card-institutional p-5 mb-6">
          <h3 className="font-heading font-bold text-ucc-navy mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ucc-crimson" />
            Upcoming Classes
          </h3>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <div key={booking._id || booking.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-sm text-ucc-navy">{booking.venue?.name || booking.venueName || 'Unknown'}</h4>
                  <p className="text-xs text-gray-500">{booking.purpose}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(booking.date)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime(booking.timeStart || booking.start_time)} – {formatTime(booking.timeEnd || booking.end_time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings Table */}
      {userBookings.length > 0 ? (
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
                {userBookings.slice(0, 10).map((b) => (
                  <tr key={b._id || b.id}>
                    <td className="font-medium">{b.venue?.name || b.venueName || 'N/A'}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>{formatTime(b.timeStart || b.start_time)} – {formatTime(b.timeEnd || b.end_time)}</td>
                    <td className="max-w-[150px] truncate">{b.purpose || '—'}</td>
                    <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-institutional">
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3 className="empty-state-title">No Bookings Yet</h3>
            <p className="empty-state-description">Book a lecture hall to get started.</p>
            <Button onClick={() => setShowBookingModal(true)} className="mt-4 bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Book Venue
            </Button>
          </div>
        </div>
      )}

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => { setShowBookingModal(false); setPrefillVenue(null); }}
        initialVenueId={prefillVenue?._id}
        initialBuildingId={prefillVenue?.building?._id || prefillVenue?.building}
      />
    </DashboardLayout>
  );
};

export default LecturerDashboard;
