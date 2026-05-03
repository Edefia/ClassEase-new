import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Building, CheckCircle, AlertCircle, Eye,
  Plus, TrendingUp, MapPin, Users
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';
import BookingModal from '@/components/modals/BookingModal';
import API from '@/lib/api';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { bookings, venues, isLoading: bookingsLoading, fetchBookings, fetchVenues } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [managerBuildings, setManagerBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [error, setError] = useState('');

  // Fetch buildings managed by this user
  useEffect(() => {
    const fetchManagerBuildings = async () => {
      setLoadingBuildings(true);
      try {
        const res = await API.get('/buildings/managed');
        setManagerBuildings(res.data);
      } catch {
        setManagerBuildings([]);
      }
      setLoadingBuildings(false);
    };
    if (user?.role === 'manager') {
      fetchManagerBuildings();
    }
  }, [user]);

  useEffect(() => {
    if (managerBuildings.length > 0) {
      fetchVenues();
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerBuildings]);

  const managerBuildingIds = useMemo(() => managerBuildings.map((b) => b._id), [managerBuildings]);
  const managerVenues = useMemo(
    () =>
      venues.filter((v) => {
        const buildingId = v.building?._id || v.building;
        return managerBuildingIds.some((id) => id.toString() === buildingId?.toString());
      }),
    [venues, managerBuildingIds]
  );
  const managerVenueIds = useMemo(() => managerVenues.map((v) => v._id), [managerVenues]);
  const managerBookings = useMemo(
    () => bookings.filter((b) => managerVenueIds.includes(b.venue?._id || b.venue)),
    [bookings, managerVenueIds]
  );

  const stats = useMemo(() => {
    const total = managerBookings.length;
    const pending = managerBookings.filter((b) => b.status === 'pending').length;
    const approved = managerBookings.filter((b) => b.status === 'approved').length;
    return { total, pending, approved };
  }, [managerBookings]);

  const pendingBookings = useMemo(
    () => managerBookings.filter((b) => b.status === 'pending'),
    [managerBookings]
  );
  const recentBookings = useMemo(() => managerBookings.slice(0, 10), [managerBookings]);

  const dashboardStats = [
    { title: 'Total Bookings', value: stats.total, icon: Calendar, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Pending Approval', value: stats.pending, icon: AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'Managed Venues', value: managerVenues.length, icon: Building, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
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

  const handleRefresh = async () => {
    setError('');
    try { await fetchVenues(); await fetchBookings(); }
    catch { setError('Failed to refresh data.'); }
  };

  if (loadingBuildings || bookingsLoading) {
    return (
      <DashboardLayout title="Manager Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner-large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manager Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dashboardStats.map((stat, index) => (
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

      {/* Pending Approvals */}
      {pendingBookings.length > 0 && (
        <div className="card-institutional p-5 mb-6 border-l-4 border-l-amber-400">
          <h3 className="font-heading font-bold text-ucc-navy mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pending Approvals ({pendingBookings.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.slice(0, 5).map((b) => (
                  <tr key={b._id}>
                    <td className="font-medium">{b.user?.name || b.userName || 'Unknown'}</td>
                    <td>{b.venue?.name || 'Unknown'}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>{formatTime(b.timeStart)} – {formatTime(b.timeEnd)}</td>
                    <td className="max-w-[150px] truncate">{b.purpose}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-ucc-navy border-ucc-navy/20 hover:bg-ucc-navy/5"
                        onClick={() => { setSelectedBooking(b); setShowApprovalModal(true); }}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Managed Venues */}
      <div className="card-institutional p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-ucc-navy">Managed Venues</h3>
          <Button size="sm" variant="outline" onClick={handleRefresh} className="text-xs">Refresh</Button>
        </div>
        {managerVenues.length === 0 ? (
          <div className="empty-state">
            <Building className="empty-state-icon" />
            <h3 className="empty-state-title">No Venues Assigned</h3>
            <p className="empty-state-description">Contact an administrator to be assigned buildings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managerVenues.map((venue) => (
              <div key={venue._id} className="border border-gray-100 rounded-lg p-4 hover:shadow-card-hover transition-shadow">
                {venue.image && (
                  <img
                    src={venue.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${venue.image}` : venue.image}
                    alt={venue.name}
                    className="w-full h-28 object-cover rounded-md mb-3"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <h4 className="font-semibold text-sm text-ucc-navy">{venue.name}</h4>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="badge badge-info">{venue.type || 'N/A'}</span>
                  <span className="badge badge-info">Cap: {venue.capacity}</span>
                  {venue.isUnderMaintenance && <span className="badge badge-maintenance">Maintenance</span>}
                </div>
                <p className="text-xs text-gray-400 mt-2">{venue.building?.name || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="card-institutional p-5">
          <h3 className="font-heading font-bold text-ucc-navy mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.user?.name || b.userName || 'N/A'}</td>
                    <td>{b.venue?.name || 'N/A'}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>{formatTime(b.timeStart)} – {formatTime(b.timeEnd)}</td>
                    <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedBooking(b); setShowApprovalModal(true); }}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Approval Modal */}
      <BookingApprovalModal
        isOpen={showApprovalModal}
        booking={selectedBooking}
        onClose={() => { setShowApprovalModal(false); setSelectedBooking(null); }}
        onApprove={() => {
          if (selectedBooking) {
            API.put(`/bookings/${selectedBooking._id}/approve`).then(() => {
              fetchBookings(); setShowApprovalModal(false); setSelectedBooking(null);
            });
          }
        }}
        onDecline={(reason) => {
          if (selectedBooking) {
            API.put(`/bookings/${selectedBooking._id}/decline`, { reason }).then(() => {
              fetchBookings(); setShowApprovalModal(false); setSelectedBooking(null);
            });
          }
        }}
      />

      <BookingModal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} />
    </DashboardLayout>
  );
};

export default ManagerDashboard;