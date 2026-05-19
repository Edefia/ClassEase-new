import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, ClipboardList, MapPin, Clock,
  AlertCircle, CheckCircle, BarChart3, Plus, ChevronRight, FileText
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import API from '@/lib/api';

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const { getUserBookings, venues } = useBooking();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timetableStatus, setTimetableStatus] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userBookings = getUserBookings(user?.id);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load courses for coordinator's department
        const coursesRes = await API.get('/courses');
        const deptCourses = coursesRes.data.filter(
          (c) => c.department?.name === user?.department || c.department?._id === user?.department
        );
        setCourses(deptCourses);

        // Try to get active semester
        try {
          const semRes = await API.get('/semesters/active');
          setActiveSemester(semRes.data);
          // Get timetable status for active semester
          if (semRes.data?._id) {
            const statusRes = await API.get(`/timetable/semester/${semRes.data._id}/status`);
            setTimetableStatus(statusRes.data);
            
            try {
              const subRes = await API.get(`/submissions/semester/${semRes.data._id}`);
              if (subRes.data && subRes.data.length > 0) {
                setSubmission(subRes.data[0]);
              }
            } catch (err) {
              console.log('No submission found');
            }
          }
        } catch { /* No active semester */ }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  const handleSubmitCourses = async () => {
    if (!activeSemester) return;
    if (!confirm("Are you sure you want to submit all department courses to Academic Affairs? You will not be able to edit them once submitted.")) return;
    
    setIsSubmitting(true);
    try {
      await API.post(`/submissions/semester/${activeSemester._id}/submit`);
      // refresh submission
      const subRes = await API.get(`/submissions/semester/${activeSemester._id}`);
      if (subRes.data && subRes.data.length > 0) {
        setSubmission(subRes.data[0]);
      }
      alert("Courses submitted successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Error submitting courses");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingBookings = userBookings.filter((b) => b.status === 'pending').length;
  const approvedBookings = userBookings.filter((b) => b.status === 'approved').length;
  const levels = [...new Set(courses.map((c) => c.level))].sort();

  const stats = [
    { title: 'Dept Courses', value: courses.length, icon: BookOpen, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', link: '/dashboard/courses' },
    { title: 'Course Levels', value: levels.length, icon: BarChart3, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
    { title: 'Pending Bookings', value: pendingBookings, icon: AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', link: '/dashboard/bookings' },
    { title: 'Approved Bookings', value: approvedBookings, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';

  return (
    <DashboardLayout title="Coordinator Dashboard">
      {/* Welcome Banner */}
      <div className="card-institutional p-6 mb-6 border-l-4 border-l-amber-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ucc-navy mb-1">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Department Coordinator — Manage your department's courses, timetable, and academic operations.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {user?.department && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {user.department}
                </span>
              )}
              {user?.staffId && <span>Staff ID: {user.staffId}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/courses">
              <Button className="bg-ucc-navy hover:bg-ucc-navy-700 text-white gap-1.5">
                <BookOpen className="w-4 h-4" /> Manage Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                {stat.link ? (
                  <Link to={stat.link} className="stat-card block hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="stat-card-label">{stat.title}</p>
                        <p className="stat-card-value">{stat.value}</p>
                      </div>
                      <div className={`stat-card-icon ${stat.iconBg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="stat-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="stat-card-label">{stat.title}</p>
                        <p className="stat-card-value">{stat.value}</p>
                      </div>
                      <div className={`stat-card-icon ${stat.iconBg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Timetable Status */}
            <div className="card-institutional p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-ucc-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-ucc-crimson" /> Timetable Status
                </h3>
                <Link to="/dashboard/timetable" className="text-xs text-ucc-navy hover:underline flex items-center gap-1">
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {activeSemester ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Semester</span>
                    <span className="text-sm font-semibold text-ucc-navy">{activeSemester.name} {activeSemester.academicYear}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Timetable</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                      timetableStatus?.currentStatus === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      timetableStatus?.currentStatus === 'draft' ? 'bg-gray-200 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {timetableStatus?.currentStatus?.replace('_', ' ') || 'Not Generated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Total Entries</span>
                    <span className="text-sm font-semibold text-ucc-navy">{timetableStatus?.counts?.total || 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No active semester configured.</p>
              )}
            </div>

            {/* Department Submission Status */}
            <div className="card-institutional p-5 border-t-4 border-t-ucc-navy">
              <h3 className="font-heading font-bold text-ucc-navy mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-ucc-crimson" /> Course Submission
              </h3>
              {activeSemester ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-ucc-navy">Current Status</span>
                      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                        submission?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        submission?.status === 'submitted' ? 'bg-blue-200 text-blue-800' :
                        submission?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {submission?.status?.replace('_', ' ') || 'Draft / Not Started'}
                      </span>
                    </div>
                    {submission?.status === 'rejected' && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                        <strong>Reason:</strong> {submission.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      {submission?.status === 'submitted' ? 'Your courses are currently under review by Academic Affairs.' :
                       submission?.status === 'approved' ? 'Your course submission has been approved for scheduling.' :
                       'Ensure all courses and lecturers are correctly assigned before submitting.'}
                    </p>
                  </div>
                  
                  {(!submission || submission.status === 'draft' || submission.status === 'rejected' || submission.status === 'not_started') && (
                    <Button 
                      className="w-full bg-ucc-navy hover:bg-ucc-navy-700 text-white" 
                      onClick={handleSubmitCourses}
                      disabled={isSubmitting || courses.length === 0}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Courses to Academic Affairs'}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No active semester configured.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card-institutional p-5">
              <h3 className="font-heading font-bold text-ucc-navy mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-ucc-crimson" /> Quick Actions
              </h3>
              <div className="space-y-2">
                <Link to="/dashboard/courses" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Manage Courses</p>
                    <p className="text-xs text-gray-400">Add, edit, or remove department courses</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link to="/dashboard/timetable" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Department Timetable</p>
                    <p className="text-xs text-gray-400">View and manage your department's schedule</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link to="/dashboard/book" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Book Venue</p>
                    <p className="text-xs text-gray-400">Reserve a venue for lectures or events</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Department Courses by Level */}
          <div className="card-institutional p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-ucc-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-ucc-crimson" /> Department Courses
              </h3>
              <Link to="/dashboard/courses">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <Plus className="w-3 h-3" /> Add Course
                </Button>
              </Link>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-400">No courses found for your department.</p>
            ) : (
              <div className="space-y-4">
                {levels.map((level) => {
                  const levelCourses = courses.filter((c) => c.level === level);
                  return (
                    <div key={level}>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Level {level} ({levelCourses.length} courses)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {levelCourses.map((c) => (
                          <div key={c._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-ucc-navy/5 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-ucc-navy font-mono">{c.creditHours}cr</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ucc-navy font-mono">{c.code}</p>
                              <p className="text-xs text-gray-500 truncate">{c.name}</p>
                              <p className="text-[10px] text-gray-400">{c.lecturer?.name || 'No lecturer'} • {c.expectedEnrollment} students</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default CoordinatorDashboard;
