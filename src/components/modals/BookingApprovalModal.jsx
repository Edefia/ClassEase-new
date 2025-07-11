
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';

const BookingApprovalModal = ({ isOpen, onClose, booking }) => {
  const { updateBookingStatus, isLoading, venues, bookings, fetchBookings } = useBooking();
  const { user } = useAuth();
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  if (!booking) return null;

  const API_BASE_URL = 'https://classease-new.onrender.com';
  const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';

  // Robust venue lookup
  const venue = venues.find(v =>
    v._id === (booking.venue?._id || booking.venueId || booking.venue || booking.venue_id || v.id)
    || v.id === (booking.venue?._id || booking.venueId || booking.venue || booking.venue_id)
  );

  // Robust image path
  const imageSrc = venue && venue.image ? (venue.image.startsWith('/uploads') ? `${API_BASE_URL}${venue.image}` : venue.image) : PLACEHOLDER_IMAGE;

  // Count bookings for this venue
  const venueBookingsCount = bookings.filter(b => (b.venue?._id || b.venue) === (venue?._id || venue?.id)).length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleApprove = async () => {
    const result = await updateBookingStatus(booking._id || booking.id, 'approved', user.name);
    if (result.success) {
      await fetchBookings();
      onClose();
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      return;
    }
    
    const result = await updateBookingStatus(booking._id || booking.id, 'declined', user.name, declineReason);
    if (result.success) {
      await fetchBookings();
      setDeclineReason('');
      setShowDeclineForm(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dashboard-card border-0 max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            Review Booking Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-start space-x-4">
              {venue && (
                <img  
                  className="w-24 h-24 object-cover rounded-lg"
                  alt={`${venue.name} venue`}
                 src={imageSrc} />
              )}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-xl mb-2">
                  {booking.venueName || venue?.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-white/70">
                    <Users className="w-5 h-5 mr-3" />
                    <span>Requested by: <strong className="text-white">{booking.userName || booking.user?.name || booking.user?.email || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <span className="mr-2">Purpose:</span>
                    <span className="text-white/80">{booking.purpose || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>{formatTime(booking.startTime || booking.timeStart)} - {formatTime(booking.endTime || booking.timeEnd)}</span>
                  </div>
                  {venue && (
                    <div className="flex items-center text-white/70">
                      <MapPin className="w-5 h-5 mr-3" />
                      <span>{venue.location} • Capacity: {venue.capacity}</span>
                    </div>
                  )}
                  <div className="flex items-center text-white/70">
                    <span className="mr-2">Total bookings for this venue:</span>
                    <span className="text-white font-bold">{venueBookingsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white font-semibold mb-2">Purpose of Booking</h4>
            <p className="text-white/80">{booking.purpose}</p>
          </div>

          {/* Venue Amenities */}
          {venue && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="text-white font-semibold mb-3">Available Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Decline Reason Form */}
          {showDeclineForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <h4 className="text-white font-semibold mb-3">Reason for Declining</h4>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="form-input w-full min-h-[100px] resize-none"
                placeholder="Please provide a reason for declining this booking request..."
              />
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            {!showDeclineForm ? (
              <>
                <Button
                  onClick={() => setShowDeclineForm(true)}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Approving...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReason('');
                  }}
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDecline}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  disabled={isLoading || !declineReason.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Declining...
                    </div>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirm Decline
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
      <style jsx global>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #6366f1 0%, #a21caf 100%);
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
`}</style>
    </Dialog>
  );
};

export default BookingApprovalModal;
