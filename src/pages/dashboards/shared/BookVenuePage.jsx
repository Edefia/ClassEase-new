import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingModal from '@/components/modals/BookingModal'; // Re-use the existing modal
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { MapPin, Calendar, Clock, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Menu, X, User, Bell, LogOut, Settings, MapPin as MapPinIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BookVenuePage = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { venues, isLoading: venuesLoading } = useBooking();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <span className="font-medium">Book Venue</span>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center"
        >
            <h1 className="text-2xl font-semibold text-white">Available Venues</h1>
            <Button onClick={() => setShowBookingModal(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
            New Booking
          </Button>
        </motion.div>

        {venuesLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner-large border-primary"></div>
          </div>
        )}

        {!venuesLoading && venues.length === 0 && (
            <Card className="bg-gray-800/50 text-white border-gray-700">
            <CardContent className="p-6 text-center">
                <MapPinIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold">No Venues Available</h3>
                <p className="text-gray-400 mt-2">
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
                  <Card className="bg-gray-800/50 text-white border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="h-48 w-full overflow-hidden">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={`Image of ${venue.name}`}
                     src="https://images.unsplash.com/photo-1688046671828-c26b7fd54596" />
                  </div>
                  <CardHeader>
                      <CardTitle className="text-white text-xl">{venue.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPinIcon className="w-4 h-4 mr-2 text-blue-400" />
                      {venue.location} - {venue.building}
                    </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Users className="w-4 h-4 mr-2 text-blue-400" />
                      Capacity: {venue.capacity}
                    </div>
                      <div className="text-gray-400 text-sm">
                        <p className="font-medium text-white mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {venue.amenities?.slice(0, 3).map(amenity => (
                            <span key={amenity} className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs">{amenity}</span>
                        ))}
                        {venue.amenities?.length > 3 && (
                             <span className="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-xs">+{venue.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowBookingModal(true)} 
                        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
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
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
};

export default BookVenuePage;