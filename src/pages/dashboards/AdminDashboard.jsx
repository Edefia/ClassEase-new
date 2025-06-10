import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building, 
  Settings, 
  Shield,
  Activity,
  BarChart3,
  BellPlus
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useNavigate } from 'react-router-dom';

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
  const { user } = useAuth();
  const { venues, getBookingStats } = useBooking();
  const [selectedTab, setSelectedTab] = useState('overview');
  const navigate = useNavigate();

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
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
              <p className="text-muted-foreground mt-1">
                Welcome, {user?.name}. Oversee and manage the ClassEase platform.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
               <Button variant="outline" onClick={() => navigate("/dashboard/settings")}>
                <Settings className="w-4 h-4 mr-2" /> System Settings
              </Button>
              <Button onClick={() => navigate("/dashboard/send-notification")}>
                <BellPlus className="w-4 h-4 mr-2" /> Send Notification
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" onClick={() => navigate('/dashboard/users')} className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Users</TabsTrigger>
            <TabsTrigger value="venues" onClick={() => navigate('/dashboard/venues')} className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Venues</TabsTrigger>
            <TabsTrigger value="analytics" onClick={() => navigate('/dashboard/analytics')} className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab stats={dashboardStats} recentActivity={recentActivity} getActivityIcon={getActivityIcon} getActivityColor={getActivityColor} />
          </TabsContent>
          {/* Other tabs (Users, Venues, Analytics) will be separate page components navigated to via buttons/links */}
        </Tabs>
        
        <Card className="bg-card text-card-foreground border-border shadow-lg">
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
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;