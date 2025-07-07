import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBooking } from '@/contexts/BookingContext';
import { MapPin, Info, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/modals/BookingModal';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, User, Bell, LogOut, Settings, MapPin as MapPinIcon } from 'lucide-react';

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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMarkerClick = (venue) => {
    setSelectedVenue(venue);
  };

  const handleBookFromMap = () => {
    if (selectedVenue) {
      setShowBookingModal(true);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col duration-300 ease-in-out lg:translate-x-0  lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPinIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">ClassEase</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name}</p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                <p className="text-blue-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white">
              <MapPinIcon className="w-5 h-5" />
              <span className="font-medium">Campus Map</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen max-h-screen overflow-y-auto flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            {/* Mobile/Tablet: App Logo/Name on left, Bell & Hamburger on right */}
            <div className="flex items-center w-full lg:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">ClassEase</span>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <Bell className="w-5 h-5 text-white" />
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-white hover:text-gray-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Desktop: Notifications on right */}
            <div className="hidden lg:flex items-center space-x-2 text-white ml-auto">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6 flex flex-col space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Map Area */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-2/3 w-full"
        >
          {venuesLoading ? (
                <div className="w-full h-[500px] bg-gray-800 rounded-lg flex items-center justify-center border-gray-700">
              <div className="loading-spinner-large border-primary"></div>
            </div>
          ) : (
                <MapPlaceholder venues={venues} onMarkerClick={setSelectedVenue} />
          )}
        </motion.div>

        {/* Venue Info Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/3 w-full bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700"
        >
          {selectedVenue ? (
            <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-white">{selectedVenue.name}</h2>
              <div className="h-40 w-full rounded-lg overflow-hidden">
                 <img 
                    className="w-full h-full object-cover"
                    alt={`Image of ${selectedVenue.name}`}
                   src="https://images.unsplash.com/photo-1688046671828-c26b7fd54596" />
              </div>
                  <div className="flex items-center text-gray-400">
                    <MapPinIcon className="w-5 h-5 mr-2 text-blue-400" />
                {selectedVenue.location} - {selectedVenue.building}
              </div>
                  <div className="flex items-center text-gray-400">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                Capacity: {selectedVenue.capacity}
              </div>
              <div>
                    <h4 className="font-medium text-white mb-1">Amenities:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVenue.amenities?.map(amenity => (
                        <span key={amenity} className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs">{amenity}</span>
                  ))}
                </div>
              </div>
                  <Button onClick={() => setShowBookingModal(true)} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                Book This Venue
              </Button>
              {/* Placeholder for directions */}
                  <Button variant="outline" className="w-full text-white border-gray-700">Get Directions</Button>
            </div>
          ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Info className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Select a venue on the map</p>
              <p>Click a marker to view venue details and booking options.</p>
            </div>
          )}
        </motion.div>
          </div>
        </div>
      </div>
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
      />
    </div>
  );
};

export default CampusMapPage;