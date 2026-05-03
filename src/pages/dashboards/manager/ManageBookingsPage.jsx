import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, XCircle, Search, Filter, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';
import API from '@/lib/api';

const ManageBookingsPage = () => {
  const { user } = useAuth();
  const { bookings, fetchBookings } = useBooking();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = bookings.filter((b) => {
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const venueName = (b.venue?.name || '').toLowerCase();
    const userName = (b.user?.name || '').toLowerCase();
    const matchesSearch = !searchTerm || venueName.includes(searchTerm.toLowerCase()) || userName.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    declined: bookings.filter((b) => b.status === 'declined').length,
  };

  const getStatusBadge = (status) => {
    const map = { approved: 'badge badge-approved', pending: 'badge badge-pending', declined: 'badge badge-declined' };
    return map[status] || 'badge badge-info';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
  const formatTime = (t) => {
    try { return new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return t || '—'; }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    try {
      await API.put(`/bookings/${selectedBooking._id}/approve`);
      fetchBookings();
      setShowModal(false);
      setSelectedBooking(null);
    } catch {}
  };

  const handleDecline = async (reason) => {
    if (!selectedBooking) return;
    try {
      await API.put(`/bookings/${selectedBooking._id}/decline`, { reason });
      fetchBookings();
      setShowModal(false);
      setSelectedBooking(null);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex gap-2 mb-4">
        {['', 'pending', 'approved', 'declined'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status ? 'bg-ucc-navy text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status ? `${status.charAt(0).toUpperCase() + status.slice(1)} (${counts[status] || 0})` : `All (${bookings.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card-institutional p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search by venue or requester..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-institutional pl-10" />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card-institutional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b._id}>
                    <td className="font-medium">{b.user?.name || 'Unknown'}</td>
                    <td>{b.venue?.name || 'N/A'}</td>
                    <td>{formatDate(b.date)}</td>
                    <td className="whitespace-nowrap">{formatTime(b.timeStart)} – {formatTime(b.timeEnd)}</td>
                    <td className="max-w-[150px] truncate">{b.purpose}</td>
                    <td>{b.isExternal ? <span className="badge badge-external">External</span> : <span className="text-xs text-gray-400">Internal</span>}</td>
                    <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedBooking(b); setShowModal(true); }}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filtered.length} bookings
        </div>
      </div>

      <BookingApprovalModal
        isOpen={showModal}
        booking={selectedBooking}
        onClose={() => { setShowModal(false); setSelectedBooking(null); }}
        onApprove={handleApprove}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default ManageBookingsPage;