import React, { useState, useMemo } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/modals/BookingModal';

const API_BASE = 'http://localhost:5000';
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';

export default function FindVenuesPage({ onBookNow }) {
  const { venues } = useBooking();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [building, setBuilding] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [amenity, setAmenity] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  // Get unique types, buildings, amenities for filters
  const types = useMemo(() => Array.from(new Set(venues.map(v => v.type).filter(Boolean))), [venues]);
  const buildings = useMemo(() => Array.from(new Set(venues.map(v => v.building?.name || v.building).filter(Boolean))), [venues]);
  const amenities = useMemo(() => Array.from(new Set(venues.flatMap(v => v.amenities || []))), [venues]);

  // Filter venues
  const filteredVenues = useMemo(() => venues.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (type && v.type !== type) return false;
    if (building && (v.building?.name || v.building) !== building) return false;
    if (minCapacity && Number(v.capacity) < Number(minCapacity)) return false;
    if (amenity && !(v.amenities || []).includes(amenity)) return false;
    return true;
  }), [venues, search, type, building, minCapacity, amenity]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Find Venues</h2>
      <div className="flex flex-wrap gap-4 mb-8">
        <Input
          className="w-64"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input w-40" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-input w-40" value={building} onChange={e => setBuilding(e.target.value)}>
          <option value="">All Buildings</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <Input
          className="w-32"
          type="number"
          min={1}
          placeholder="Min Capacity"
          value={minCapacity}
          onChange={e => setMinCapacity(e.target.value)}
        />
        <select className="form-input w-40" value={amenity} onChange={e => setAmenity(e.target.value)}>
          <option value="">All Amenities</option>
          {amenities.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full text-center py-16 text-white/70">No venues found.</div>
        ) : (
          filteredVenues.map(venue => {
            let imageSrc = venue.image;
            if (imageSrc) {
              if (imageSrc.startsWith('/uploads')) {
                imageSrc = `${API_BASE}${imageSrc}`;
              }
            } else {
              imageSrc = PLACEHOLDER_IMAGE;
            }
            return (
              <div key={venue._id || venue.id} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden flex flex-col hover:scale-[1.03] transition-transform cursor-pointer border border-white/10">
                <div className="h-40 w-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt={venue.name}
                    className="object-cover w-full h-full transition-opacity duration-300 hover:opacity-90"
                    onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
                  />
                </div>
                <div className="flex-1 flex flex-col p-5">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{venue.name}</h3>
                  <div className="text-white/80 text-sm mb-2 truncate">{venue.location || 'No location'}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full">{venue.type || 'Type N/A'}</span>
                    <span className="bg-green-600/80 text-white text-xs px-2 py-1 rounded-full">Capacity: {venue.capacity || 'N/A'}</span>
                  </div>
                  {venue.amenities && Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {venue.amenities.slice(0, 4).map((amenity, idx) => (
                        <span key={idx} className="bg-white/20 text-white/90 text-xs px-2 py-0.5 rounded-full">{amenity}</span>
                      ))}
                      {venue.amenities.length > 4 && (
                        <span className="bg-white/20 text-white/70 text-xs px-2 py-0.5 rounded-full">+{venue.amenities.length - 4} more</span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto text-xs text-white/60 pt-2">
                    {venue.building?.name ? `Building: ${venue.building.name}` : ''}
                  </div>
                  <Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700" onClick={() => {
                    if (onBookNow) {
                      onBookNow(venue);
                    } else {
                      setSelectedVenue(venue);
                      setShowBookingModal(true);
                    }
                  }}>Book Now</Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Booking Modal (only if no onBookNow prop) */}
      {!onBookNow && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedVenue(null);
          }}
          initialVenueId={selectedVenue?._id || selectedVenue?.id}
          initialBuildingId={selectedVenue?.building?._id || selectedVenue?.building?.id}
        />
      )}
    </div>
  );
} 