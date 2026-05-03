import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Zap, BookOpen, BarChart3, CheckCircle, AlertTriangle,
  XCircle, ChevronRight, MapPin, Users, ClipboardList, Play
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';

const AcademicAffairsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSemester, setActiveSemester] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [timetableStatus, setTimetableStatus] = useState(null);
  const [courses, setCourses] = useState([]);
  const [venues, setVenues] = useState([]);
  const [latestRuns, setLatestRuns] = useState([]);
  const [timeslotCount, setTimeslotCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [semRes, coursesRes, venuesRes, slotsRes] = await Promise.all([
          API.get('/semesters'),
          API.get('/courses'),
          API.get('/venues'),
          API.get('/timeslots'),
        ]);
        setSemesters(semRes.data);
        setCourses(coursesRes.data);
        setVenues(venuesRes.data);
        setTimeslotCount(slotsRes.data.length);

        // Find active semester
        const active = semRes.data.find((s) => s.status === 'active' || s.status === 'exam_period');
        setActiveSemester(active);

        if (active) {
          try {
            const statusRes = await API.get(`/timetable/semester/${active._id}/status`);
            setTimetableStatus(statusRes.data);
          } catch { /* no status */ }
          try {
            const runsRes = await API.get(`/scheduling/runs?semesterId=${active._id}`);
            setLatestRuns(runsRes.data.slice(0, 3));
          } catch { /* no runs */ }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const stats = [
    { title: 'Total Courses', value: courses.length, icon: BookOpen, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', link: '/dashboard/courses' },
    { title: 'Total Venues', value: venues.length, icon: MapPin, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { title: 'Time Slots', value: timeslotCount, icon: Clock, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', link: '/dashboard/timeslot-settings' },
    { title: 'Semesters', value: semesters.length, icon: Calendar, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', link: '/dashboard/semesters' },
  ];

  const getRunStatusIcon = (status) => {
    if (status === 'complete') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500 animate-spin" />;
  };

  return (
    <DashboardLayout title="Academic Affairs">
      {/* Welcome Banner */}
      <div className="card-institutional p-6 mb-6 border-l-4 border-l-ucc-navy">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-ucc-navy mb-1">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Academic Affairs — Manage scheduling, timetables, semesters, and academic operations.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/scheduling">
              <Button className="bg-ucc-navy hover:bg-ucc-navy-700 text-white gap-1.5">
                <Zap className="w-4 h-4" /> Scheduling Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : (
        <>
          {/* Stats */}
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
            {/* Active Semester & Timetable Status */}
            <div className="card-institutional p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-ucc-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-ucc-crimson" /> Active Semester
                </h3>
                <Link to="/dashboard/semesters" className="text-xs text-ucc-navy hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {activeSemester ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-ucc-navy">{activeSemester.name} {activeSemester.academicYear}</span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        activeSemester.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        activeSemester.status === 'exam_period' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>{activeSemester.status?.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activeSemester.startDate).toLocaleDateString()} — {new Date(activeSemester.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Timetable Status</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                      timetableStatus?.currentStatus === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      timetableStatus?.currentStatus === 'draft' ? 'bg-gray-200 text-gray-700' :
                      timetableStatus?.currentStatus === 'under_review' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-200 text-gray-500'
                    }`}>{timetableStatus?.currentStatus?.replace('_', ' ') || 'Not Generated'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Entries</span>
                    <span className="text-sm font-semibold text-ucc-navy">{timetableStatus?.counts?.total || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-3">No active semester.</p>
                  <Link to="/dashboard/semesters">
                    <Button size="sm" className="bg-ucc-navy text-white">Create Semester</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card-institutional p-5">
              <h3 className="font-heading font-bold text-ucc-navy mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-ucc-crimson" /> Quick Actions
              </h3>
              <div className="space-y-2">
                <Link to="/dashboard/scheduling" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Scheduling Panel</p>
                    <p className="text-xs text-gray-400">Generate and manage timetables</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link to="/dashboard/semesters" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Semester Management</p>
                    <p className="text-xs text-gray-400">Configure academic periods and exam dates</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link to="/dashboard/timeslot-settings" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Time Slot Settings</p>
                    <p className="text-xs text-gray-400">Define periods for the scheduling engine</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link to="/dashboard/courses" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ucc-navy">Course Management</p>
                    <p className="text-xs text-gray-400">View and manage all courses</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Scheduling Runs */}
          <div className="card-institutional p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-ucc-navy flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-ucc-crimson" /> Recent Scheduling Runs
              </h3>
              <Link to="/dashboard/scheduling" className="text-xs text-ucc-navy hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {latestRuns.length === 0 ? (
              <div className="text-center py-8">
                <Play className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">No scheduling runs yet.</p>
                <Link to="/dashboard/scheduling">
                  <Button size="sm" className="bg-ucc-navy text-white gap-1"><Zap className="w-3.5 h-3.5" /> Go to Scheduling Panel</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {latestRuns.map((run) => (
                  <div key={run._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    {getRunStatusIcon(run.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ucc-navy">
                        {run.runType === 'lecture' ? 'Lecture' : 'Exam'} Schedule — v{run.version}
                      </p>
                      <p className="text-xs text-gray-400">
                        {run.status === 'complete' && `${run.placementRate}% placed • `}
                        {new Date(run.ranAt).toLocaleString()}
                      </p>
                    </div>
                    {run.status === 'complete' && (
                      <div className="text-right">
                        <span className="text-sm font-bold text-ucc-navy">{run.summary?.totalSessionsPlaced || 0}</span>
                        <span className="text-xs text-gray-400 ml-1">entries</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AcademicAffairsDashboard;
