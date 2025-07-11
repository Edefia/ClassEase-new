
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, TrendingUp, Building, Eye, Menu, X, User, Bell, LogOut, Settings 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';
import API from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- Tab Components ---
function DashboardTab({ stats, dashboardStats, recentBookings, formatDate, formatTime, getStatusColor, handleReviewBooking }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <stat.icon className="w-6 h-6" />
                {stat.title}
              </CardTitle>
              <span className="text-2xl font-bold">{stat.value}</span>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-white/80">{stat.change} this month</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="bg-white/5 rounded-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-white/70">No recent bookings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 px-4 text-left">Venue</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Time</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, idx) => (
                  <tr key={b._id || idx} className="border-b border-white/10">
                    <td className="py-2 px-4">{b.venue?.name || 'N/A'}</td>
                    <td className="py-2 px-4">{formatDate(b.date)}</td>
                    <td className="py-2 px-4">{formatTime(b.timeStart)} - {formatTime(b.timeEnd)}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="py-2 px-4">
                      <Button size="sm" variant="outline" onClick={() => handleReviewBooking(b)}>
                        <Eye className="w-4 h-4 mr-1" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const API_BASE = 'https://classease-new.onrender.com';
const PLACEHOLDER_IMAGE = '/placeholder.svg';

function VenuesTab({ venues, buildings, onVenueUpdated, onVenueAdded, loading }) {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    amenities: '',
    capacity: '',
    image: '',
    building: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Debug: Log venues prop
  console.log('VenuesTab venues:', venues);

  const openVenueModal = (venue) => {
    setSelectedVenue(venue);
    setIsEdit(false);
    setForm({
      name: venue.name || '',
      type: venue.type || '',
      amenities: Array.isArray(venue.amenities) ? venue.amenities.join(', ') : '',
      capacity: venue.capacity || '',
      image: venue.image || '',
      building: venue.building?._id || venue.building || '',
    });
    setImageFile(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditVenueModal = () => {
    setIsEdit(true);
    setForm({
      name: selectedVenue.name || '',
      type: selectedVenue.type || '',
      amenities: Array.isArray(selectedVenue.amenities) ? selectedVenue.amenities.join(', ') : '',
      capacity: selectedVenue.capacity || '',
      image: selectedVenue.image || '',
      building: selectedVenue.building?._id || selectedVenue.building || '',
    });
    setImageFile(null);
    setFormError('');
  };

  const openAddVenueModal = () => {
    setSelectedVenue(null);
    setIsEdit(true);
    setForm({ name: '', type: '', amenities: '', capacity: '', image: '', building: buildings[0]?._id || '' });
    setImageFile(null);
    setFormError('');
    setShowModal(true);
  };

  const resetFormState = () => {
    setForm({ name: '', type: '', amenities: '', capacity: '', image: '', building: buildings[0]?._id || '' });
    setImageFile(null);
    setFormError('');
    setIsEdit(false);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
    setFormError('');
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.capacity || !form.building) {
      setFormError('All fields are required.');
      return;
    }
    
    // Validate capacity is a positive integer
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setFormError('Capacity must be a positive integer.');
      return;
    }
    
    setModalLoading(true);
    let imageUrl = form.image;
    if (imageFile) {
      const data = new FormData();
      data.append('image', imageFile);
      try {
        const res = await API.post('/venues/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.imageUrl;
      } catch (err) {
        setFormError('Image upload failed.');
        setModalLoading(false);
        return;
      }
    }
    const amenitiesArr = form.amenities
      ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
      : [];
    try {
      if (selectedVenue && selectedVenue._id) {
        await API.put(`/venues/${selectedVenue._id}`, {
          name: form.name,
          type: form.type,
          amenities: amenitiesArr,
          capacity: capacity,
          image: imageUrl || PLACEHOLDER_IMAGE,
          building: form.building,
        });
        onVenueUpdated && onVenueUpdated();
      } else {
        await API.post('/venues', {
          name: form.name,
          type: form.type,
          amenities: amenitiesArr,
          capacity: capacity,
          image: imageUrl || PLACEHOLDER_IMAGE,
          building: form.building,
        });
        onVenueAdded && onVenueAdded();
      }
      setShowModal(false);
      // Reset form state
      setForm({ name: '', type: '', amenities: '', capacity: '', image: '', building: buildings[0]?._id || '' });
      setImageFile(null);
      setFormError('');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save venue.');
    }
    setModalLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
        Managed Venues
        <Button 
          onClick={openAddVenueModal} 
          className="bg-blue-600 text-white hover:bg-blue-700" 
          disabled={buildings.length === 0}
        >
          + Add Venue
        </Button>
      </h2>
      {buildings.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> You are not assigned to any buildings. Contact an administrator to be assigned to a building before you can add venues.
          </p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner-large border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* DEBUG: Grid is rendering */}
          <div style={{ background: 'lime', color: 'black', padding: 16, borderRadius: 8, marginBottom: 8, fontWeight: 'bold' }}>
            DEBUG: Grid is rendering
          </div>
          {venues.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21m5.25-4l.75 4m-7.5-4h10.5M4.5 21h15M12 3v12m0 0l-3.75-3.75M12 15l3.75-3.75" /></svg>
              <h3 className="text-2xl font-semibold text-white mb-2">No venues found</h3>
              <p className="text-white/70">You have not added any venues yet. Click "+ Add Venue" to get started.</p>
            </div>
          ) : (
            venues.map((venue) => {
              const imageSrc = venue.image
                ? (venue.image.startsWith('/uploads') ? `${API_BASE}${venue.image}` : venue.image)
                : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
              return (
                <div
                  key={venue._id || venue.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden flex flex-col hover:scale-[1.03] transition-transform cursor-pointer border border-white/10"
                  onClick={() => openVenueModal(venue)}
                >
                  <div className="h-40 w-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt={venue.name}
                      className="object-cover w-full h-full transition-opacity duration-300 hover:opacity-90"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'; }}
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Venue Details/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) {
          resetFormState();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? (selectedVenue ? 'Edit Venue' : 'Add Venue') : 'Venue Details'}</DialogTitle>
          </DialogHeader>
          {isEdit ? (
            buildings.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Buildings Available</h3>
                <p className="text-gray-600 mb-4">
                  You are not assigned to any buildings. Please contact an administrator to be assigned to a building.
                </p>
                <Button onClick={() => setShowModal(false)}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleSaveVenue} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input name="name" value={form.name} onChange={handleFormChange} required />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input name="type" value={form.type} onChange={handleFormChange} required placeholder="e.g. Lecture Hall, Lab" />
                </div>
                <div>
                  <Label>Building</Label>
                  <select
                    name="building"
                    value={form.building}
                    onChange={handleFormChange}
                    className="form-input mt-2"
                    required
                  >
                    <option value="">Select a building</option>
                    {buildings.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Amenities</Label>
                  <Input name="amenities" value={form.amenities} onChange={handleFormChange} placeholder="e.g. Projector, Whiteboard" />
                  <span className="text-xs text-muted-foreground">Comma-separated (e.g. Projector, Whiteboard)</span>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input name="capacity" type="number" min={1} value={form.capacity} onChange={handleFormChange} required />
                </div>
                <div>
                  <Label>Image</Label>
                  <Input name="image" type="file" accept="image/*" onChange={handleImageChange} />
                  {form.image && !imageFile && (
                    <img src={form.image.startsWith('/uploads') ? `${API_BASE}${form.image}` : form.image} alt="Venue" className="mt-2 rounded w-32 h-20 object-cover border" />
                  )}
                  {imageFile && (
                    <span className="block mt-1 text-xs text-muted-foreground">{imageFile.name}</span>
                  )}
                </div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground" disabled={modalLoading}>
                    {modalLoading ? 'Saving...' : (selectedVenue ? 'Update Venue' : 'Add Venue')}
                  </Button>
                </div>
              </form>
            )
          ) : selectedVenue && (
            <div className="space-y-4">
              <img src={selectedVenue.image && selectedVenue.image.startsWith('/uploads') ? `${API_BASE}${selectedVenue.image}` : selectedVenue.image} alt={selectedVenue.name} className="w-full h-40 object-cover rounded mb-4" />
              <div>
                <Label>Name</Label>
                <div className="font-semibold text-lg mb-2">{selectedVenue.name}</div>
              </div>
              <div>
                <Label>Type</Label>
                <div>{selectedVenue.type}</div>
              </div>
              <div>
                <Label>Building</Label>
                <div>{selectedVenue.building?.name || ''}</div>
              </div>
              <div>
                <Label>Amenities</Label>
                <div>{Array.isArray(selectedVenue.amenities) ? selectedVenue.amenities.join(', ') : ''}</div>
              </div>
              <div>
                <Label>Capacity</Label>
                <div>{selectedVenue.capacity}</div>
              </div>
              <Button onClick={openEditVenueModal} className="bg-blue-600 text-white hover:bg-blue-700 mt-4">Edit Venue</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingsTab({ managerBookings, formatDate, formatTime, getStatusColor, handleReviewBooking, onApprove, onDecline, loading }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Bookings for Your Venues</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 px-4 text-left">Requester</th>
              <th className="py-2 px-4 text-left">Purpose</th>
              <th className="py-2 px-4 text-left">Venue</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Time</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-white/70">Loading...</td></tr>
            ) : managerBookings.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-white/70">No bookings found.</td></tr>
            ) : (
              managerBookings.map((b, idx) => (
                <tr key={b._id || idx} className="border-b border-white/10">
                  <td className="py-2 px-4">{b.userName || b.user?.name || b.user?.email || 'N/A'}</td>
                  <td className="py-2 px-4">{b.purpose || 'N/A'}</td>
                  <td className="py-2 px-4">{b.venue?.name || 'N/A'}</td>
                  <td className="py-2 px-4">{formatDate(b.date)}</td>
                  <td className="py-2 px-4">{formatTime(b.timeStart)} - {formatTime(b.timeEnd)}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(b.status)}`}>{b.status}</span>
                  </td>
                  <td className="py-2 px-4 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleReviewBooking(b)}>
                      <Eye className="w-4 h-4 mr-1" /> Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ user }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Profile & Settings</h2>
      <div className="bg-white/5 rounded-lg p-6 max-w-lg">
        <div className="mb-4">
          <span className="block text-white/70 text-sm mb-1">Name</span>
          <span className="block text-white font-semibold">{user?.name}</span>
        </div>
        <div className="mb-4">
          <span className="block text-white/70 text-sm mb-1">Email</span>
          <span className="block text-white font-semibold">{user?.email}</span>
        </div>
        <div className="mb-4">
          <span className="block text-white/70 text-sm mb-1">Role</span>
          <span className="block text-white font-semibold capitalize">{user?.role}</span>
        </div>
        {/* Add more settings/profile actions here */}
      </div>
    </div>
  );
}

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const { bookings, venues, isLoading: bookingsLoading, fetchBookings, fetchVenues } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [managerBuildings, setManagerBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [error, setError] = useState('');
  const [bookingsActionLoading, setBookingsActionLoading] = useState(false);

  // Fetch buildings managed by this user
  useEffect(() => {
    const fetchManagerBuildings = async () => {
      setLoadingBuildings(true);
      try {
        const res = await API.get('/buildings/managed');
        setManagerBuildings(res.data);
      } catch (err) {
        setManagerBuildings([]);
        setError('Failed to fetch managed buildings.');
      }
      setLoadingBuildings(false);
    };
    if (user && user.role === 'manager') {
      fetchManagerBuildings();
    }
  }, [user]);

  // Fetch venues and bookings when managerBuildings change
  useEffect(() => {
    if (managerBuildings.length > 0) {
      fetchVenues();
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerBuildings]); // Only run when managerBuildings changes

  // Get all venue IDs in manager's buildings
  const managerBuildingIds = useMemo(() => managerBuildings.map(b => b._id), [managerBuildings]);
  const managerVenues = useMemo(() =>
    venues.filter(v => {
      const buildingId = v.building?._id || v.building;
      return managerBuildingIds.some(id => id.toString() === buildingId?.toString());
    }),
    [venues, managerBuildingIds]
  );
  const managerVenueIds = useMemo(() => managerVenues.map(v => v._id), [managerVenues]);
  const managerBookings = useMemo(() => bookings.filter(b => managerVenueIds.includes(b.venue?._id || b.venue)), [bookings, managerVenueIds]);

  // Debug: Log managerVenues to diagnose why venues are not showing
  console.log('managerVenues:', managerVenues);

  // Manual refresh
  const handleRefresh = async () => {
    setError('');
    try {
      await fetchVenues();
      await fetchBookings();
    } catch (err) {
      setError('Failed to refresh data.');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = managerBookings.length;
    const pending = managerBookings.filter(b => b.status === 'pending').length;
    const approved = managerBookings.filter(b => b.status === 'approved').length;
    return { total, pending, approved };
  }, [managerBookings]);

  const dashboardStats = [
    {
      title: 'Total Bookings',
      value: stats.total,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      change: '+12%'
    },
    {
      title: 'Pending Approval',
      value: stats.pending,
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-500',
      change: '+5%'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      change: '+8%'
    },
    {
      title: 'Managed Venues',
      value: managerVenues.length,
      icon: Building,
      color: 'from-purple-500 to-pink-500',
      change: '0%'
    }
  ];

  const pendingBookings = useMemo(() => managerBookings.filter(b => b.status === 'pending'), [managerBookings]);
  const recentBookings = useMemo(() => managerBookings.slice(0, 10), [managerBookings]);

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

  const handleReviewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowApprovalModal(true);
  };

  const handleApproveBooking = async (bookingId) => {
    setBookingsActionLoading(true);
    try {
      await API.put(`/bookings/${bookingId}/approve`);
      await fetchBookings();
    } catch (err) {
      setError('Failed to approve booking.');
    }
    setBookingsActionLoading(false);
  };
  const handleDeclineBooking = async (bookingId) => {
    setBookingsActionLoading(true);
    try {
      await API.put(`/bookings/${bookingId}/decline`, { reason: 'Declined by manager' });
      await fetchBookings();
    } catch (err) {
      setError('Failed to decline booking.');
    }
    setBookingsActionLoading(false);
  };

  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
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
                <Building className="w-5 h-5 text-white" />
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
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('dashboard')}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'venues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('venues')}
            >
              <Building className="w-5 h-5" />
              <span className="font-medium">Manage Venues</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'bookings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('bookings')}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Bookings</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('settings')}
            >
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
      <main className="flex-1 p-4 sm:p-6 lg:ml-64 min-h-screen max-h-screen overflow-y-auto flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
          {/* Add a refresh button for mobile/desktop */}
          <Button onClick={handleRefresh} size="sm" variant="outline" className="self-end sm:self-auto">
            Refresh
              </Button>
        </div>
        {selectedTab === 'dashboard' && (
          loadingBuildings || bookingsLoading ? (
            <div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>
          ) : (
            <DashboardTab
              stats={stats}
              dashboardStats={dashboardStats}
              recentBookings={recentBookings}
              formatDate={formatDate}
              formatTime={formatTime}
              getStatusColor={getStatusColor}
              handleReviewBooking={handleReviewBooking}
            />
          )
        )}
        {selectedTab === 'venues' && (
          loadingBuildings || bookingsLoading ? (
            <div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>
          ) : (
            <VenuesTab
              venues={managerVenues}
              buildings={managerBuildings}
              onVenueUpdated={handleRefresh}
              onVenueAdded={handleRefresh}
              loading={false}
            />
          )
        )}
        {selectedTab === 'bookings' && (
          loadingBuildings || bookingsLoading ? (
            <div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>
          ) : (
            <div className="overflow-x-auto w-full max-w-full">
              <BookingsTab
                managerBookings={managerBookings}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                handleReviewBooking={handleReviewBooking}
                onApprove={handleApproveBooking}
                onDecline={handleDeclineBooking}
                loading={bookingsLoading || bookingsActionLoading}
              />
                              </div>
          )
        )}
        {selectedTab === 'settings' && (
          <SettingsTab user={user} />
        )}
      </main>

      {/* Booking Approval Modal */}
      <BookingApprovalModal
        isOpen={showApprovalModal}
        booking={selectedBooking}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedBooking(null);
        }}
        onApprove={() => {
          if (selectedBooking) {
            API.put(`/bookings/${selectedBooking._id}/approve`)
              .then(() => {
                fetchBookings();
                setShowApprovalModal(false);
                setSelectedBooking(null);
              })
              .catch(err => console.error('Error approving booking:', err));
          }
        }}
        onDecline={() => {
          if (selectedBooking) {
            API.put(`/bookings/${selectedBooking._id}/decline`)
              .then(() => {
                fetchBookings();
                setShowApprovalModal(false);
                setSelectedBooking(null);
              })
              .catch(err => console.error('Error declining booking:', err));
          }
        }}
      />
    </div>
  );
};

export default ManagerDashboard;