import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building, Settings, Activity, BarChart3, Bell, Shield, MapPin, BookOpen
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import UserManagementPage from './admin/UserManagementPage';
import AnalyticsPage from './admin/AnalyticsPage';
import SystemSettingsPage from './admin/SystemSettingsPage';
import SendNotificationPage from './admin/SendNotificationPage';
import VenuesManagementPage from './admin/VenuesManagementPage';
import DepartmentManagementPage from './admin/DepartmentManagementPage';
import BuildingManagementPage from './admin/BuildingManagementPage';
import CourseManagementPage from './admin/CourseManagementPage';
import API from '@/lib/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { venues, bookings } = useBooking();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [usersData, setUsersData] = useState([]);
  const [venuesData, setVenuesData] = useState([]);
  const [buildingsData, setBuildingsData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/venues').then((r) => setVenuesData(r.data)),
      API.get('/users').then((r) => setUsersData(r.data)),
      API.get('/buildings').then((r) => setBuildingsData(r.data)),
      API.get('/departments').then((r) => setDepartmentsData(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const totalUsers = usersData.length;
  const totalBookings = bookings?.length || 0;
  const activeVenues = venuesData.length;
  const totalBuildings = buildingsData.length;

  const dashboardStats = [
    { title: 'Total Users', value: totalUsers, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Total Bookings', value: totalBookings, icon: BarChart3, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'Active Venues', value: activeVenues, icon: MapPin, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { title: 'Buildings', value: totalBuildings, icon: Building, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  // Build recent activity from data
  const recentUsers = usersData.slice(-3).reverse().map((u) => ({
    action: 'New user registered',
    detail: u.name,
    time: new Date(u.createdAt).toLocaleDateString(),
    type: 'user',
  }));
  const recentBookingsActivity = (bookings || []).slice(-3).reverse().map((b) => ({
    action: `Booking ${b.status}`,
    detail: b.venue?.name || 'Unknown venue',
    time: new Date(b.createdAt).toLocaleDateString(),
    type: 'booking',
  }));
  const recentActivity = [...recentUsers, ...recentBookingsActivity]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);

  const getActivityIcon = (type) => {
    const map = { user: Users, booking: BarChart3, venue: Building, system: Settings };
    return map[type] || Activity;
  };

  const getActivityColor = (type) => {
    const map = { user: 'text-blue-600 bg-blue-50', booking: 'text-green-600 bg-green-50', venue: 'text-purple-600 bg-purple-50', system: 'text-amber-600 bg-amber-50' };
    return map[type] || 'text-gray-600 bg-gray-50';
  };

  // Admin tabs rendered as sub-content
  const tabs = [
    { value: 'overview', label: 'Overview', icon: Activity },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'buildings', label: 'Buildings', icon: Building },
    { value: 'venues', label: 'Venues', icon: MapPin },
    { value: 'departments', label: 'Departments', icon: Building },
    { value: 'courses', label: 'Courses', icon: BookOpen },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'send-notification', label: 'Notifications', icon: Bell },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <DashboardLayout title="System Administration">
      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-6 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTab === tab.value
                ? 'bg-ucc-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner-large" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.map((stat, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="stat-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="stat-card-label">{stat.title}</p>
                        <p className="stat-card-value">{stat.value}</p>
                      </div>
                      <div className={`stat-card-icon ${stat.iconBg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Two column grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="card-institutional p-5">
                  <h3 className="font-heading font-bold text-ucc-navy mb-4">Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-400 text-sm">No recent activity.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, i) => {
                        const Icon = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ucc-navy">{activity.action}</p>
                              <p className="text-xs text-gray-500 truncate">{activity.detail} • {activity.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pending Bookings */}
                <div className="card-institutional p-5">
                  <h3 className="font-heading font-bold text-ucc-navy mb-4">Pending Requests</h3>
                  {(() => {
                    const pending = (bookings || []).filter((b) => b.status === 'pending').slice(0, 5);
                    if (pending.length === 0) return <p className="text-gray-400 text-sm">No pending requests.</p>;
                    return (
                      <div className="space-y-3">
                        {pending.map((b) => (
                          <div key={b._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                            <div>
                              <p className="text-sm font-medium text-ucc-navy">{b.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{b.venue?.name} • {b.date ? new Date(b.date).toLocaleDateString() : ''}</p>
                            </div>
                            <span className="badge badge-pending">Pending</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Other Tabs */}
      {selectedTab === 'users' && <UserManagementPage />}
      {selectedTab === 'buildings' && <BuildingManagementPage />}
      {selectedTab === 'venues' && <VenuesManagementPage />}
      {selectedTab === 'departments' && <DepartmentManagementPage />}
      {selectedTab === 'courses' && <CourseManagementPage />}
      {selectedTab === 'analytics' && <AnalyticsPage />}
      {selectedTab === 'send-notification' && <SendNotificationPage />}
      {selectedTab === 'settings' && <SystemSettingsPage />}
    </DashboardLayout>
  );
};

export default AdminDashboard;