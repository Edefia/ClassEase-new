import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Users, Image, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';

const FindVenuesPage = ({ onBookNow, embedded }) => {
  const { venues } = useBooking();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const filtered = venues.filter((v) => {
    const matchesSearch = !searchTerm || v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || v.type === typeFilter;
    const matchesCapacity = !capacityFilter || v.capacity >= Number(capacityFilter);
    return matchesSearch && matchesType && matchesCapacity;
  });

  const handleBook = (venue) => {
    if (onBookNow) {
      onBookNow(venue);
    } else {
      setSelectedVenue(venue);
      setShowBookingModal(true);
    }
  };

  const venueTypes = [...new Set(venues.map((v) => v.type).filter(Boolean))];

  const content = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-institutional p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search venues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-institutional pl-10" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input-institutional w-auto">
            <option value="">All Types</option>
            {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Min. capacity" value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} className="form-input-institutional w-auto max-w-[140px]" />
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((venue) => (
          <motion.div key={venue._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-institutional overflow-hidden">
            {venue.image ? (
              <img
                src={venue.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${venue.image}` : venue.image}
                alt={venue.name} className="w-full h-36 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                <Image className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-heading font-bold text-ucc-navy mb-1">{venue.name}</h4>
              <p className="text-xs text-gray-500 mb-2">{venue.building?.name || ''} {venue.location ? `• ${venue.location}` : ''}</p>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="badge badge-info">{venue.type}</span>
                <span className="badge badge-info">
                  <Users className="w-3 h-3 mr-1" /> {venue.capacity}
                </span>
                {!venue.isAvailable && <span className="badge badge-declined">Unavailable</span>}
                {venue.isUnderMaintenance && <span className="badge badge-maintenance">🔧 Maintenance</span>}
              </div>
              {(venue.equipment?.length > 0 || venue.amenities?.length > 0) && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {[...(venue.equipment || []), ...(venue.amenities || [])].slice(0, 4).map((a, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/venues/${venue._id}`)}
                  className="flex-1 text-sm"
                >
                  <Eye className="w-3 h-3 mr-1" /> Details
                </Button>
                <Button
                  onClick={() => handleBook(venue)}
                  disabled={!venue.isAvailable || venue.isUnderMaintenance}
                  className="flex-1 bg-ucc-navy hover:bg-ucc-navy-600 text-white text-sm"
                >
                  Book
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-institutional">
          <div className="empty-state">
            <MapPin className="empty-state-icon" />
            <h3 className="empty-state-title">No Venues Found</h3>
            <p className="empty-state-description">Try different search criteria or check back later.</p>
          </div>
        </div>
      )}

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => { setShowBookingModal(false); setSelectedVenue(null); }}
        initialVenueId={selectedVenue?._id}
        initialBuildingId={selectedVenue?.building?._id || selectedVenue?.building}
      />
    </div>
  );

  // If embedded inside another DashboardLayout page, or if onBookNow is passed, skip layout
  if (onBookNow || embedded) return content;
  return <DashboardLayout title="Find Venues" breadcrumbs={[{ label: 'Find Venues' }]}>{content}</DashboardLayout>;
};

export default FindVenuesPage;