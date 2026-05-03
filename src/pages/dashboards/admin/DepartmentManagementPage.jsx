import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const DepartmentManagementPage = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', faculty: '', coordinator: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, uRes] = await Promise.all([API.get('/departments'), API.get('/users')]);
      setDepartments(dRes.data);
      setUsers(uRes.data.filter((u) => ['lecturer', 'department_coordinator', 'admin'].includes(u.role)));
    } catch { setDepartments([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await API.put(`/departments/${editingItem._id}`, formData);
        toast({ title: 'Department Updated' });
      } else {
        await API.post('/departments', formData);
        toast({ title: 'Department Created' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await API.delete(`/departments/${id}`);
      toast({ title: 'Department Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => { setEditingItem(null); setFormData({ name: '', code: '', description: '', faculty: '', coordinator: '' }); setShowModal(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, code: item.code || '', description: item.description || '', faculty: item.faculty || '', coordinator: item.coordinator?._id || item.coordinator || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="card-institutional p-4 flex items-center justify-between">
        <h3 className="font-heading font-bold text-ucc-navy">Departments ({departments.length})</h3>
        <Button onClick={openCreate} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Department
        </Button>
      </div>

      <div className="card-institutional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Faculty</th>
                <th>Coordinator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No departments.</td></tr>
              ) : (
                departments.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-ucc-navy/5 rounded flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-ucc-navy" />
                        </div>
                        <div>
                          <span className="font-medium">{d.name}</span>
                          {d.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{d.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs">{d.code || '—'}</span></td>
                    <td>{d.faculty || '—'}</td>
                    <td>{d.coordinator?.name || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(d._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">{editingItem ? 'Edit Department' : 'Add Department'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="form-label">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" required /></div>
              <div><label className="form-label">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="form-input-institutional" placeholder="e.g., CSC" /></div>
              <div><label className="form-label">Faculty</label><input type="text" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} className="form-input-institutional" placeholder="e.g., Faculty of Science" /></div>
              <div><label className="form-label">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input-institutional" rows={3} /></div>
              <div>
                <label className="form-label">Coordinator</label>
                <select value={formData.coordinator} onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })} className="form-input-institutional">
                  <option value="">Select Coordinator</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>)}
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

export default DepartmentManagementPage;