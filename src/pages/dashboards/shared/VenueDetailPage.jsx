import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Wrench, ChevronLeft, ChevronRight,
  Monitor, Wifi, Wind, Zap, Image, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/modals/BookingModal';
import API from '@/lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const VenueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch venue details
  useEffect(() => {
    setLoading(true);
    API.get(`/venues/${id}`)
      .then((res) => setVenue(res.data))
      .catch(() => navigate('/dashboard/venues'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch availability for selected month
  useEffect(() => {
    const monthStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}`;
    API.get(`/venues/${id}/availability?month=${monthStr}`)
      .then((res) => setAvailability(res.data))
      .catch(() => setAvailability(null));
  }, [id, calendarMonth]);

  const navigateMonth = (direction) => {
    setCalendarMonth((prev) => {
      let m = prev.month + direction;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
    setSelectedDate(null);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Padding days
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = availability?.days?.[dateStr] || {};
      days.push({
        day: d,
        dateStr,
        bookingCount: dayData.bookingCount || 0,
        isMaintenance: dayData.isMaintenance || false,
        maintenanceReason: dayData.maintenanceReason,
        bookings: dayData.bookings || [],
        isPast: new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]),
      });
    }
    return days;
  }, [calendarMonth, availability]);

  const selectedDayData = selectedDate
    ? calendarDays.find((d) => d?.dateStr === selectedDate)
    : null;

  const getEquipmentIcon = (item) => {
    const lower = item.toLowerCase();
    if (lower.includes('projector') || lower.includes('screen') || lower.includes('monitor')) return Monitor;
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('ac') || lower.includes('air')) return Wind;
    return Zap;
  };

  const getDayCellClasses = (day) => {
    if (!day) return '';
    let base = 'relative p-2 h-16 rounded-lg border cursor-pointer transition-all text-sm ';
    if (day.dateStr === selectedDate) base += 'border-ucc-crimson ring-2 ring-ucc-crimson/20 bg-red-50 ';
    else if (day.isMaintenance) base += 'border-amber-200 bg-amber-50 cursor-not-allowed ';
    else if (day.isPast) base += 'border-gray-100 bg-gray-50 text-gray-400 cursor-default ';
    else if (day.bookingCount >= 5) base += 'border-red-200 bg-red-50/50 ';
    else if (day.bookingCount > 0) base += 'border-blue-200 bg-blue-50/30 hover:border-blue-400 ';
    else base += 'border-gray-200 hover:border-ucc-navy/30 hover:bg-gray-50 ';
    return base;
  };

  if (loading) {
    return (
      <DashboardLayout title="Venue Details">
        <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>
      </DashboardLayout>
    );
  }

  if (!venue) return null;

  const allEquipment = [...(venue.equipment || []), ...(venue.amenities || [])];

  return (
    <DashboardLayout title={venue.name} breadcrumbs={[{ label: 'Find Venues', path: '/dashboard/venues' }, { label: venue.name }]}>
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-500 hover:text-ucc-navy mb-4 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Venue Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Venue Card */}
          <div className="card-institutional overflow-hidden">
            {venue.image ? (
              <img
                src={venue.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${venue.image}` : venue.image}
                alt={venue.name} className="w-full h-48 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <Image className="w-12 h-12 text-gray-300" />
              </div>
            )}
            <div className="p-5">
              <h2 className="font-heading font-bold text-ucc-navy text-xl mb-1">{venue.name}</h2>
              <p className="text-gray-500 text-sm mb-3">{venue.building?.name || ''} {venue.location ? `• ${venue.location}` : ''}</p>

              <div className="flex gap-2 flex-wrap mb-4">
                <span className="badge badge-info">{venue.type}</span>
                {!venue.isAvailable && <span className="badge badge-declined">Unavailable</span>}
                {venue.isUnderMaintenance && <span className="badge badge-maintenance">🔧 Maintenance</span>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <Users className="w-4 h-4 text-ucc-navy mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Lecture Capacity</p>
                  <p className="font-bold text-ucc-navy">{venue.capacity}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <Users className="w-4 h-4 text-ucc-crimson mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Exam Capacity</p>
                  <p className="font-bold text-ucc-navy">{venue.capacityExam || Math.floor(venue.capacity / 2)}</p>
                </div>
              </div>

              {venue.floor && (
                <p className="text-sm text-gray-500 mb-2"><strong>Floor:</strong> {venue.floor}</p>
              )}

              <Button
                onClick={() => setShowBookingModal(true)}
                disabled={!venue.isAvailable || venue.isUnderMaintenance}
                className="w-full bg-ucc-crimson hover:bg-ucc-crimson-600 text-white font-semibold mt-2"
              >
                Book This Venue
              </Button>
            </div>
          </div>

          {/* Equipment */}
          {allEquipment.length > 0 && (
            <div className="card-institutional p-5">
              <h3 className="font-heading font-bold text-ucc-navy mb-3 text-sm">Equipment & Amenities</h3>
              <div className="space-y-2">
                {allEquipment.map((item, i) => {
                  const Icon = getEquipmentIcon(item);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <Icon className="w-4 h-4 text-ucc-navy" />
                      <span className="text-sm">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Maintenance Periods */}
          {availability?.maintenancePeriods?.length > 0 && (
            <div className="card-institutional p-5 border-l-4 border-l-amber-400">
              <h3 className="font-heading font-bold text-ucc-navy mb-3 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" /> Scheduled Maintenance
              </h3>
              <div className="space-y-2">
                {availability.maintenancePeriods.map((p) => (
                  <div key={p._id} className="p-3 rounded-lg bg-amber-50">
                    <p className="text-sm font-medium text-amber-800">{p.reason || 'Scheduled maintenance'}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      {new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calendar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-institutional p-5">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-ucc-navy text-lg">
                Availability Calendar
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-ucc-navy min-w-[140px] text-center">
                  {MONTHS[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap mb-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-gray-200" /> Available</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> Has Bookings</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Busy (5+)</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-50 border border-amber-200" /> Maintenance</div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={day ? getDayCellClasses(day) : 'h-16'}
                  onClick={() => day && !day.isPast && !day.isMaintenance && setSelectedDate(day.dateStr)}
                >
                  {day && (
                    <>
                      <span className="font-medium">{day.day}</span>
                      {day.bookingCount > 0 && (
                        <div className="absolute bottom-1 right-1">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {day.bookingCount}
                          </span>
                        </div>
                      )}
                      {day.isMaintenance && (
                        <div className="absolute bottom-1 right-1">
                          <Wrench className="w-3 h-3 text-amber-500" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDayData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-institutional p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-ucc-navy">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <Button
                  size="sm"
                  onClick={() => setShowBookingModal(true)}
                  className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white"
                  disabled={selectedDayData.isMaintenance}
                >
                  Book This Date
                </Button>
              </div>

              {selectedDayData.bookings.length === 0 ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">Fully Available</p>
                  <p className="text-xs text-green-600">No bookings on this date</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-2">
                    {selectedDayData.bookings.length} booking{selectedDayData.bookings.length > 1 ? 's' : ''} on this date:
                  </p>
                  {selectedDayData.bookings.map((b) => (
                    <div key={b._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {b.timeStart} – {b.timeEnd}
                          </span>
                          <span className={b.status === 'approved' ? 'badge badge-approved' : 'badge badge-pending'}>
                            {b.status}
                          </span>
                          {b.isExternal && <span className="badge badge-external">External</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{b.purpose} — {b.user?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        initialVenueId={venue._id}
        initialBuildingId={venue.building?._id || venue.building}
      />
    </DashboardLayout>
  );
};

export default VenueDetailPage;
