import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import VenueSuggestionPanel from '@/components/venue/VenueSuggestionPanel';
import API from '@/lib/api';

const BookingModal = ({ isOpen, onClose, initialVenueId, initialBuildingId }) => {
  const { venues, createBooking } = useBooking();
  const [buildings, setBuildings] = useState([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    building: initialBuildingId || '',
    venue: initialVenueId || '',
    date: '',
    timeStart: '',
    timeEnd: '',
    purpose: '',
    isExternal: false,
    externalOrgName: '',
    externalContactEmail: '',
    recurrence: 'none',
    recurrenceEndDate: '',
    recurrenceWeeks: 12,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/buildings').then((res) => setBuildings(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialVenueId) setFormData((prev) => ({ ...prev, venue: initialVenueId }));
    if (initialBuildingId) setFormData((prev) => ({ ...prev, building: initialBuildingId }));
  }, [initialVenueId, initialBuildingId]);

  const filteredVenues = formData.building
    ? venues.filter((v) => (v.building?._id || v.building) === formData.building)
    : venues;

  const selectedVenue = venues.find((v) => v._id === formData.venue);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (formData.recurrence !== 'none' && formData.date) {
        // Generate recurring bookings
        const startDate = new Date(formData.date);
        const intervalDays = formData.recurrence === 'weekly' ? 7 : 14;
        const maxWeeks = formData.recurrenceWeeks || 12;
        const endDate = formData.recurrenceEndDate
          ? new Date(formData.recurrenceEndDate)
          : new Date(startDate.getTime() + maxWeeks * 7 * 86400000);

        const bookings = [];
        let current = new Date(startDate);
        while (current <= endDate) {
          bookings.push({
            venueId: formData.venue,
            date: current.toISOString().split('T')[0],
            startTime: formData.timeStart,
            endTime: formData.timeEnd,
            purpose: formData.purpose,
            recurrence: formData.recurrence,
          });
          current = new Date(current.getTime() + intervalDays * 86400000);
        }
        const result = await createBooking(bookings);
        if (result?.success) handleClose();
      } else {
        // Single booking
        const bookingData = {
          venueId: formData.venue,
          date: formData.date,
          startTime: formData.timeStart,
          endTime: formData.timeEnd,
          purpose: formData.purpose,
          isExternal: formData.isExternal,
          externalOrgName: formData.externalOrgName,
          externalContactEmail: formData.externalContactEmail,
        };
        const result = await createBooking(bookingData);
        if (result?.success) handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create booking');
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ building: '', venue: '', date: '', timeStart: '', timeEnd: '', purpose: '', isExternal: false, externalOrgName: '', externalContactEmail: '', recurrence: 'none', recurrenceEndDate: '', recurrenceWeeks: 12 });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-institutional p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-ucc-navy text-lg">Book a Venue</h3>
              <p className="text-gray-500 text-sm">Fill in the details to reserve a venue</p>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4 error-shake">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Building */}
            <div>
              <label className="form-label">Building</label>
              <select
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value, venue: '' })}
                className="form-input-institutional"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>

            {/* Venue */}
            <div>
              <label className="form-label">Venue</label>
              <select
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="form-input-institutional"
                required
              >
                <option value="">Select Venue</option>
                {filteredVenues.map((v) => (
                  <option key={v._id} value={v._id} disabled={!v.isAvailable || v.isUnderMaintenance}>
                    {v.name} (Cap: {v.capacity}) {!v.isAvailable ? '— Unavailable' : ''} {v.isUnderMaintenance ? '— Maintenance' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected venue info */}
            {selectedVenue && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm">
                <p className="font-medium text-ucc-navy">{selectedVenue.name}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {selectedVenue.type} • Capacity: {selectedVenue.capacity}
                  {selectedVenue.building?.name ? ` • ${selectedVenue.building.name}` : ''}
                </p>
              </div>
            )}

            {/* Smart Suggestions */}
            {!initialVenueId && (
              <VenueSuggestionPanel
                date={formData.date}
                timeStart={formData.timeStart}
                timeEnd={formData.timeEnd}
                capacity={formData.requiredCapacity}
                onSelectVenue={(v) => {
                  setFormData((prev) => ({
                    ...prev,
                    venue: v._id,
                    building: v.building?._id || v.building || prev.building,
                  }));
                }}
              />
            )}

            {/* Date */}
            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="form-input-institutional"
                required
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Time</label>
                <input type="time" value={formData.timeStart} onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })} className="form-input-institutional" required />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input type="time" value={formData.timeEnd} onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })} className="form-input-institutional" required />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="form-label">Purpose</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="form-input-institutional"
                rows={3}
                placeholder="e.g., CSC 101 Lecture, Department meeting, etc."
                required
              />
            </div>

            {/* External Booking Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                id="isExternal"
                checked={formData.isExternal}
                onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                className="w-4 h-4 accent-ucc-crimson"
              />
              <label htmlFor="isExternal" className="text-sm text-gray-700">This is an external/guest booking</label>
            </div>

            {formData.isExternal && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Organization Name</label>
                  <input type="text" value={formData.externalOrgName} onChange={(e) => setFormData({ ...formData, externalOrgName: e.target.value })} className="form-input-institutional" required />
                </div>
                <div>
                  <label className="form-label">Contact Email</label>
                  <input type="email" value={formData.externalContactEmail} onChange={(e) => setFormData({ ...formData, externalContactEmail: e.target.value })} className="form-input-institutional" required />
                </div>
              </div>
            )}

            {/* Recurrence */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
              <div>
                <label className="form-label">Recurrence</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                  className="form-input-institutional"
                >
                  <option value="none">One-time booking</option>
                  <option value="weekly">Weekly (every week)</option>
                  <option value="biweekly">Biweekly (every 2 weeks)</option>
                </select>
              </div>

              {formData.recurrence !== 'none' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        value={formData.recurrenceEndDate}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                        min={formData.date}
                        className="form-input-institutional"
                      />
                    </div>
                    <div>
                      <label className="form-label">Max Weeks</label>
                      <input
                        type="number"
                        value={formData.recurrenceWeeks}
                        onChange={(e) => setFormData({ ...formData, recurrenceWeeks: Number(e.target.value) })}
                        min={1}
                        max={52}
                        className="form-input-institutional"
                      />
                    </div>
                  </div>
                  {formData.date && (
                    <p className="text-xs text-gray-500">
                      This will create approximately{' '}
                      <strong className="text-ucc-navy">
                        {(() => {
                          const start = new Date(formData.date);
                          const interval = formData.recurrence === 'weekly' ? 7 : 14;
                          const end = formData.recurrenceEndDate
                            ? new Date(formData.recurrenceEndDate)
                            : new Date(start.getTime() + (formData.recurrenceWeeks || 12) * 7 * 86400000);
                          let count = 0;
                          let current = new Date(start);
                          while (current <= end) { count++; current = new Date(current.getTime() + interval * 86400000); }
                          return count;
                        })()}
                      </strong>{' '}
                      bookings ({formData.recurrence}).
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-ucc-crimson hover:bg-ucc-crimson-600 text-white font-semibold">
                {isSubmitting ? <><div className="loading-spinner mr-2" /> Booking...</> : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;