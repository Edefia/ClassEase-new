import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Shield, Mail, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', department: '', password: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, formData);
        toast({ title: 'User Updated' });
      } else {
        await API.post('/users', formData);
        toast({ title: 'User Created' });
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      toast({ title: 'User Deleted' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'student', department: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, department: user.department || '', password: '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingUser(null); };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-50 text-red-700 border-red-200',
      manager: 'bg-purple-50 text-purple-700 border-purple-200',
      lecturer: 'bg-blue-50 text-blue-700 border-blue-200',
      student: 'bg-green-50 text-green-700 border-green-200',
      department_coordinator: 'bg-amber-50 text-amber-700 border-amber-200',
      academic_affairs: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[role] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="card-institutional p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input-institutional pl-10"
              />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input-institutional w-auto">
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="department_coordinator">Coordinator</option>
              <option value="academic_affairs">Academic Affairs</option>
            </select>
          </div>
          <Button onClick={openCreate} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card-institutional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-gray-500">{u.email}</td>
                    <td>
                      <span className={`badge border ${getRoleBadge(u.role)}`}>{u.role?.replace('_', ' ')}</span>
                    </td>
                    <td>{u.department || '—'}</td>
                    <td className="text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-institutional p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-input-institutional" required />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="form-input-institutional">
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="department_coordinator">Department Coordinator</option>
                  <option value="academic_affairs">Academic Affairs</option>
                </select>
              </div>
              <div>
                <label className="form-label">Department</label>
                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-input-institutional" />
              </div>
              {!editingUser && (
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-input-institutional" required />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;