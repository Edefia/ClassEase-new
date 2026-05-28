import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, RefreshCw, Zap } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

const TimeSlotSettingsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ label: '', startTime: '07:00', endTime: '08:00', dayOfWeek: 'monday' });
  const { confirm, ConfirmDialog } = useConfirm();

  const fetchSlots = async () => {
    try { const res = await API.get('/timeslots'); setSlots(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await API.post('/timeslots', formData);
      setShowModal(false);
      setFormData({ label: '', startTime: '07:00', endTime: '08:00', dayOfWeek: 'monday' });
      fetchSlots();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const generateDefaults = async () => {
    setGenerating(true);
    try {
      await API.post('/timeslots/bulk', {});
      fetchSlots();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const deleteSlot = async (id) => {
    try { await API.delete(`/timeslots/${id}`); fetchSlots(); }
    catch (e) { toast({ title: 'Error', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const deleteAll = async () => {
    const ok = await confirm({
      title: 'Delete All Slots',
      message: 'Delete ALL time slots? This will affect scheduling.',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try { await API.delete('/timeslots'); fetchSlots(); }
    catch (e) { toast({ title: 'Error', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  // Group slots by period label
  const periods = [...new Set(slots.map(s => s.label))].sort();
  const grid = {};
  for (const s of slots) {
    if (!grid[s.label]) grid[s.label] = {};
    grid[s.label][s.dayOfWeek] = s;
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Time Slots' }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-heading font-bold text-ucc-navy">Time Slot Templates</h2>
          <p className="text-sm text-gray-500">Define the daily periods used by the scheduling engine</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="text-ucc-navy border-ucc-navy hover:bg-blue-50 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Slot
          </Button>
          {slots.length > 0 && (
            <Button variant="outline" size="sm" onClick={deleteAll} className="text-red-500 border-red-200 hover:bg-red-50 gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          )}
          <Button onClick={generateDefaults} disabled={generating} className="bg-ucc-navy hover:bg-ucc-navy-700 text-white gap-1.5">
            <Zap className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Default Periods'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : slots.length === 0 ? (
        <div className="card-institutional py-16 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-ucc-navy text-lg mb-1">No Time Slots</h3>
          <p className="text-sm text-gray-400 mb-4">Click "Generate Default Periods" to create the standard 5-period grid (07:00–17:00, Mon–Sat).</p>
        </div>
      ) : (
        <div className="card-institutional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Time</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, i) => {
                  const sample = grid[period]?.[DAYS.find(d => grid[period]?.[d])];
                  return (
                    <tr key={period} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-semibold text-ucc-navy text-sm">{period}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{sample?.startTime || '—'} – {sample?.endTime || '—'}</td>
                      {DAYS.map(day => {
                        const slot = grid[period]?.[day];
                        return (
                          <td key={day} className="px-3 py-3 text-center">
                            {slot ? (
                              <div className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <button onClick={() => deleteSlot(slot._id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            {slots.length} time slots across {periods.length} periods × {DAYS.length} days
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-xl mb-4">Add Custom Time Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="form-label">Period Label</label>
                <input type="text" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="form-input-institutional" placeholder="e.g. Period 1" required />
              </div>
              <div>
                <label className="form-label">Day of Week</label>
                <select value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })} className="form-input-institutional" required>
                  {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Time</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="form-input-institutional font-mono" required />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="form-input-institutional font-mono" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-ucc-navy hover:bg-ucc-navy-700 text-white">Add Slot</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <ConfirmDialog />
    </DashboardLayout>
  );
};

export default TimeSlotSettingsPage;
