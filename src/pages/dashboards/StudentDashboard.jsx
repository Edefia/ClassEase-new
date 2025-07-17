
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Info
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingModal from '@/components/modals/BookingModal';
import MyBookingsPage from './shared/MyBookingsPage';
import CampusMapPage from './shared/CampusMapPage';
import API from '@/lib/api';
import FindVenuesPage from './shared/FindVenuesPage';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [venuesData, setVenuesData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [prefillVenue, setPrefillVenue] = useState(null);

  useEffect(() => {
    setLoadingVenues(true);
    API.get('/venues').then(res => setVenuesData(res.data)).finally(() => setLoadingVenues(false));
    setLoadingBookings(true);
    API.get('/bookings').then(res => setBookingsData(res.data)).finally(() => setLoadingBookings(false));
  }, []);

  const userBookings = getUserBookings(user?.id);
  const recentBookings = userBookings.slice(0, 5);

  const stats = [
    {
      title: 'Total Bookings',
      value: userBookings.length,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Approved',
      value: userBookings.filter(b => b.status === 'approved').length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Pending',
      value: userBookings.filter(b => b.status === 'pending').length,
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Available Venues',
      value: venues.length,
      icon: MapPin,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', value: 'dashboard' },
    { icon: BookOpen, label: 'My Bookings', value: 'bookings' },
    { icon: Bell, label: 'Notifications', value: 'notifications' },
    { icon: Settings, label: 'Settings', value: 'settings' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'declined':
        return 'status-declined';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const handleLogout = () => {
    logout();
  };

  // Suggested Venues Section
  const today = new Date();
  const userUpcomingVenueIds = userBookings
    .filter(b => new Date(b.date) >= today)
    .map(b => b.venue_id || b.venue?._id || b.venue?.id || b.venue || b.venueId);
  const suggestedVenues = venues.filter(v => !userUpcomingVenueIds.includes(v._id)).slice(0, 5);

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
                <BookOpen className="w-5 h-5 text-white" />
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

          {/* Tab Navigation in Sidebar */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.value}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === item.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setSelectedTab(item.value)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'findVenues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => setSelectedTab('findVenues')}>
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Find Venues</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
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
                  <BookOpen className="w-5 h-5 text-white" />
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

        {/* Dashboard Content */}
        <div className="flex-1 p-6 flex flex-col">
          {loadingVenues || loadingBookings ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner-large border-primary"></div>
            </div>
          ) : (
            <>
          {selectedTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30"
              >
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Welcome back, {user?.name}!
                    </h2>
                    <p className="text-white/70 text-lg">
                      Ready to book your next venue? Let's get started.
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-6 py-3"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Book Venue
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm font-medium">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">
                              {stat.value}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Suggested Venues Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 mt-6">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-white text-lg flex items-center">Suggested Venues</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white hover:bg-gray-700"
                      onClick={() => setSelectedTab('findVenues')}
                      >
                        View All
                      </Button>
                  </CardHeader>
                  <CardContent>
                    {suggestedVenues.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">No available venues to suggest right now.</div>
                    ) : (
                      <div className="flex flex-row gap-4 overflow-x-auto pb-2 hide-scrollbar">
                        {suggestedVenues.map((venue) => (
                          <div
                            key={venue._id}
                            className="min-w-[260px] max-w-xs bg-gray-700/60 rounded-lg p-4 border border-gray-600 flex-shrink-0 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {venue.image && (
                                <img
                                  src={venue.image.startsWith('/uploads') ? `https://classease-new.onrender.com${venue.image}` : venue.image}
                                  alt={venue.name}
                                  className="w-14 h-14 object-cover rounded-md border border-gray-600 bg-gray-800"
                                />
                              )}
                              <div>
                                <h4 className="text-white font-semibold truncate max-w-[120px]" title={venue.name}>{venue.name}</h4>
                                <div className="text-gray-300 text-xs mb-1">Type: {venue.type || 'N/A'}</div>
                                <div className="text-gray-300 text-xs mb-1">Capacity: {venue.capacity || 'N/A'}</div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                              onClick={() => {
                                setPrefillVenue(venue);
                                setShowBookingModal(true);
                              }}
                            >
                              Book Now
                            </Button>
                              </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              {/* Recent Bookings (below suggested venues, only if any) */}
              {recentBookings.length > 0 && (
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 mt-6">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-white text-lg flex items-center">Recent Bookings</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-white hover:bg-gray-700"
                      onClick={() => setSelectedTab('bookings')}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-row gap-4 overflow-x-auto pb-2 hide-scrollbar">
                      {recentBookings.slice(0, 5).map((booking) => {
                        // Robustly extract venue object and name
                        const venueObj = booking.venue && typeof booking.venue === 'object' ? booking.venue :
                          venuesData.find(v => v._id?.toString() === (booking.venue?._id?.toString() || booking.venue?.toString() || booking.venueId?.toString()));
                        const venueName = venueObj?.name || 'Venue Name Missing';

                        // Robustly extract date and time fields
                        let dateStr = 'Invalid Date';
                        let timeStr = 'Invalid Time';
                        if (booking.date) {
                          try {
                            dateStr = new Date(booking.date).toLocaleDateString('en-US', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            });
                          } catch {}
                        }
                        // Try both timeStart/timeEnd and start_time/end_time
                        const startTime = booking.timeStart || booking.start_time;
                        const endTime = booking.timeEnd || booking.end_time;
                        if (startTime && endTime) {
                          try {
                            const formatTime = (t) => new Date(`1970-01-01T${t}Z`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                            timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;
                          } catch {}
                        }

                        return (
                          <div
                            key={booking._id || booking.id}
                            className="min-w-[260px] max-w-xs bg-gray-700/60 rounded-lg p-4 border border-gray-600 flex-shrink-0 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-semibold truncate max-w-[120px]" title={venueName}>{venueName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            </div>
                            <div className="text-gray-300 text-xs flex items-center mb-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {dateStr}
                            </div>
                            <div className="text-gray-300 text-xs flex items-center mb-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {timeStr}
                            </div>
                            {booking.status === 'declined' && (booking.reasonIfDeclined || booking.reason_if_declined) && (
                              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs">
                                <strong>Reason:</strong> {booking.reasonIfDeclined || booking.reason_if_declined}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
              >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Quick Book</h3>
                    <p className="text-gray-300 text-sm">
                      Book a venue for your next class or event
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Campus Map</h3>
                    <p className="text-gray-300 text-sm">
                      Explore available venues on the interactive map
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 cursor-pointer group hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">My Schedule</h3>
                    <p className="text-gray-300 text-sm">
                      View your upcoming bookings and schedule
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
          {selectedTab === 'bookings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-3xl">
                <div className="flex items-center mb-6">
                  <BookOpen className="w-7 h-7 text-primary mr-3" />
                  <h2 className="text-2xl font-bold text-white">My Bookings</h2>
                </div>
                {/* Booking List or Empty State */}
                {userBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center bg-gray-900/80 rounded-xl p-10 border border-gray-800">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
                    <p className="text-muted-foreground mb-4">You haven't made any bookings yet.</p>
                    <Button onClick={() => setShowBookingModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Book a Venue</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-1">{booking.venueName || 'Venue Name Missing'}</h4>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              {formatDate(booking.date)}
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <Clock className="w-4 h-4 mr-2 text-primary" />
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm mb-1">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              {booking.location || 'Location N/A'}
                            </div>
                            <p className="text-muted-foreground text-xs">Purpose: {booking.purpose}</p>
                          </div>
                          <div className="flex flex-col items-end mt-4 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(booking.status)}`}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                            {booking.status === 'declined' && booking.reasonIfDeclined && (
                              <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs mt-2">
                                <strong>Reason:</strong> {booking.reasonIfDeclined}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {selectedTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-xl bg-gray-900/80 rounded-xl p-10 border border-gray-800 flex flex-col items-center">
                <Bell className="w-14 h-14 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
                <p className="text-muted-foreground mb-2">You have no notifications at this time.</p>
                <p className="text-muted-foreground text-sm">Important updates and alerts will appear here.</p>
              </div>
            </motion.div>
          )}
          {selectedTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-xl bg-gray-900/80 rounded-xl p-10 border border-gray-800 flex flex-col items-center">
                <Settings className="w-14 h-14 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
                <p className="text-muted-foreground mb-2">Settings page coming soon.</p>
                <p className="text-muted-foreground text-sm">Manage your account and preferences here.</p>
              </div>
            </motion.div>
              )}
            {selectedTab === 'findVenues' && (
              <FindVenuesPage />
            )}
            </>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setPrefillVenue(null);
        }}
        initialVenueId={prefillVenue?._id}
        initialBuildingId={prefillVenue?.building?._id || prefillVenue?.building}
      />
      {/* Add this CSS to hide the horizontal scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
