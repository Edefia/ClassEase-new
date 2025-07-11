import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const VenuesManagementPage = () => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    amenities: '', // comma-separated string
    capacity: '',
    status: 'Active',
    image: '',
    building: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [editVenueId, setEditVenueId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [buildings, setBuildings] = useState([]);

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/venues');
      setVenues(res.data);
    } catch (err) {
      setVenues([]);
    }
      setIsLoading(false);
  };

  const fetchBuildings = async () => {
    try {
      const res = await API.get('/buildings');
      setBuildings(res.data);
    } catch (err) {
      setBuildings([]);
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchBuildings();
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
    setFormError('');
  };

  const API_BASE = 'http://localhost:5000';
  const PLACEHOLDER_IMAGE = '/placeholder.svg'; // Adjust if needed

  const handleAddOrEditVenue = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.capacity || !form.building) {
      setFormError('All fields are required.');
      return;
    }
    let imageUrl = form.image;
    if (imageFile) {
      const data = new FormData();
      data.append('image', imageFile);
      try {
        const res = await API.post('/venues/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.imageUrl;
      } catch (err) {
        setFormError('Image upload failed.');
        return;
      }
    }
    // Always send the current image path (even if no new image is selected)
    const amenitiesArr = form.amenities
      ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
      : [];
    try {
      if (editVenueId) {
        await API.put(`/venues/${editVenueId}`,
          {
            name: form.name,
            type: form.type,
            amenities: amenitiesArr,
            capacity: Number(form.capacity),
            status: form.status,
            image: imageUrl || PLACEHOLDER_IMAGE,
            building: form.building,
          });
        toast({ title: 'Venue Updated', description: 'The venue has been updated.' });
      } else {
        await API.post('/venues', {
          name: form.name,
          type: form.type,
          amenities: amenitiesArr,
          capacity: Number(form.capacity),
          status: form.status,
          image: imageUrl || PLACEHOLDER_IMAGE,
          building: form.building,
        });
        toast({ title: 'Venue Added', description: 'The new venue has been added.' });
      }
      setShowModal(false);
      setForm({ name: '', type: '', amenities: '', capacity: '', status: 'Active', image: '', building: '' });
      setImageFile(null);
      setEditVenueId(null);
      fetchVenues();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save venue.');
    }
  };

  const handleEditClick = (venue) => {
    setForm({
      name: venue.name || '',
      type: venue.type || '',
      amenities: Array.isArray(venue.amenities) ? venue.amenities.join(', ') : '',
      capacity: venue.capacity || '',
      status: venue.status || 'Active',
      image: venue.image || '',
      building: venue.building?._id || '',
    });
    setImageFile(null);
    setEditVenueId(venue._id || venue.id);
    setShowModal(true);
    setFormError('');
  };

  const handleDeleteClick = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    setDeleteLoading(venueId);
    try {
      await API.delete(`/venues/${venueId}`);
      toast({ title: 'Venue Deleted', description: 'The venue has been deleted.' });
      fetchVenues();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.response?.data?.error || 'Failed to delete venue.', variant: 'destructive' });
    }
    setDeleteLoading(null);
  };

  return (
    <div className="space-y-6 w-full h-full px-0 md:px-2 py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <Building className="w-6 h-6 mr-2 text-primary" /> Venues Management
        </h1>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add New Venue
        </Button>
      </motion.div>
      {/* Add/Edit Venue Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditVenueId(null); setForm({ name: '', type: '', amenities: '', capacity: '', status: 'Active', image: '', building: '' }); setImageFile(null); setFormError(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editVenueId ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOrEditVenue} className="space-y-4">
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
              <select name="building" value={form.building} onChange={handleFormChange} required className="form-input w-full">
                <option value="" className='bg-slate-700'>Select Building</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id} className='bg-slate-700'>{b.name}</option>
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
              <Label>Status</Label>
              <select name="status" value={form.status} onChange={handleFormChange} className="form-input w-full">
                <option value="Active" className='bg-slate-700'>Active</option>
                <option value="Inactive" className='bg-slate-700'>Inactive</option>
              </select>
            </div>
            <div>
              <Label>Image</Label>
              <Input name="image" type="file" accept="image/*" onChange={handleImageChange} />
              {form.image && !imageFile && (
                <img src={form.image} alt="Venue" className="mt-2 rounded w-32 h-20 object-cover border" />
              )}
              {imageFile && (
                <span className="block mt-1 text-xs text-muted-foreground">{imageFile.name}</span>
              )}
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditVenueId(null); setForm({ name: '', type: '', amenities: '', capacity: '', status: 'Active', image: '', building: '' }); setImageFile(null); setFormError(''); }}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">{editVenueId ? 'Update Venue' : 'Add Venue'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-foreground">All Venues ({venues.length})</CardTitle>
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
                    <TableHead className="text-foreground">Image</TableHead>
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Type</TableHead>
                    <TableHead className="text-foreground">Building</TableHead>
                    <TableHead className="text-foreground">Capacity</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.map(venue => (
                    <TableRow key={venue._id || venue.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        {venue.image ? (
                          <img
                            src={venue.image.startsWith('/uploads') ? `${API_BASE}${venue.image}` : venue.image}
                            alt={venue.name}
                            className="w-16 h-12 object-cover rounded border"
                            onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
                          />
                        ) : (
                          <img src={PLACEHOLDER_IMAGE} alt="No image" className="w-16 h-12 object-cover rounded border" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{venue.name}</TableCell>
                      
                      <TableCell className="text-muted-foreground">{venue.type}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.building?.name || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.capacity}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditClick(venue)}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteClick(venue._id || venue.id)} disabled={deleteLoading === (venue._id || venue.id)}>
                          <Trash2 className="w-4 h-4 text-orange-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && venues.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No venues found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenuesManagementPage; 