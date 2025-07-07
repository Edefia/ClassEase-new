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
import BookVenuePage from '@/pages/dashboards/shared/BookVenuePage';
import MyBookingsPage from '@/pages/dashboards/shared/MyBookingsPage';
import CampusMapPage from '@/pages/dashboards/shared/CampusMapPage';
import ManageBookingsPage from '@/pages/dashboards/manager/ManageBookingsPage';
import AnalyticsPage from '@/pages/dashboards/admin/AnalyticsPage';
import UserManagementPage from '@/pages/dashboards/admin/UserManagementPage';
import SystemSettingsPage from '@/pages/dashboards/admin/SystemSettingsPage';
import SendNotificationPage from '@/pages/dashboards/admin/SendNotificationPage';
import VenuesManagementPage from '@/pages/dashboards/admin/VenuesManagementPage';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="loading-spinner-large border-primary"></div>
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

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Unauthorized Page
const UnauthorizedPage = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="min-h-screen flex items-center justify-center bg-background text-foreground"
  >
    <div className="text-center p-8 bg-card rounded-xl shadow-2xl">
      <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
      <p className="text-muted-foreground mb-8">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300"
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
                  
                  {/* Protected Dashboard Route */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Shared Dashboard Routes */}
                  <Route path="/dashboard/book" element={<ProtectedRoute><BookVenuePage /></ProtectedRoute>} />
                  <Route path="/dashboard/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/map" element={<ProtectedRoute><CampusMapPage /></ProtectedRoute>} />

                  {/* Role-specific Routes */}
                  <Route 
                    path="/dashboard/student" 
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/lecturer" 
                    element={
                      <ProtectedRoute allowedRoles={['lecturer']}>
                        <LecturerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/manager" 
                    element={
                      <ProtectedRoute allowedRoles={['manager']}>
                        <ManagerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                   <Route 
                    path="/dashboard/manage" 
                    element={
                      <ProtectedRoute allowedRoles={['manager', 'admin']}>
                        <ManageBookingsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/admin" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/analytics" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <AnalyticsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/users" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <UserManagementPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/settings" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <SystemSettingsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/dashboard/send-notification"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <SendNotificationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/dashboard/venues" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <VenuesManagementPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Catch all route */}
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