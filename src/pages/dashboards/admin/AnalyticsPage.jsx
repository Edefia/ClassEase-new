import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Building, Clock, CheckCircle, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBooking } from '@/contexts/BookingContext';
import API from '@/lib/api';

const gradientCards = [
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-yellow-500 to-orange-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-purple-500',
  'from-pink-500 to-red-500',
];

const API_BASE = 'http://localhost:5000';
const PLACEHOLDER_IMAGE = '/placeholder.svg';

const AnalyticsPage = () => {
  const { getBookingStats, venues } = useBooking();
  const bookingStats = getBookingStats();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/users'),
      API.get('/departments'),
      API.get('/bookings'),
    ]).then(([usersRes, deptsRes, bookingsRes]) => {
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setBookings(bookingsRes.data);
      // Recent activity: last 5 bookings
      setRecentActivity(bookingsRes.data.slice(-5).reverse());
    }).finally(() => setLoading(false));
  }, []);

  // Most booked venue
  const mostBookedVenue = venues
    .map(venue => ({
      ...venue,
      bookings: bookings.filter(b => (b.venue?._id || b.venue) === venue._id).length
    }))
    .sort((a, b) => b.bookings - a.bookings)[0];

  // Most active user
  const mostActiveUser = users
    .map(u => ({
      ...u,
      bookings: bookings.filter(b => (b.user?._id || b.user) === u._id).length
    }))
    .sort((a, b) => b.bookings - a.bookings)[0];

  // Most active department
  const mostActiveDept = departments
    .map(d => ({
      ...d,
      bookings: bookings.filter(b => b.department === d._id).length
    }))
    .sort((a, b) => b.bookings - a.bookings)[0];

  // Peak booking hour (if available)
  let peakHour = null;
  if (bookings.length > 0) {
    const hourCounts = {};
    bookings.forEach(b => {
      if (b.timeStart) {
        const hour = b.timeStart.split(':')[0];
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peak = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (peak) {
      peakHour = `${peak[0]}:00 - ${parseInt(peak[0], 10) + 1}:00 (${peak[1]} bookings)`;
    }
  }

  // StatCard component
  const StatCard = ({ title, value, icon: Icon, gradient }) => (
    <Card className={`bg-gradient-to-br ${gradient} text-white shadow-lg transition-shadow`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="text-4xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-white/10">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-4"
      >
        Platform Analytics
      </motion.h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner-large border-primary"></div>
        </div>
      ) : (
        <>
          {/* Hero Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 w-full">
            <StatCard title="Total Bookings" value={bookingStats.total} icon={BarChart3} gradient={gradientCards[0]} />
            <StatCard title="Approved" value={bookingStats.approved} icon={CheckCircle} gradient={gradientCards[1]} />
            <StatCard title="Pending" value={bookingStats.pending} icon={Clock} gradient={gradientCards[2]} />
            <StatCard title="Venues" value={venues.length} icon={Building} gradient={gradientCards[3]} />
            <StatCard title="Users" value={users.length} icon={Users} gradient={gradientCards[4]} />
            <StatCard title="Departments" value={departments.length} icon={Building} gradient={gradientCards[5]} />
      </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Most Booked Venue</CardTitle>
              </CardHeader>
              <CardContent>
                {mostBookedVenue ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={mostBookedVenue.image
                        ? (mostBookedVenue.image.startsWith('/uploads')
                            ? `${API_BASE}${mostBookedVenue.image}`
                            : mostBookedVenue.image)
                        : PLACEHOLDER_IMAGE}
                      alt={mostBookedVenue.name}
                      className="w-32 h-20 object-cover rounded mb-2 border"
                      onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                    <div className="font-bold text-lg">{mostBookedVenue.name}</div>
                    <div className="text-white/80 text-sm">{mostBookedVenue.bookings} bookings</div>
                  </div>
                ) : <div className="text-white/70">No data</div>}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Most Active User</CardTitle>
              </CardHeader>
              <CardContent>
                {mostActiveUser ? (
                  <div className="flex flex-col items-center">
                    <User className="w-12 h-12 mb-2" />
                    <div className="font-bold text-lg">{mostActiveUser.name}</div>
                    <div className="text-white/80 text-sm">{mostActiveUser.bookings} bookings</div>
                  </div>
                ) : <div className="text-white/70">No data</div>}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Most Active Department</CardTitle>
              </CardHeader>
              <CardContent>
                {mostActiveDept ? (
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-12 h-12 mb-2" />
                    <div className="font-bold text-lg">{mostActiveDept.name}</div>
                    <div className="text-white/80 text-sm">{mostActiveDept.bookings} bookings</div>
                  </div>
                ) : <div className="text-white/70">No data</div>}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-400 text-white shadow-lg">
          <CardHeader>
                <CardTitle className="text-white">Peak Booking Hour</CardTitle>
          </CardHeader>
          <CardContent>
                {peakHour ? (
                  <div className="flex flex-col items-center">
                    <Clock className="w-12 h-12 mb-2" />
                    <div className="font-bold text-lg">{peakHour}</div>
                  </div>
                ) : <div className="text-white/70">No data</div>}
          </CardContent>
        </Card>
            <Card className="bg-gradient-to-br from-gray-800 to-gray-600 text-white shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <li className="text-white/70">No recent activity</li>
                  ) : recentActivity.map((b, idx) => (
                    <li key={b._id || idx} className="flex items-center gap-2 p-2 bg-white/10 rounded">
                      <span className="font-semibold">{users.find(u => (u._id === (b.user?._id || b.user)))?.name || 'User'}</span>
                      <span className="text-xs text-white/60">booked</span>
                      <span className="font-semibold">{venues.find(v => v._id === (b.venue?._id || b.venue))?.name || 'Venue'}</span>
                      <span className="text-xs text-white/60">on</span>
                      <span className="text-xs">{b.date ? new Date(b.date).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

          {/* Export Buttons */}
      <div className="pt-4 flex space-x-4">
        <Button variant="outline">Export as CSV</Button>
        <Button variant="outline">Export as PDF</Button>
      </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;