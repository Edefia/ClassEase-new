import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
    }
    setIsLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      setDepartments([]);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm) ||
    (user.department && user.department.toLowerCase().includes(searchTerm))
  );

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/users/${userId}`);
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      toast({ title: "User Deleted", description: "User has been removed." });
    } catch (err) {
      toast({ title: "Delete Failed", description: err.response?.data?.error || 'Failed to delete user.', variant: 'destructive' });
    }
  };

  const openAddModal = () => {
    setForm({ name: '', email: '', password: '', role: 'student', department: '' });
    setEditUserId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      department: user.department || '',
    });
    setEditUserId(user._id);
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editUserId && !form.password) || !form.role || !form.department) {
      setFormError('All fields are required. Password is required for new users.');
      return;
    }
    try {
      if (editUserId) {
        await API.put(`/users/${editUserId}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
        });
        toast({ title: 'User Updated', description: 'User details have been updated.' });
      } else {
        await API.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department,
        });
        toast({ title: 'User Added', description: 'A new user has been created.' });
      }
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', department: '' });
      setEditUserId(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save user.');
    }
  };

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground">Manage Users</h1>
        <Button onClick={openAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" /> Add New User
        </Button>
      </motion.div>
      {/* Add/Edit User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUserId ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleFormChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={form.email} onChange={handleFormChange} required />
            </div>
            {!editUserId && (
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" value={form.password} onChange={handleFormChange} required />
              </div>
            )}
            <div>
              <Label>Role</Label>
              <select name="role" value={form.role} onChange={handleFormChange} className="form-input w-full">
                <option value="student" className='bg-slate-700'>Student</option>
                <option value="lecturer" className='bg-slate-700'>Lecturer</option>
                <option value="manager" className='bg-slate-700'>Manager</option>
                <option value="admin" className='bg-slate-700'>Admin</option>
              </select>
            </div>
            <div>
              <Label>Department</Label>
              <select name="department" value={form.department} onChange={handleFormChange} className="form-input w-full" required>
                <option value="" className='bg-slate-700'>Select Department</option>
                {departments.map((dept, idx) => (
                  <option key={dept._id || idx} value={dept.name} className='bg-slate-700'>{dept.name}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditUserId(null); setForm({ name: '', email: '', password: '', role: 'student', department: '' }); setFormError(''); }}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">{editUserId ? 'Update User' : 'Add User'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-foreground">All Users ({filteredUsers.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 bg-background border-border focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner-large border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Role</TableHead>
                    <TableHead className="text-foreground">Department</TableHead>
                    {/* <TableHead className="text-foreground">Identifier</TableHead> */}
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user._id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{user.role}</TableCell>
                      <TableCell className="text-muted-foreground">{user.department || 'N/A'}</TableCell>
                      {/* <TableCell className="text-muted-foreground">N/A</TableCell> */}
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(user)}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user._id)} className="hover:bg-destructive/10 hover:border-destructive">
                          <Trash2 className="w-4 h-4 text-orange-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found matching your criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;