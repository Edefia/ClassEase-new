import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import LecturerDashboard from '@/pages/dashboards/LecturerDashboard';
import ManagerDashboard from '@/pages/dashboards/ManagerDashboard';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import CoordinatorDashboard from '@/pages/dashboards/CoordinatorDashboard';
import AcademicAffairsDashboard from '@/pages/dashboards/AcademicAffairsDashboard';

// Shared pages
import BookVenuePage from '@/pages/dashboards/shared/BookVenuePage';
import MyBookingsPage from '@/pages/dashboards/shared/MyBookingsPage';
import FindVenuesPage from '@/pages/dashboards/shared/FindVenuesPage';
import CampusMapPage from '@/pages/dashboards/shared/CampusMapPage';
import NotificationsPage from '@/pages/dashboards/shared/NotificationsPage';
import VenueDetailPage from '@/pages/dashboards/shared/VenueDetailPage';

// Manager pages
import ManageBookingsPage from '@/pages/dashboards/manager/ManageBookingsPage';

// Admin sub-pages (standalone routes)
import AnalyticsPage from '@/pages/dashboards/admin/AnalyticsPage';
import UserManagementPage from '@/pages/dashboards/admin/UserManagementPage';
import SystemSettingsPage from '@/pages/dashboards/admin/SystemSettingsPage';
import SendNotificationPage from '@/pages/dashboards/admin/SendNotificationPage';
import VenuesManagementPage from '@/pages/dashboards/admin/VenuesManagementPage';
import BuildingManagementPage from '@/pages/dashboards/admin/BuildingManagementPage';
import DepartmentManagementPage from '@/pages/dashboards/admin/DepartmentManagementPage';
import CourseManagementPage from '@/pages/dashboards/admin/CourseManagementPage';
import DepartmentCourseSubmission from '@/pages/dashboards/coordinator/DepartmentCourseSubmission';
import TimetableManagementPage from '@/pages/dashboards/shared/TimetableManagementPage';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Scheduling pages
import SubmissionReviewDashboard from '@/pages/dashboards/admin/SubmissionReviewDashboard';
import SchedulingControlPanel from '@/pages/dashboards/admin/SchedulingControlPanel';
import SemesterManagementPage from '@/pages/dashboards/admin/SemesterManagementPage';
import TimeSlotSettingsPage from '@/pages/dashboards/admin/TimeSlotSettingsPage';
import MyTimetablePage from '@/pages/dashboards/student/MyTimetablePage';
import MySchedulePage from '@/pages/dashboards/lecturer/MySchedulePage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner-large"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dashboard Router — routes to the correct dashboard by role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'department_coordinator':
      return <CoordinatorDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'academic_affairs':
      return <AcademicAffairsDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Unauthorized Page
const UnauthorizedPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="min-h-screen flex items-center justify-center bg-background"
  >
    <div className="text-center p-8 card-institutional max-w-md">
      <h1 className="text-3xl font-heading font-bold text-ucc-crimson mb-4">Access Denied</h1>
      <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2.5 bg-ucc-navy text-white rounded-lg hover:bg-ucc-navy-600 transition-colors font-medium"
      >
        Go Back
      </button>
    </div>
  </motion.div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected Dashboard (role-based) */}
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

                  {/* Shared Routes (all authenticated users) */}
                  <Route path="/dashboard/book" element={<ProtectedRoute><BookVenuePage /></ProtectedRoute>} />
                  <Route path="/dashboard/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/venues" element={<ProtectedRoute><FindVenuesPage /></ProtectedRoute>} />
                  <Route path="/dashboard/map" element={<ProtectedRoute><DashboardLayout title="Campus Map"><CampusMapPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/venues/:id" element={<ProtectedRoute><VenueDetailPage /></ProtectedRoute>} />
                  <Route path="/dashboard/timetable" element={<ProtectedRoute><TimetableManagementPage /></ProtectedRoute>} />
                  <Route path="/dashboard/my-timetable" element={<ProtectedRoute><MyTimetablePage /></ProtectedRoute>} />
                  <Route path="/dashboard/my-schedule" element={<ProtectedRoute><MySchedulePage /></ProtectedRoute>} />

                  {/* Scheduling routes (admin / academic_affairs) */}
                  <Route path="/dashboard/submission-review" element={<ProtectedRoute allowedRoles={['admin', 'academic_affairs']}><SubmissionReviewDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/scheduling" element={<ProtectedRoute allowedRoles={['admin', 'academic_affairs']}><SchedulingControlPanel /></ProtectedRoute>} />
                  <Route path="/dashboard/semesters" element={<ProtectedRoute allowedRoles={['admin', 'academic_affairs']}><SemesterManagementPage /></ProtectedRoute>} />
                  <Route path="/dashboard/timeslot-settings" element={<ProtectedRoute allowedRoles={['admin', 'academic_affairs']}><TimeSlotSettingsPage /></ProtectedRoute>} />

                  {/* Role-specific dashboard routes */}
                  <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/lecturer" element={<ProtectedRoute allowedRoles={['lecturer', 'department_coordinator']}><LecturerDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

                  {/* Manager routes */}
                  <Route path="/dashboard/manage" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><DashboardLayout title="Manage Bookings"><ManageBookingsPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/venues-manage" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DashboardLayout title="Manage Venues"><VenuesManagementPage /></DashboardLayout></ProtectedRoute>} />

                  {/* Admin routes */}
                  <Route path="/dashboard/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout title="User Management"><UserManagementPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/buildings" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout title="Building Management"><BuildingManagementPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/departments" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout title="Department Management"><DepartmentManagementPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/courses" element={<ProtectedRoute allowedRoles={['admin', 'academic_affairs']}><DashboardLayout title="Course Management"><CourseManagementPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/department-courses" element={<ProtectedRoute allowedRoles={['department_coordinator']}><DepartmentCourseSubmission /></ProtectedRoute>} />
                  <Route path="/dashboard/analytics" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DashboardLayout title="Analytics"><AnalyticsPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout title="System Settings"><SystemSettingsPage /></DashboardLayout></ProtectedRoute>} />
                  <Route path="/dashboard/send-notification" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DashboardLayout title="Send Notification"><SendNotificationPage /></DashboardLayout></ProtectedRoute>} />

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <Toaster />
              </div>
            </Router>
          </NotificationProvider>
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;