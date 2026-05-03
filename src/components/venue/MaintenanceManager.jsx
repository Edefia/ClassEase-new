import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const MaintenanceManager = ({ venue, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ reason: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.reason || !formData.startDate || !formData.endDate) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await API.post(`/venues/${venue._id}/maintenance`, formData);
      toast({ title: 'Maintenance Scheduled', description: `${venue.name} maintenance period added.` });
      setFormData({ reason: '', startDate: '', endDate: '' });
      setShowForm(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleRemove = async (periodId) => {
    if (!confirm('Remove this maintenance period?')) return;
    try {
      await API.delete(`/venues/${venue._id}/maintenance/${periodId}`);
      toast({ title: 'Maintenance Removed' });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const maintenancePeriods = venue?.maintenancePeriods || [];
  const isCurrentlyUnderMaintenance = venue?.isUnderMaintenance;
  const currentMaintenance = maintenancePeriods.find(
    (p) => new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate)
  );

  return (
    <div className="space-y-4">
      {/* Current Status */}
      {isCurrentlyUnderMaintenance && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Currently Under Maintenance</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {currentMaintenance?.reason || 'Scheduled maintenance in progress'}
              {currentMaintenance && (
                <> — Until {new Date(currentMaintenance.endDate).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Scheduled Maintenance Periods */}
      {maintenancePeriods.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-ucc-navy">Scheduled Periods</h4>
          {maintenancePeriods.map((period) => {
            const isActive = new Date() >= new Date(period.startDate) && new Date() <= new Date(period.endDate);
            const isPast = new Date() > new Date(period.endDate);
            return (
              <div key={period._id} className={`flex items-center justify-between p-3 rounded-lg border ${isActive ? 'border-amber-300 bg-amber-50' : isPast ? 'border-gray-100 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <Wrench className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{period.reason || 'Maintenance'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(period.startDate).toLocaleDateString()} — {new Date(period.endDate).toLocaleDateString()}
                      {isActive && <span className="ml-2 text-amber-600 font-semibold">Active</span>}
                      {isPast && <span className="ml-2 text-gray-400">Completed</span>}
                    </p>
                  </div>
                </div>
                {!isPast && (
                  <button onClick={() => handleRemove(period._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Form */}
      {showForm ? (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAdd}
          className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
        >
          <h4 className="text-sm font-semibold text-ucc-navy">Schedule New Maintenance</h4>
          <div>
            <label className="form-label">Reason</label>
            <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="form-input-institutional" placeholder="e.g., Painting, Electrical repair" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="form-input-institutional" min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="form-input-institutional" min={formData.startDate || new Date().toISOString().split('T')[0]} required />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
              {submitting ? 'Scheduling...' : 'Schedule Maintenance'}
            </Button>
          </div>
        </motion.form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full border-dashed">
          <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Maintenance
        </Button>
      )}
    </div>
  );
};

export default MaintenanceManager;
