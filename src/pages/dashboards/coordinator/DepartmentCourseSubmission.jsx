import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const DepartmentCourseSubmission = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', isNew: false,
    creditHours: 3, practicalHoursPerWeek: 0, estimatedStudents: 0,
    numberOfGroups: 1, lecturers: [], level: 100,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get active semester
      const semRes = await API.get('/semesters/active');
      const semester = semRes.data;
      setActiveSemester(semester);

      // Get department ID safely
      const dRes = await API.get('/departments');
      const dept = dRes.data.find(d => 
        (d.name && user?.department && d.name.toLowerCase().trim() === user.department.toLowerCase().trim()) || 
        d._id === user?.department || 
        d._id === user?.departmentId
      );
      const matchedDeptId = dept ? dept._id : (user?.departmentId || user?.department);
      if (matchedDeptId) setDepartmentId(matchedDeptId);

      if (semester) {
        // 2. Get department submission status
        const subRes = await API.get(`/submissions/semester/${semester._id}`);
        if (subRes.data && subRes.data.length > 0) {
          setSubmission(subRes.data[0]);
        }

        // 3. Get courses for this semester and department
        const cRes = await API.get('/courses');
        const deptCourses = cRes.data.filter(c => {
          const semesterId = c.semester?._id || c.semester;
          const departmentId = c.department?._id || c.department;
          const semesterMatch = String(semesterId) === String(semester._id);
          const deptMatch = matchedDeptId
            ? String(departmentId) === String(matchedDeptId)
            : c.department?.name?.toLowerCase().trim() === user?.department?.toLowerCase().trim();
          return semesterMatch && deptMatch;
        });
        setCourses(deptCourses);
      }

      // 4. Get lecturers
      const uRes = await API.get('/users/lecturers');
      setLecturers(uRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        semester: activeSemester._id,
        department: departmentId,
      };

      if (editingItem) {
        await API.put(`/courses/${editingItem._id}`, payload);
        toast({ title: 'Course Updated' });
      } else {
        await API.post('/courses', payload);
        toast({ title: 'Course Added' });
      }
      fetchData();
      closeModal();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Remove Course',
      message: 'Remove this course from the submission?',
      confirmText: 'Remove',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await API.delete(`/courses/${id}`);
      toast({ title: 'Course Removed' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleLecturerToggle = (id) => {
    const current = formData.lecturers || [];
    if (current.includes(id)) {
      setFormData({ ...formData, lecturers: current.filter(l => l !== id) });
    } else {
      setFormData({ ...formData, lecturers: [...current, id] });
    }
  };

  const submitToAcademicAffairs = async () => {
    const ok = await confirm({
      title: 'Submit to Academic Affairs',
      message: 'Are you sure you want to submit? You can still edit and resubmit courses until the submission deadline.',
      confirmText: 'Submit',
      variant: 'info'
    });
    if (!ok) return;
    try {
      await API.post(`/submissions/semester/${activeSemester._id}/submit`);
      toast({ title: 'Submission sent to Academic Affairs' });
      fetchData();
    } catch (err) {
      toast({ title: 'Submission Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '', name: '', isNew: false,
      creditHours: 3, practicalHoursPerWeek: 0, estimatedStudents: 0,
      numberOfGroups: 1, lecturers: [], level: 100,
    });
    setLecturerSearch('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingItem(c);
    setFormData({
      code: c.code, name: c.name, isNew: c.isNew,
      creditHours: c.creditHours, practicalHoursPerWeek: c.practicalHoursPerWeek || 0,
      estimatedStudents: c.estimatedStudents || 0, numberOfGroups: c.numberOfGroups || 1,
      lecturers: c.lecturers?.map(l => l._id || l) || [], level: c.level,
    });
    setLecturerSearch('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const isReadOnly = activeSemester?.submissionDeadline && new Date() > new Date(activeSemester.submissionDeadline);

  if (loading) return <DashboardLayout title="Course Submission"><div className="flex justify-center py-16"><div className="loading-spinner-large" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Department Course Submission" breadcrumbs={[{ label: 'Submission' }]}>
      {!activeSemester ? (
        <div className="card-institutional p-8 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
          <h2 className="text-lg font-bold text-ucc-navy">No Active Semester</h2>
          <p>Academic Affairs has not configured an active semester for submissions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Header */}
          <div className="card-institutional p-6 border-l-4 border-l-ucc-navy">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold text-ucc-navy mb-1">
                  Submission for {activeSemester.name} {activeSemester.academicYear}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-600">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    submission?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    submission?.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    submission?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {submission?.status || 'Draft / Not Started'}
                  </span>
                </div>
                {submission?.status === 'rejected' && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong>Rejection Reason:</strong> {submission.rejectionReason}
                  </p>
                )}
                {activeSemester?.submissionDeadline && (
                  <p className={`mt-2 text-sm font-semibold flex items-center gap-1 ${isReadOnly ? 'text-red-600' : 'text-amber-600'}`}>
                    <Clock className="w-4 h-4" />
                    {isReadOnly 
                      ? `Submission Closed on ${new Date(activeSemester.submissionDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
                      : `Deadline: ${new Date(activeSemester.submissionDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={openCreate} disabled={isReadOnly} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Course
                </Button>
                <Button 
                  onClick={submitToAcademicAffairs} 
                  disabled={isReadOnly || courses.length === 0}
                  className="bg-ucc-navy hover:bg-ucc-navy-700 text-white gap-2"
                >
                  <Send className="w-4 h-4" /> Submit to Academic Affairs
                </Button>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="card-institutional overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code & Title</th>
                    <th>Credits</th>
                    <th>Practical (hrs/wk)</th>
                    <th>Est. Students</th>
                    <th>Groups</th>
                    <th>Lecturers</th>
                    {!isReadOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr><td colSpan={isReadOnly ? 7 : 8} className="text-center py-8 text-gray-400">No courses added to submission yet.</td></tr>
                  ) : (
                    courses.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ucc-crimson">{c.code}</span>
                            {c.isNew && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                          </div>
                          <span className="text-sm font-medium">{c.name}</span>
                        </td>
                        <td>{c.creditHours}</td>
                        <td>{c.practicalHoursPerWeek}</td>
                        <td>{c.estimatedStudents}</td>
                        <td>{c.numberOfGroups}</td>
                        <td className="text-xs text-gray-600 max-w-[150px] truncate">
                          {c.lecturers?.length > 0 ? c.lecturers.map(l => l.name || 'Unknown').join(', ') : 'Unassigned'}
                        </td>
                        {!isReadOnly && (
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between text-sm text-gray-500">
              <span>{courses.length} courses total</span>
              <span>Total Groups: {courses.reduce((sum, c) => sum + (c.numberOfGroups || 1), 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-ucc-navy text-xl mb-4">{editingItem ? 'Edit Course' : 'Add Course'}</h3>
            <form onSubmit={handleSubmitCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Course Code</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="form-input-institutional font-mono" placeholder="e.g. CSC 101" required />
                </div>
                <div>
                  <label className="form-label">Course Title</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-input-institutional" placeholder="e.g. Introduction to Programming" required />
                </div>
                
                <div>
                  <label className="form-label">Level</label>
                  <select value={formData.level} onChange={e => setFormData({ ...formData, level: Number(e.target.value) })} className="form-input-institutional" required>
                    {[100, 200, 300, 400, 500, 600].map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Credit Hours</label>
                  <input type="number" value={formData.creditHours} onChange={e => setFormData({ ...formData, creditHours: Number(e.target.value) })} className="form-input-institutional" min={1} max={6} required />
                </div>
                <div>
                  <label className="form-label">Practical Hours/Week</label>
                  <input type="number" value={formData.practicalHoursPerWeek} onChange={e => setFormData({ ...formData, practicalHoursPerWeek: Number(e.target.value) })} className="form-input-institutional" min={0} max={10} required />
                  <p className="text-[10px] text-gray-500 mt-1">If > 0, the engine will schedule lab sessions.</p>
                </div>

                <div>
                  <label className="form-label">Estimated Total Students</label>
                  <input type="number" value={formData.estimatedStudents} onChange={e => setFormData({ ...formData, estimatedStudents: Number(e.target.value) })} className="form-input-institutional" min={1} required />
                </div>
                <div>
                  <label className="form-label">Number of Groups</label>
                  <input type="number" value={formData.numberOfGroups} onChange={e => setFormData({ ...formData, numberOfGroups: Number(e.target.value) })} className="form-input-institutional" min={1} required />
                  <p className="text-[10px] text-gray-500 mt-1">Students will be divided equally (approx {Math.ceil((formData.estimatedStudents || 0) / (formData.numberOfGroups || 1))} per group).</p>
                </div>

                <div className="md:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <label className="form-label mb-2 block">Assign Lecturers</label>
                  <input type="text" placeholder="Search lecturers by name..." value={lecturerSearch} onChange={e => setLecturerSearch(e.target.value)} className="form-input-institutional w-full mb-3 py-1.5 text-sm" />
                  <div className="max-h-40 overflow-y-auto space-y-2 bg-white p-2 border border-gray-100 rounded">
                    {lecturers.filter(l => l.name.toLowerCase().includes(lecturerSearch.toLowerCase())).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">No lecturers found.</p>
                    ) : (
                      lecturers
                        .filter(l => l.name.toLowerCase().includes(lecturerSearch.toLowerCase()))
                        .map(l => (
                          <label key={l._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input 
                              type="checkbox" 
                              checked={(formData.lecturers || []).includes(l._id)} 
                              onChange={() => handleLecturerToggle(l._id)}
                              className="w-4 h-4 text-ucc-navy rounded border-gray-300"
                            />
                            {l.name}
                          </label>
                        ))
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isNew" checked={formData.isNew} onChange={e => setFormData({ ...formData, isNew: e.target.checked })} className="w-4 h-4 text-ucc-crimson rounded border-gray-300" />
                  <label htmlFor="isNew" className="text-sm font-semibold text-gray-700">This is a brand new course for this semester</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-ucc-navy hover:bg-ucc-navy-700 text-white">{editingItem ? 'Save Changes' : 'Add Course'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <ConfirmDialog />
    </DashboardLayout>
  );
};

export default DepartmentCourseSubmission;
