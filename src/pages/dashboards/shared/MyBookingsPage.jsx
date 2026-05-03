import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Search, Filter, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const { getUserBookings } = useBooking();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const userBookings = getUserBookings(user?.id);

  const filtered = userBookings.filter((b) => {
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const venueName = (b.venue?.name || b.venueName || '').toLowerCase();
    const matchesSearch = !searchTerm || venueName.includes(searchTerm.toLowerCase()) || b.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: userBookings.length,
    approved: userBookings.filter((b) => b.status === 'approved').length,
    pending: userBookings.filter((b) => b.status === 'pending').length,
    declined: userBookings.filter((b) => b.status === 'declined').length,
  };

  const getStatusBadge = (status) => {
    const map = { approved: 'badge badge-approved', pending: 'badge badge-pending', declined: 'badge badge-declined' };
    return map[status] || 'badge badge-info';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const formatTime = (t) => {
    try { return new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return t || '—'; }
  };

  return (
    <DashboardLayout title="My Bookings" breadcrumbs={[{ label: 'My Bookings' }]}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-card-label">Total</p>
          <p className="stat-card-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="stat-card-label">Approved</p>
          </div>
          <p className="stat-card-value text-green-600">{stats.approved}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="stat-card-label">Pending</p>
          </div>
          <p className="stat-card-value text-amber-600">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="stat-card-label">Declined</p>
          </div>
          <p className="stat-card-value text-red-600">{stats.declined}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-institutional p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by venue or purpose..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-institutional pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input-institutional w-auto">
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card-institutional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b._id || b.id}>
                    <td className="font-medium">{b.venue?.name || b.venueName || 'Unknown'}</td>
                    <td>{formatDate(b.date)}</td>
                    <td>{formatTime(b.timeStart || b.start_time)} – {formatTime(b.timeEnd || b.end_time)}</td>
                    <td className="max-w-[200px] truncate">{b.purpose || '—'}</td>
                    <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                    <td>{b.reviewedBy?.name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filtered.length} of {userBookings.length} bookings
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyBookingsPage;