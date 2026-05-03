import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const BuildingManagementPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', manager: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([API.get('/buildings'), API.get('/users')]);
      setBuildings(bRes.data);
      setUsers(uRes.data.filter((u) => u.role === 'manager' || u.role === 'admin'));
    } catch { setBuildings([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await API.put(`/buildings/${editingItem._id}`, formData);
        toast({ title: 'Building Updated' });
      } else {
        await API.post('/buildings', formData);
        toast({ title: 'Building Created' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this building?')) return;
    try {
      await API.delete(`/buildings/${id}`);
      toast({ title: 'Building Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => { setEditingItem(null); setFormData({ name: '', code: '', description: '', manager: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setFormData({ name: item.name, code: item.code || '', description: item.description || '', manager: item.manager?._id || item.manager || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="card-institutional p-4 flex items-center justify-between">
        <h3 className="font-heading font-bold text-ucc-navy">Buildings ({buildings.length})</h3>
        <Button onClick={openCreate} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Building
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <motion.div key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-institutional p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-ucc-navy/5 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-ucc-navy" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h4 className="font-heading font-bold text-ucc-navy">{b.name}</h4>
            {b.code && <span className="badge badge-info mt-1">{b.code}</span>}
            {b.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{b.description}</p>}
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              Manager: {b.manager?.name || 'Unassigned'}
            </div>
          </motion.div>
        ))}
      </div>

      {buildings.length === 0 && (
        <div className="card-institutional">
          <div className="empty-state">
            <Building className="empty-state-icon" />
            <h3 className="empty-state-title">No Buildings</h3>
            <p className="empty-state-description">Add your first building to get started.</p>
            <Button onClick={openCreate} className="mt-4 bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Building
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">{editingItem ? 'Edit Building' : 'Add Building'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Building Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" required />
              </div>
              <div>
                <label className="form-label">Code</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="form-input-institutional" placeholder="e.g., SCI-BLDG" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input-institutional" rows={3} />
              </div>
              <div>
                <label className="form-label">Manager</label>
                <select value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} className="form-input-institutional">
                  <option value="">Select Manager</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BuildingManagementPage;