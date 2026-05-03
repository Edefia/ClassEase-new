import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit2, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';

const STATUS_STYLES = {
  setup: { label: 'Setup', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle },
  exam_period: { label: 'Exam Period', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: AlertTriangle },
  closed: { label: 'Closed', color: 'bg-red-50 text-red-700 border-red-300', icon: XCircle },
};

const emptyForm = {
  name: '', academicYear: '', startDate: '', endDate: '', status: 'setup',
  examPeriod: { startDate: '', endDate: '', morningSlot: { start: '08:00', end: '11:00' }, afternoonSlot: { start: '13:00', end: '16:00' } },
};

const SemesterManagementPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSemesters = async () => {
    try { const res = await API.get('/semesters'); setSemesters(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSemesters(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (payload.examPeriod.startDate === '') payload.examPeriod.startDate = null;
      if (payload.examPeriod.endDate === '') payload.examPeriod.endDate = null;
      if (editId) { await API.put(`/semesters/${editId}`, payload); }
      else { await API.post('/semesters', payload); }
      setShowForm(false); setEditId(null); setForm({ ...emptyForm }); fetchSemesters();
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({
      name: s.name, academicYear: s.academicYear,
      startDate: s.startDate?.split('T')[0] || '', endDate: s.endDate?.split('T')[0] || '',
      status: s.status,
      examPeriod: {
        startDate: s.examPeriod?.startDate?.split('T')[0] || '',
        endDate: s.examPeriod?.endDate?.split('T')[0] || '',
        morningSlot: s.examPeriod?.morningSlot || { start: '08:00', end: '11:00' },
        afternoonSlot: s.examPeriod?.afternoonSlot || { start: '13:00', end: '16:00' },
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this semester?')) return;
    try { await API.delete(`/semesters/${id}`); fetchSemesters(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await API.put(`/semesters/${id}/status`, { status: newStatus }); fetchSemesters(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <DashboardLayout title="Semester Management" breadcrumbs={[{ label: 'Semesters' }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-heading font-bold text-ucc-navy">Academic Semesters</h2>
          <p className="text-sm text-gray-500">Configure semesters and exam periods for scheduling</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm }); }} className="bg-ucc-navy hover:bg-ucc-navy-700 text-white gap-1.5">
          <Plus className="w-4 h-4" /> New Semester
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-institutional p-6 mb-6">
          <h3 className="font-heading font-bold text-ucc-navy mb-4">{editId ? 'Edit' : 'Create'} Semester</h3>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Semester Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="First Semester" className="form-input-institutional w-full" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year</label>
                <input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2025/2026" className="form-input-institutional w-full" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="form-input-institutional w-full" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="form-input-institutional w-full" required />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-ucc-navy mb-3">Exam Period Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Start Date</label>
                  <input type="date" value={form.examPeriod.startDate} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, startDate: e.target.value } })} className="form-input-institutional w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Exam End Date</label>
                  <input type="date" value={form.examPeriod.endDate} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, endDate: e.target.value } })} className="form-input-institutional w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Morning Slot</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={form.examPeriod.morningSlot.start} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, morningSlot: { ...form.examPeriod.morningSlot, start: e.target.value } } })} className="form-input-institutional" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={form.examPeriod.morningSlot.end} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, morningSlot: { ...form.examPeriod.morningSlot, end: e.target.value } } })} className="form-input-institutional" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Afternoon Slot</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={form.examPeriod.afternoonSlot.start} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, afternoonSlot: { ...form.examPeriod.afternoonSlot, start: e.target.value } } })} className="form-input-institutional" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={form.examPeriod.afternoonSlot.end} onChange={(e) => setForm({ ...form, examPeriod: { ...form.examPeriod, afternoonSlot: { ...form.examPeriod.afternoonSlot, end: e.target.value } } })} className="form-input-institutional" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-ucc-navy text-white">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : semesters.length === 0 ? (
        <div className="card-institutional py-16 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-ucc-navy text-lg mb-1">No Semesters</h3>
          <p className="text-sm text-gray-400">Create your first semester to begin scheduling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((s) => {
            const st = STATUS_STYLES[s.status] || STATUS_STYLES.setup;
            const StIcon = st.icon;
            return (
              <motion.div key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-institutional p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-ucc-navy text-lg">{s.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.color}`}>
                        <StIcon className="w-3 h-3" /> {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{s.academicYear} • {formatDate(s.startDate)} — {formatDate(s.endDate)}</p>
                    {s.examPeriod?.startDate && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-ucc-navy">Exam Period:</span>
                        <span>{formatDate(s.examPeriod.startDate)} — {formatDate(s.examPeriod.endDate)}</span>
                        <span>Morning: {s.examPeriod.morningSlot?.start}–{s.examPeriod.morningSlot?.end}</span>
                        <span>Afternoon: {s.examPeriod.afternoonSlot?.start}–{s.examPeriod.afternoonSlot?.end}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {s.status === 'setup' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(s._id, 'active')} className="text-xs text-emerald-600 border-emerald-200">Activate</Button>}
                    {s.status === 'active' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(s._id, 'exam_period')} className="text-xs text-amber-600 border-amber-200">Start Exams</Button>}
                    {s.status === 'exam_period' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(s._id, 'closed')} className="text-xs text-red-600 border-red-200">Close</Button>}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(s)}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(s._id)} className="text-red-500 border-red-200 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default SemesterManagementPage;
