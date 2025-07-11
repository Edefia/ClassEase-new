import React, { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const DepartmentManagementPage = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editDeptId, setEditDeptId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      setDepartments([]);
    }
    setIsLoading(false);
  };

  const openAddModal = () => {
    setForm({ name: '', code: '', description: '' });
    setEditDeptId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
    });
    setEditDeptId(dept._id);
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setFormError('Name is required.');
      return;
    }
    try {
      if (editDeptId) {
        await API.put(`/departments/${editDeptId}`, form);
        toast({ title: 'Department Updated', description: 'Department details have been updated.' });
      } else {
        await API.post('/departments', form);
        toast({ title: 'Department Added', description: 'A new department has been created.' });
      }
      setShowModal(false);
      setForm({ name: '', code: '', description: '' });
      setEditDeptId(null);
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save department.');
    }
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await API.delete(`/departments/${deptId}`);
      toast({ title: 'Department Deleted', description: 'Department has been removed.' });
      fetchDepartments();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.response?.data?.error || 'Failed to delete department.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground">Manage Departments</h1>
        <Button onClick={openAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </motion.div>
      {/* Add/Edit Department Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDeptId ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleFormChange} required />
            </div>
            <div>
              <Label>Code</Label>
              <Input name="code" value={form.code} onChange={handleFormChange} />
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" value={form.description} onChange={handleFormChange} />
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditDeptId(null); setForm({ name: '', code: '', description: '' }); setFormError(''); }}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">{editDeptId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-foreground">All Departments ({departments.length})</CardTitle>
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
                    <TableHead className="text-foreground">Code</TableHead>
                    <TableHead className="text-foreground">Description</TableHead>
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map(dept => (
                    <TableRow key={dept._id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground">{dept.code || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{dept.description || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(dept)}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(dept._id)} className="hover:bg-destructive/10 hover:border-destructive">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && departments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No departments found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentManagementPage; 