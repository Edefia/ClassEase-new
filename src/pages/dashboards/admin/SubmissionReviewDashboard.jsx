import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, FileText, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const SubmissionReviewDashboard = () => {
  const [activeSemester, setActiveSemester] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [courses, setCourses] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const semRes = await API.get('/semesters/active');
      const semester = semRes.data;
      setActiveSemester(semester);

      if (semester) {
        const [subRes, deptRes] = await Promise.all([
          API.get(`/submissions/semester/${semester._id}`),
          API.get('/departments')
        ]);
        setSubmissions(subRes.data);
        setDepartments(deptRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const loadCourses = async (departmentId) => {
    try {
      const cRes = await API.get('/courses');
      const deptCourses = cRes.data.filter(c => 
        (c.semester === activeSemester._id || c.semester?._id === activeSemester._id) &&
        (c.department?._id === departmentId || c.department === departmentId)
      );
      setCourses(deptCourses);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
    }
  };

  const handleReview = async (submissionId, status, reason = '') => {
    try {
      if (status === 'rejected' && !reason.trim()) {
        return toast({ title: 'Error', description: 'Rejection reason is required', variant: 'destructive' });
      }

      await API.put(`/submissions/${submissionId}/status`, { status, rejectionReason: reason });
      toast({ title: `Submission ${status}` });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedSubmission(null);
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700">Approved</span>;
      case 'submitted': return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">Pending Review</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700">Rejected</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-gray-200 text-gray-700">Draft / Not Started</span>;
    }
  };

  if (loading) return <DashboardLayout title="Submission Review"><div className="flex justify-center py-16"><div className="loading-spinner-large" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Course Submission Review" breadcrumbs={[{ label: 'Review Submissions' }]}>
      {!activeSemester ? (
        <div className="card-institutional p-8 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
          <h2 className="text-lg font-bold text-ucc-navy">No Active Semester</h2>
          <p>Please configure an active semester before reviewing submissions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card-institutional p-4">
              <h3 className="font-heading font-bold text-ucc-navy mb-4">Departments</h3>
              <div className="space-y-2">
                {departments.map(dept => {
                  const sub = submissions.find(s => s.department?._id === dept._id || s.department === dept._id);
                  const isSelected = selectedSubmission?.department?._id === dept._id;
                  
                  return (
                    <button
                      key={dept._id}
                      onClick={() => {
                        setSelectedSubmission(sub || { department: dept, status: 'not_started' });
                        loadCourses(dept._id);
                      }}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-ucc-navy bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-ucc-navy' : 'text-gray-700'}`}>{dept.name}</p>
                        <p className="text-xs text-gray-500">{dept.code}</p>
                      </div>
                      {getStatusBadge(sub?.status)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="lg:col-span-2">
            {!selectedSubmission ? (
              <div className="card-institutional p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[400px]">
                <FileText className="w-16 h-16 mb-4 text-gray-200" />
                <p>Select a department to view their course submission.</p>
              </div>
            ) : (
              <div className="card-institutional p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
                {/* Detail Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-ucc-navy">
                      {selectedSubmission.department?.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: {getStatusBadge(selectedSubmission.status)}
                    </p>
                  </div>
                  {selectedSubmission.status === 'submitted' && (
                    <div className="flex gap-2">
                      <Button onClick={() => setShowRejectModal(true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button onClick={() => handleReview(selectedSubmission._id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </div>
                  )}
                  {selectedSubmission.status === 'approved' && (
                    <Button onClick={() => handleReview(selectedSubmission._id, 'submitted')} variant="outline" className="text-amber-600">
                      Revert Approval
                    </Button>
                  )}
                </div>

                {/* Courses Table */}
                <div className="flex-1 overflow-auto">
                  <table className="data-table border-t-0">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Credits</th>
                        <th>Est. Students</th>
                        <th>Groups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">No courses defined yet.</td></tr>
                      ) : (
                        courses.map(c => (
                          <tr key={c._id}>
                            <td className="font-mono font-bold text-ucc-crimson">{c.code}</td>
                            <td className="text-sm font-medium">{c.name} {c.isNew && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase">New</span>}</td>
                            <td className="capitalize">{c.courseType}</td>
                            <td>{c.creditHours}</td>
                            <td>{c.estimatedStudents}</td>
                            <td>{c.numberOfGroups}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRejectModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-institutional p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-red-600 text-lg mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Reject Submission
            </h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection. This will be sent to the department coordinator.</p>
            <textarea
              className="w-full form-input-institutional min-h-[100px] mb-4"
              placeholder="e.g. Missing lecturer assignments for CSC 101, please fix and resubmit."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button onClick={() => handleReview(selectedSubmission._id, 'rejected', rejectReason)} className="bg-red-600 hover:bg-red-700 text-white">
                Confirm Rejection
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SubmissionReviewDashboard;
