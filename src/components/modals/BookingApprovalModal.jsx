import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BookingApprovalModal = ({ isOpen, booking, onClose, onApprove, onDecline }) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState(null); // 'approve' or 'decline'

  if (!isOpen || !booking) return null;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const formatTime = (t) => {
    try { return new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
    catch { return t || '—'; }
  };

  const handleApprove = () => {
    onApprove();
    setAction(null);
    setReason('');
  };

  const handleDecline = () => {
    onDecline(reason);
    setAction(null);
    setReason('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-institutional p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-ucc-navy text-lg">Review Booking</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-ucc-navy">{booking.user?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{booking.user?.email || ''} • {booking.user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-ucc-navy">{booking.venue?.name || 'Unknown Venue'}</p>
                <p className="text-xs text-gray-500">{booking.venue?.type} • Cap: {booking.venue?.capacity}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{formatTime(booking.timeStart)} – {formatTime(booking.timeEnd)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Purpose</p>
              <p className="text-sm text-ucc-navy">{booking.purpose}</p>
            </div>

            {booking.isExternal && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <span className="badge badge-external mb-1">External Booking</span>
                <p className="text-sm text-gray-700">{booking.externalOrgName}</p>
                <p className="text-xs text-gray-500">{booking.externalContactEmail}</p>
              </div>
            )}

            {booking.status !== 'pending' && (
              <div className={`p-3 rounded-lg ${booking.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={booking.status === 'approved' ? 'badge badge-approved' : 'badge badge-declined'}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                </span>
                {booking.reasonIfDeclined && <p className="text-sm text-red-700 mt-2">{booking.reasonIfDeclined}</p>}
              </div>
            )}
          </div>

          {/* Actions (only for pending) */}
          {booking.status === 'pending' && (
            <div className="space-y-3">
              {action === 'decline' ? (
                <div>
                  <label className="form-label">Reason for Declining</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="form-input-institutional"
                    rows={3}
                    placeholder="Provide a reason..."
                  />
                  <div className="flex gap-3 mt-3">
                    <Button variant="outline" onClick={() => setAction(null)} className="flex-1">Back</Button>
                    <Button onClick={handleDecline} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      <XCircle className="w-4 h-4 mr-1" /> Confirm Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => setAction('decline')} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-1" /> Decline
                  </Button>
                  <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </div>
              )}
            </div>
          )}

          {booking.status !== 'pending' && (
            <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingApprovalModal;
