import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Building, Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const SendNotificationPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    recipient_type: 'all',
    role_filter: '',
    building_id: '',
    priority: 'normal',
    category: 'general',
  });
  const [buildings, setBuildings] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    API.get('/buildings').then((res) => setBuildings(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast({ title: 'Error', description: 'Title and message are required.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await API.post('/notifications', formData);
      toast({ title: 'Notification Sent', description: 'The notification has been sent successfully.' });
      setFormData({ title: '', message: '', type: 'info', recipient_type: 'all', role_filter: '', building_id: '', priority: 'normal', category: 'general' });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="card-institutional p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-ucc-crimson/10 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-ucc-crimson" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-ucc-navy text-lg">Send Notification</h3>
            <p className="text-gray-500 text-sm">Broadcast announcements to users</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="form-input-institutional" placeholder="Notification title" required />
          </div>

          <div>
            <label className="form-label">Message</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="form-input-institutional" rows={4} placeholder="Write your notification..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="form-input-institutional">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Urgent</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="form-input-institutional">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Send To</label>
            <select value={formData.recipient_type} onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })} className="form-input-institutional">
              <option value="all">All Users</option>
              <option value="role">By Role</option>
              <option value="building">By Building</option>
            </select>
          </div>

          {formData.recipient_type === 'role' && (
            <div>
              <label className="form-label">Role</label>
              <select value={formData.role_filter} onChange={(e) => setFormData({ ...formData, role_filter: e.target.value })} className="form-input-institutional">
                <option value="">Select Role</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="manager">Managers</option>
                <option value="department_coordinator">Coordinators</option>
              </select>
            </div>
          )}

          {formData.recipient_type === 'building' && (
            <div>
              <label className="form-label">Building</label>
              <select value={formData.building_id} onChange={(e) => setFormData({ ...formData, building_id: e.target.value })} className="form-input-institutional">
                <option value="">Select Building</option>
                {buildings.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input-institutional">
              <option value="general">General</option>
              <option value="booking">Booking</option>
              <option value="scheduling">Scheduling</option>
              <option value="maintenance">Maintenance</option>
              <option value="system">System</option>
            </select>
          </div>

          <Button type="submit" disabled={sending} className="w-full bg-ucc-crimson hover:bg-ucc-crimson-600 text-white font-semibold py-2.5">
            {sending ? (
              <div className="flex items-center"><div className="loading-spinner mr-2" /> Sending...</div>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send Notification</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SendNotificationPage;