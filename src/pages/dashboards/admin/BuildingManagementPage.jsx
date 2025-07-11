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

const BuildingManagementPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editBuildingId, setEditBuildingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', manager: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchBuildings();
    fetchManagers();
  }, []);

  const fetchBuildings = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/buildings');
      setBuildings(res.data);
    } catch (err) {
      setBuildings([]);
    }
    setIsLoading(false);
  };

  const fetchManagers = async () => {
    try {
      const res = await API.get('/users');
      setManagers(res.data.filter(u => u.role === 'manager'));
    } catch (err) {
      setManagers([]);
    }
  };

  const openAddModal = () => {
    setForm({ name: '', code: '', description: '', manager: '' });
    setEditBuildingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (building) => {
    setForm({
      name: building.name || '',
      code: building.code || '',
      description: building.description || '',
      manager: building.manager?._id || '',
    });
    setEditBuildingId(building._id);
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
      if (editBuildingId) {
        await API.put(`/buildings/${editBuildingId}`, form);
        toast({ title: 'Building Updated', description: 'Building details have been updated.' });
      } else {
        await API.post('/buildings', form);
        toast({ title: 'Building Added', description: 'A new building has been created.' });
      }
      setShowModal(false);
      setForm({ name: '', code: '', description: '', manager: '' });
      setEditBuildingId(null);
      fetchBuildings();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save building.');
    }
  };

  const handleDelete = async (buildingId) => {
    if (!window.confirm('Are you sure you want to delete this building?')) return;
    try {
      await API.delete(`/buildings/${buildingId}`);
      toast({ title: 'Building Deleted', description: 'Building has been removed.' });
      fetchBuildings();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.response?.data?.error || 'Failed to delete building.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground">Manage Buildings</h1>
        <Button onClick={openAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Building
        </Button>
      </motion.div>
      {/* Add/Edit Building Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editBuildingId ? 'Edit Building' : 'Add Building'}</DialogTitle>
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
            <div>
              <Label>Manager</Label>
              <select name="manager" value={form.manager} onChange={handleFormChange} className="form-input w-full">
                <option value="" className='bg-slate-500'>No Manager</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id} className='bg-slate-700'>{mgr.name} ({mgr.email})</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditBuildingId(null); setForm({ name: '', code: '', description: '', manager: '' }); setFormError(''); }}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">{editBuildingId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-foreground">All Buildings ({buildings.length})</CardTitle>
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
                    <TableHead className="text-foreground">Manager</TableHead>
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.map(building => (
                    <TableRow key={building._id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{building.name}</TableCell>
                      <TableCell className="text-muted-foreground">{building.code || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{building.description || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{building.manager ? `${building.manager.name} (${building.manager.email})` : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(building)}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(building._id)} className="hover:bg-destructive/10 hover:border-destructive">
                          <Trash2 className="w-4 h-4 text-orange-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && buildings.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No buildings found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingManagementPage; 