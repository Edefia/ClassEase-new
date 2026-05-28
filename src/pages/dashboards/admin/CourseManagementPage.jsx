import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, BookOpen, Users, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', department: '', lecturer: '', level: 100, creditHours: 3,
    semester: 'first', academicYear: '2025/2026', expectedEnrollment: 0,
  });
  const { confirm, ConfirmDialog } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes, uRes] = await Promise.all([
        API.get('/courses'),
        API.get('/departments'),
        API.get('/users/lecturers'),
      ]);
      setCourses(cRes.data);
      setDepartments(dRes.data);
      setLecturers(uRes.data);
    } catch { setCourses([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = courses.filter((c) => {
    const matchesSearch = !searchTerm ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || (c.department?._id || c.department) === deptFilter;
    const matchesLevel = !levelFilter || c.level === Number(levelFilter);
    return matchesSearch && matchesDept && matchesLevel;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await API.put(`/courses/${editingItem._id}`, formData);
        toast({ title: 'Course Updated' });
      } else {
        await API.post('/courses', formData);
        toast({ title: 'Course Created' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This will remove it from all timetables.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await API.delete(`/courses/${id}`);
      toast({ title: 'Course Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', name: '', department: '', lecturer: '', level: 100, creditHours: 3, semester: 'first', academicYear: '2025/2026', expectedEnrollment: 0 });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingItem(c);
    setFormData({
      code: c.code, name: c.name, department: c.department?._id || c.department || '',
      lecturer: c.lecturer?._id || c.lecturer || '', level: c.level, creditHours: c.creditHours,
      semester: c.semester, academicYear: c.academicYear, expectedEnrollment: c.expectedEnrollment || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner-large" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-institutional p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-institutional pl-10" />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="form-input-institutional w-auto">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="form-input-institutional w-auto">
              <option value="">All Levels</option>
              {[100, 200, 300, 400, 500, 600].map((l) => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <Button onClick={openCreate} className="bg-ucc-crimson hover:bg-ucc-crimson-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Course
          </Button>
        </div>
      </div>

      {/* Courses Table */}
      <div className="card-institutional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Level</th>
                <th>Credits</th>
                <th>Lecturer</th>
                <th>Enrollment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No courses found.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id}>
                    <td><span className="font-mono font-semibold text-ucc-crimson">{c.code}</span></td>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.department?.name || '—'}</td>
                    <td><span className="badge badge-info">L{c.level}</span></td>
                    <td>{c.creditHours}</td>
                    <td>{c.lecturer?.name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td>{c.expectedEnrollment || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          {filtered.length} course{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-lg mb-4">{editingItem ? 'Edit Course' : 'Add Course'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Course Code</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="form-input-institutional font-mono" placeholder="CSC 101" required />
                </div>
                <div>
                  <label className="form-label">Level</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })} className="form-input-institutional">
                    {[100, 200, 300, 400, 500, 600].map((l) => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Course Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" placeholder="Introduction to Computer Science" required />
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-input-institutional" required>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Lecturer</label>
                  <select value={formData.lecturer} onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })} className="form-input-institutional">
                    <option value="">Unassigned</option>
                    {lecturers.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Credit Hours</label>
                  <input type="number" value={formData.creditHours} onChange={(e) => setFormData({ ...formData, creditHours: Number(e.target.value) })} className="form-input-institutional" min={1} max={6} />
                </div>
                <div>
                  <label className="form-label">Expected Enrollment</label>
                  <input type="number" value={formData.expectedEnrollment} onChange={(e) => setFormData({ ...formData, expectedEnrollment: Number(e.target.value) })} className="form-input-institutional" min={0} />
                </div>
                <div>
                  <label className="form-label">Semester</label>
                  <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="form-input-institutional">
                    <option value="first">First Semester</option>
                    <option value="second">Second Semester</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Academic Year</label>
                  <input type="text" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} className="form-input-institutional" placeholder="2025/2026" />
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
    </div>
  );
};

export default CourseManagementPage;
