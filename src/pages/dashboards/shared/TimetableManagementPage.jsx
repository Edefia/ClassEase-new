import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const TimetableManagementPage = () => {
  const [entries, setEntries] = useState([]);
  const [grid, setGrid] = useState({});
  const [courses, setCourses] = useState([]);
  const [venues, setVenues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const { confirm, ConfirmDialog } = useConfirm();

  const [filters, setFilters] = useState({
    semester: '',
    department: '',
    type: '',
  });

  const [formData, setFormData] = useState({
    course: '', venues: [], lecturer: '', dayOfWeek: 'monday',
    timeStart: '08:00', timeEnd: '10:00', entryType: 'lecture',
    semester: '', department: '', notes: '', groupNumber: 1, totalGroups: 1
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, vRes, dRes, uRes] = await Promise.all([
        API.get('/semesters'),
        API.get('/courses'),
        API.get('/venues'),
        API.get('/departments'),
        API.get('/users'),
      ]);

      const fetchedSemesters = sRes.data;
      setSemesters(fetchedSemesters);
      setCourses(cRes.data);
      setVenues(vRes.data);
      setDepartments(dRes.data);
      setLecturers(uRes.data.filter((u) => ['lecturer', 'department_coordinator'].includes(u.role)));

      const activeSemester = fetchedSemesters.find(s => s.status === 'active' || s.status === 'exam_period')?._id || fetchedSemesters[0]?._id;
      
      const currentSemesterId = filters.semester || activeSemester;
      if (!filters.semester && activeSemester) {
        setFilters(f => ({ ...f, semester: activeSemester }));
      }

      if (currentSemesterId) {
        const params = new URLSearchParams();
        params.append('semester', currentSemesterId);
        if (filters.department) params.append('department', filters.department);

        const gRes = await API.get(`/timetable/grid?${params.toString()}`);
        setGrid(gRes.data.grid || {});
        setEntries(Object.values(gRes.data.grid || {}).flat());
      }
    } catch (e) {
      console.error("Error fetching timetable:", e);
      setGrid({});
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflicts([]);
    try {
      if (editingItem) {
        await API.put(`/timetable/${editingItem._id}`, formData);
        toast({ title: 'Entry Updated' });
      } else {
        await API.post('/timetable', formData);
        toast({ title: 'Entry Created' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflicts(err.response.data.conflicts || []);
        toast({ title: 'Conflict Detected', description: err.response.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
      }
    }
  };

  const handleForceCreate = async () => {
    try {
      if (editingItem) {
        await API.put(`/timetable/${editingItem._id}`, { ...formData, forceOverride: true });
      } else {
        await API.post('/timetable', { ...formData, forceOverride: true });
      }
      toast({ title: 'Entry Created (Conflicts Overridden)' });
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Entry',
      message: 'Delete this timetable entry?',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await API.delete(`/timetable/${id}`);
      toast({ title: 'Entry Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = (day, time) => {
    setEditingItem(null);
    setConflicts([]);
    setFormData({
      course: '', venues: [], lecturer: '', dayOfWeek: day || 'monday',
      timeStart: time || '08:00', timeEnd: time ? `${String(Number(time.split(':')[0]) + 2).padStart(2, '0')}:00` : '10:00',
      entryType: 'lecture', semester: filters.semester,
      department: filters.department || '', notes: '', groupNumber: 1, totalGroups: 1
    });
    setShowModal(true);
  };

  const openEdit = (entry) => {
    setEditingItem(entry);
    setConflicts([]);
    setFormData({
      course: entry.course?._id || '', venues: entry.venues?.map(v => v._id || v) || (entry.venue ? [entry.venue._id || entry.venue] : []),
      lecturer: entry.lecturer?._id || '', dayOfWeek: entry.dayOfWeek,
      timeStart: entry.timeStart, timeEnd: entry.timeEnd, entryType: entry.entryType || entry.type,
      semester: entry.semester?._id || entry.semester,
      department: entry.department?._id || entry.department || '', notes: entry.notes || '',
      groupNumber: entry.groupNumber || 1, totalGroups: entry.totalGroups || 1
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setConflicts([]); };

  const getEntryColor = (type) => {
    const colors = {
      lecture: 'bg-blue-100 border-blue-300 text-blue-800',
      tutorial: 'bg-green-100 border-green-300 text-green-800',
      practical: 'bg-purple-100 border-purple-300 text-purple-800',
      exam: 'bg-red-100 border-red-300 text-red-800',
    };
    return colors[type] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getEntriesAt = (day, time) => {
    return (grid[day] || []).filter((e) => {
      const eStart = e.timeStart;
      const eEnd = e.timeEnd;
      return eStart <= time && eEnd > time;
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Timetable Management">
        <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Timetable Management" breadcrumbs={[{ label: 'Timetable' }]}>
      <div className="card-institutional p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="form-input-institutional w-auto">
              <option value="">Select Semester</option>
              {semesters.map((s) => <option key={s._id} value={s._id}>{s.name} {s.academicYear}</option>)}
            </select>
            <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="form-input-institutional w-auto">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-ucc-navy' : 'text-gray-500'}`}>Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow text-ucc-navy' : 'text-gray-500'}`}>List</button>
            </div>
            <Button onClick={() => openCreate()} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mb-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> Lecture</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Tutorial</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" /> Practical</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Exam</div>
      </div>

      {viewMode === 'grid' ? (
        <div className="card-institutional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-16 p-2 text-xs font-semibold text-gray-500 text-left bg-gray-50">Time</th>
                  {DAYS.map((day) => (
                    <th key={day} className="p-2 text-xs font-semibold text-ucc-navy text-center bg-gray-50 min-w-[140px]">
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b border-gray-100">
                    <td className="p-2 text-xs text-gray-400 font-mono bg-gray-50 whitespace-nowrap">{time}</td>
                    {DAYS.map((day) => {
                      const cellEntries = getEntriesAt(day, time);
                      return (
                        <td
                          key={`${day}-${time}`}
                          className="p-1 min-h-[48px] align-top cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => cellEntries.length === 0 && openCreate(day, time)}
                        >
                          {cellEntries.map((e) => (
                            e.timeStart === time && (
                              <div
                                key={e._id}
                                onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                                className={`p-1.5 rounded border text-[10px] leading-tight cursor-pointer hover:shadow-sm transition-shadow flex flex-col ${getEntryColor(e.entryType || e.type)}`}
                                style={{ minHeight: `${(parseInt(e.timeEnd) - parseInt(e.timeStart)) * 48 - 8}px` }}
                              >
                                <p className="font-bold truncate">
                                  {e.course?.code || 'N/A'}
                                  {e.totalGroups > 1 && ` (G${e.groupNumber}/${e.totalGroups})`}
                                </p>
                                <p className="truncate opacity-80">{e.venues?.map(v => v.name).join(', ') || (e.venue?.name || '—')}</p>
                                <p className="truncate opacity-60">
                                  {e.lecturers?.length > 0 ? e.lecturers.map(l => l.name).join(', ') : (e.lecturer?.name || '')}
                                </p>
                              </div>
                            )
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-institutional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Venues</th>
                  <th>Lecturer</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No timetable entries.</td></tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-ucc-crimson">{e.course?.code}</span>
                          {e.totalGroups > 1 && (
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                              G{e.groupNumber}/{e.totalGroups}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs block">{e.course?.name}</span>
                      </td>
                      <td className="capitalize">{e.dayOfWeek}</td>
                      <td className="whitespace-nowrap font-mono text-sm">{e.timeStart} – {e.timeEnd}</td>
                      <td>{e.venues?.map(v => v.name).join(', ') || (e.venue?.name || '—')}</td>
                      <td className="text-xs">
                        {e.lecturers?.length > 0 ? e.lecturers.map(l => l.name).join(', ') : (e.lecturer?.name || '—')}
                      </td>
                      <td><span className={`badge ${getEntryColor(e.entryType || e.type)}`}>{e.entryType || e.type}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">{editingItem ? 'Edit Entry' : 'Add Timetable Entry'}</h3>

            {conflicts.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Conflicts Detected</span>
                </div>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-amber-700 mb-1">• {c.message}</p>
                ))}
                <Button size="sm" onClick={handleForceCreate} className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs">
                  Override & Create Anyway
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Course</label>
                  <select value={formData.course} onChange={(e) => {
                    const course = courses.find((c) => c._id === e.target.value);
                    setFormData({
                      ...formData,
                      course: e.target.value,
                      lecturer: course?.lecturer?._id || course?.lecturer || formData.lecturer,
                      department: course?.department?._id || course?.department || formData.department,
                    });
                  }} className="form-input-institutional" required>
                    <option value="">Select Course</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Day</label>
                  <select value={formData.dayOfWeek} onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })} className="form-input-institutional">
                    {DAYS.map((d) => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select value={formData.entryType} onChange={(e) => setFormData({ ...formData, entryType: e.target.value })} className="form-input-institutional">
                    <option value="lecture">Lecture</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="practical">Practical</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Time</label>
                  <input type="time" value={formData.timeStart} onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })} className="form-input-institutional" required />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input type="time" value={formData.timeEnd} onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })} className="form-input-institutional" required />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Venues (Multiple allowed)</label>
                  <select multiple value={formData.venues} onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, venues: selected });
                  }} className="form-input-institutional min-h-[80px]" required>
                    {venues.filter((v) => v.isAvailable).map((v) => <option key={v._id} value={v._id}>{v.name} (Cap: {v.capacity})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Lecturer</label>
                  <select value={formData.lecturer} onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })} className="form-input-institutional">
                    <option value="">Select Lecturer</option>
                    {lecturers.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-input-institutional" required>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Notes</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input-institutional" placeholder="Optional notes..." />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <ConfirmDialog />
    </DashboardLayout>
  );
};

export default TimetableManagementPage;
