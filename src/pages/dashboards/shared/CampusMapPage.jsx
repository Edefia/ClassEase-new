import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBooking } from '@/contexts/BookingContext';
import { MapPin, Info, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/modals/BookingModal';

// Placeholder for a map component. In a real app, use Leaflet, Mapbox GL JS, or Google Maps React.
const MapPlaceholder = ({ venues, onMarkerClick }) => (
  <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center border border-border shadow-inner">
    <div className="text-center text-muted-foreground">
      <MapPin className="w-16 h-16 mx-auto mb-4" />
      <p className="text-lg font-medium">Interactive Map Area</p>
      <p className="text-sm">Venue markers would appear here.</p>
      {venues && venues.length > 0 && (
        <div className="mt-4 space-x-2">
          <p className="text-xs mb-2">Simulated Markers (click to see info):</p>
          {venues.slice(0,3).map(venue => (
            <button 
              key={venue.id} 
              onClick={() => onMarkerClick(venue)}
              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20"
            >
              {venue.name}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

const CampusMapPage = () => {
  const { venues, isLoading: venuesLoading } = useBooking();
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleMarkerClick = (venue) => {
    setSelectedVenue(venue);
  };

  const handleBookFromMap = () => {
    if (selectedVenue) {
      setShowBookingModal(true);
    }
  };

  return (
    <DashboardLayout title="Campus Map">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Map Area */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-2/3 w-full"
        >
          {venuesLoading ? (
            <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center border-border">
              <div className="loading-spinner-large border-primary"></div>
            </div>
          ) : (
            <MapPlaceholder venues={venues} onMarkerClick={handleMarkerClick} />
          )}
        </motion.div>

        {/* Venue Info Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/3 w-full bg-card p-6 rounded-xl shadow-lg border border-border"
        >
          {selectedVenue ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{selectedVenue.name}</h2>
              <div className="h-40 w-full rounded-lg overflow-hidden">
                 <img 
                    className="w-full h-full object-cover"
                    alt={`Image of ${selectedVenue.name}`}
                   src="https://images.unsplash.com/photo-1688046671828-c26b7fd54596" />
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                {selectedVenue.location} - {selectedVenue.building}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Capacity: {selectedVenue.capacity}
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Amenities:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVenue.amenities?.map(amenity => (
                    <span key={amenity} className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">{amenity}</span>
                  ))}
                </div>
              </div>
              <Button onClick={handleBookFromMap} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Calendar className="w-4 h-4 mr-2" />
                Book This Venue
              </Button>
              {/* Placeholder for directions */}
              <Button variant="outline" className="w-full">Get Directions</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Info className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Select a venue on the map</p>
              <p>Click a marker to view venue details and booking options.</p>
            </div>
          )}
        </motion.div>
      </div>
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        // initialData={selectedVenue ? { venueId: selectedVenue.id } : {}} // Pre-select venue
      />
    </DashboardLayout>
  );
};

export default CampusMapPage;