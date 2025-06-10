import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingModal from '@/components/modals/BookingModal'; // Re-use the existing modal
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { MapPin, Calendar, Clock, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const BookVenuePage = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { venues, isLoading: venuesLoading } = useBooking();

  return (
    <DashboardLayout title="Book a Venue">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <h1 className="text-2xl font-semibold text-foreground">Available Venues</h1>
          <Button onClick={() => setShowBookingModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </motion.div>

        {venuesLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner-large border-primary"></div>
          </div>
        )}

        {!venuesLoading && venues.length === 0 && (
          <Card className="bg-card text-card-foreground border-border">
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Venues Available</h3>
              <p className="text-muted-foreground mt-2">
                There are currently no venues available for booking. Please check back later or contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}

        {!venuesLoading && venues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-card text-card-foreground border-border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-48 w-full overflow-hidden">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={`Image of ${venue.name}`}
                     src="https://images.unsplash.com/photo-1688046671828-c26b7fd54596" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl">{venue.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      {venue.location} - {venue.building}
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Users className="w-4 h-4 mr-2 text-primary" />
                      Capacity: {venue.capacity}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      <p className="font-medium text-foreground mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {venue.amenities?.slice(0, 3).map(amenity => (
                          <span key={amenity} className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">{amenity}</span>
                        ))}
                        {venue.amenities?.length > 3 && (
                           <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">+{venue.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowBookingModal(true)} 
                      className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </DashboardLayout>
  );
};

export default BookVenuePage;