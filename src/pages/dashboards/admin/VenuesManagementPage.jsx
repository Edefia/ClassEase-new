import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, MapPin, Wrench, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaintenanceManager from '@/components/venue/MaintenanceManager';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const VenuesManagementPage = () => {
  const [venues, setVenues] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'Lecture Hall', capacity: '', capacityExam: '', building: '', location: '', floor: '', amenities: '',
  });
  const [maintenanceVenue, setMaintenanceVenue] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([API.get('/venues'), API.get('/buildings')]);
      setVenues(vRes.data);
      setBuildings(bRes.data);
    } catch { setVenues([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = venues.filter((v) => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      capacityExam: formData.capacityExam ? Number(formData.capacityExam) : null,
      amenities: formData.amenities ? formData.amenities.split(',').map((a) => a.trim()) : [],
      equipment: formData.amenities ? formData.amenities.split(',').map((a) => a.trim()) : [],
    };
    try {
      if (editingItem) {
        await API.put(`/venues/${editingItem._id}`, payload);
        toast({ title: 'Venue Updated' });
      } else {
        await API.post('/venues', payload);
        toast({ title: 'Venue Created' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Venue',
      message: 'Are you sure you want to delete this venue? It will be removed from all scheduled timetable entries.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await API.delete(`/venues/${id}`);
      toast({ title: 'Venue Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const toggleAvailability = async (venue) => {
    try {
      await API.put(`/venues/${venue._id}`, { isAvailable: !venue.isAvailable });
      toast({ title: venue.isAvailable ? 'Venue Disabled' : 'Venue Enabled' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', type: 'Lecture Hall', capacity: '', capacityExam: '', building: '', location: '', floor: '', amenities: '' });
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingItem(v);
    setFormData({
      name: v.name, type: v.type, capacity: v.capacity, capacityExam: v.capacityExam || '',
      building: v.building?._id || v.building || '', location: v.location || '', floor: v.floor || '',
      amenities: [...(v.equipment || []), ...(v.amenities || [])].join(', '),
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const venueTypes = ['Lecture Hall', 'Lab', 'Auditorium', 'Seminar Room', 'Outdoor Space', 'Other'];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-institutional p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search venues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-institutional pl-10" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input-institutional w-auto">
              <option value="">All Types</option>
              {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Button onClick={openCreate} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Venue
          </Button>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <motion.div key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-institutional overflow-hidden">
            {v.image ? (
              <img
                src={v.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${v.image}` : v.image}
                alt={v.name} className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-heading font-bold text-ucc-navy">{v.name}</h4>
                  <p className="text-xs text-gray-500">{v.building?.name || 'Unknown building'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="badge badge-info">{v.type}</span>
                <span className="badge badge-info">Cap: {v.capacity}</span>
                {v.capacityExam && <span className="badge badge-info">Exam: {v.capacityExam}</span>}
                {!v.isAvailable && <span className="badge badge-declined">Disabled</span>}
                {v.isUnderMaintenance && <span className="badge badge-maintenance">🔧 Maintenance</span>}
              </div>
              {(v.equipment?.length > 0 || v.amenities?.length > 0) && (
                <div className="flex gap-1 flex-wrap">
                  {[...(v.equipment || []), ...(v.amenities || [])].slice(0, 3).map((a, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailability(v)}
                  className={`text-xs font-medium ${v.isAvailable ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                >
                  {v.isAvailable ? 'Disable Venue' : 'Enable Venue'}
                </button>
                <button
                  onClick={() => setMaintenanceVenue(v)}
                  className="text-xs font-medium text-gray-500 hover:text-ucc-navy flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" /> Maintenance
                </button>
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
            <p className="empty-state-description">{searchTerm || typeFilter ? 'Try different filters.' : 'Add your first venue.'}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">{editingItem ? 'Edit Venue' : 'Add Venue'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Venue Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" required />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="form-input-institutional">
                    {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Building</label>
                  <select value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} className="form-input-institutional" required>
                    <option value="">Select Building</option>
                    {buildings.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Capacity (Lecture)</label>
                  <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="form-input-institutional" required />
                </div>
                <div>
                  <label className="form-label">Capacity (Exam)</label>
                  <input type="number" value={formData.capacityExam} onChange={(e) => setFormData({ ...formData, capacityExam: e.target.value })} className="form-input-institutional" placeholder="Auto: 50% of lecture" />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="form-input-institutional" placeholder="e.g., North Campus" />
                </div>
                <div>
                  <label className="form-label">Floor</label>
                  <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="form-input-institutional" placeholder="e.g., Ground Floor" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Equipment (comma-separated)</label>
                  <input type="text" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} className="form-input-institutional" placeholder="Projector, AC, Whiteboard, WiFi" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Maintenance Modal */}
      {maintenanceVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMaintenanceVenue(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-ucc-navy text-lg">Maintenance — {maintenanceVenue.name}</h3>
              <button onClick={() => setMaintenanceVenue(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <MaintenanceManager
              venue={maintenanceVenue}
              onUpdate={() => { fetchData(); API.get(`/venues/${maintenanceVenue._id}`).then((res) => setMaintenanceVenue(res.data)).catch(() => {}); }}
            />
          </motion.div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default VenuesManagementPage;