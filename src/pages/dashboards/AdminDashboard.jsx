import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building, Settings, Shield, Activity, BarChart3, BellPlus, Menu, X, User, Bell, LogOut 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import UserManagementPage from './admin/UserManagementPage';
import AnalyticsPage from './admin/AnalyticsPage';
import SystemSettingsPage from './admin/SystemSettingsPage';
import SendNotificationPage from './admin/SendNotificationPage';
import  Tooltip  from '@/components/ui/tooltip';
import VenuesManagementPage from './admin/VenuesManagementPage';
import DepartmentManagementPage from './admin/DepartmentManagementPage';
import BuildingManagementPage from './admin/BuildingManagementPage';
import API from '@/lib/api';

// Refactored Components (placeholders, implement in separate files)
const AdminOverviewTab = ({ stats, recentActivity, getActivityIcon, getActivityColor }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-card text-card-foreground border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-green-500 text-xs mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('from-', 'bg-').split(' ')[0]}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('from-', 'text-').split(' ')[0]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
                  <div className={`p-2 rounded-full bg-opacity-10 ${getActivityColor(activity.type).replace('text-', 'bg-')}`}>
                    <IconComponent className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">
                      {activity.action}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Database Status', value: 'Healthy', color: 'text-green-500', bgColor: 'bg-green-500/10' },
            { label: 'Server Load', value: 'Normal', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
            { label: 'Storage Usage', value: '68% Used', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
            { label: 'Last Backup', value: '2 hours ago', color: 'text-muted-foreground', isStatus: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted transition-colors">
              <span className="text-foreground text-sm">{item.label}</span>
              {item.isStatus !== false ? (
                <span className={`px-2 py-1 ${item.bgColor} ${item.color} rounded-full text-xs font-medium`}>
                  {item.value}
                </span>
              ) : (
                 <span className="text-muted-foreground text-sm">{item.value}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);


const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { venues, getBookingStats } = useBooking();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [venuesData, setVenuesData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [buildingsData, setBuildingsData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);

  useEffect(() => {
    setLoadingVenues(true);
    API.get('/venues').then(res => setVenuesData(res.data)).finally(() => setLoadingVenues(false));
    setLoadingUsers(true);
    API.get('/users').then(res => setUsersData(res.data)).finally(() => setLoadingUsers(false));
    setLoadingBuildings(true);
    API.get('/buildings').then(res => setBuildingsData(res.data)).finally(() => setLoadingBuildings(false));
    setLoadingDepartments(true);
    API.get('/departments').then(res => setDepartmentsData(res.data)).finally(() => setLoadingDepartments(false));
  }, []);

  const stats = getBookingStats();
  const totalUsers = 156; // Mock data, replace with actual API call
  const systemUptime = '99.9%'; // Mock data

  const dashboardStats = [
    { title: 'Total Users', value: totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500', change: '+15 this month' },
    { title: 'Total Bookings', value: stats.total, icon: BarChart3, color: 'from-green-500 to-emerald-500', change: '+23% this month' },
    { title: 'Active Venues', value: venues.length, icon: Building, color: 'from-purple-500 to-pink-500', change: '2 added recently' },
    { title: 'System Uptime', value: systemUptime, icon: Activity, color: 'from-orange-500 to-red-500', change: 'Last 30 days' }
  ];

  const recentActivity = [
    { action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
    { action: 'Booking approved', user: 'Jane Smith', time: '5 minutes ago', type: 'booking' },
    { action: 'Venue added', user: 'Admin', time: '1 hour ago', type: 'venue' },
    { action: 'System backup completed', user: 'System', time: '2 hours ago', type: 'system' },
    { action: 'User role updated', user: 'Mike Johnson', time: '3 hours ago', type: 'user' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return Users;
      case 'booking': return BarChart3;
      case 'venue': return Building;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user': return 'text-blue-500';
      case 'booking': return 'text-green-500';
      case 'venue': return 'text-purple-500';
      case 'system': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const adminQuickActions = [
    { label: "Manage Users", icon: Users, path: "/dashboard/users" },
    { label: "Manage Venues", icon: Building, path: "/dashboard/venues" }, // Assuming a /dashboard/venues page
    { label: "View Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    { label: "System Settings", icon: Settings, path: "/dashboard/settings" },
    { label: "Send Notification", icon: BellPlus, path: "/dashboard/send-notification" },
  ];

  return (
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col duration-300 ease-in-out lg:translate-x-0  lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Class Ease</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name}</p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                <p className="text-blue-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation in Sidebar */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('overview')}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Overview</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('users')}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Users</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'departments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('departments')}
            >
              <Building className="w-5 h-5" />
              <span className="font-medium">Departments</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'buildings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('buildings')}
            >
              <Building className="w-5 h-5" />
              <span className="font-medium">Buildings</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'venues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('venues')}
            >
              <Building className="w-5 h-5" />
              <span className="font-medium">Venues</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('analytics')}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </button>
            
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'send-notification' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('send-notification')}
            >
              <BellPlus className="w-5 h-5" />
              <span className="font-medium">Send Notification</span>
            </button>
            <button
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              onClick={() => setSelectedTab('settings')}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen max-h-screen overflow-y-auto flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            {/* Mobile/Tablet: App Logo/Name on left, Bell & Hamburger on right */}
            <div className="flex items-center w-full lg:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">ClassEase</span>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <Bell className="w-5 h-5 text-white" />
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-white hover:text-gray-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Desktop: Notifications on right */}
            {/* <div className="hidden lg:flex items-center space-x-2 text-white ml-auto">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
            </div> */}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 flex flex-col ">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border mb-5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
              <p className="text-muted-foreground mt-1">
                Welcome, {user?.name}. Oversee and manage the ClassEase platform.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
               <Button variant="outline" onClick={() => setSelectedTab('settings')}>
                <Settings className="w-4 h-4 mr-2" /> System Settings
              </Button>
              <Button onClick={() => setSelectedTab('send-notification')}>
                <BellPlus className="w-4 h-4 mr-2" /> Send Notification
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Only render the selected tab's content */}
        {selectedTab === 'overview' && (
            <AdminOverviewTab stats={dashboardStats} recentActivity={recentActivity} getActivityIcon={getActivityIcon} getActivityColor={getActivityColor} />
        )}
        {selectedTab === 'users' && (loadingUsers ? (<div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>) : <UserManagementPage />)}
        {selectedTab === 'departments' && (loadingDepartments ? (<div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>) : <DepartmentManagementPage />)}
        {selectedTab === 'buildings' && (loadingBuildings ? (<div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>) : <BuildingManagementPage />)}
        {selectedTab === 'venues' && (loadingVenues ? (<div className="flex justify-center items-center h-64"><div className="loading-spinner-large border-primary"></div></div>) : <VenuesManagementPage />)}
        {selectedTab === 'analytics' && <AnalyticsPage />}
        {selectedTab === 'settings' && <SystemSettingsPage />}
        {selectedTab === 'send-notification' && <SendNotificationPage />}

        {/* <Card className="bg-card text-card-foreground border-border shadow-lg mt-5">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {adminQuickActions.map(action => (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-2 text-center hover:bg-muted"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="w-6 h-6 mb-1 text-primary" />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card> */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;