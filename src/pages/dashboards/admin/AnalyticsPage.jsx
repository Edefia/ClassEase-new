import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Building, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBooking } from '@/contexts/BookingContext'; // Assuming this provides some stats

const AnalyticsPage = () => {
  const { getBookingStats, venues } = useBooking();
  const bookingStats = getBookingStats();
  // Mock data for other analytics
  const peakBookingTimes = [
    { time: "09:00 - 11:00", count: 150 },
    { time: "14:00 - 16:00", count: 120 },
    { time: "11:00 - 13:00", count: 90 },
  ];
  const mostActiveUsers = [
    { name: "John Doe", bookings: 25 },
    { name: "Jane Smith", bookings: 22 },
    { name: "Computer Science Dept", bookings: 18 }, // Could be department or user
  ];

  const bookingsPerVenue = venues.map(venue => ({
    name: venue.name,
    bookings: Math.floor(Math.random() * 50) + 10 // Mock data
  })).sort((a,b) => b.bookings - a.bookings).slice(0,5);


  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="bg-card text-card-foreground border-border shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-foreground"
        >
          Platform Analytics
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Bookings" value={bookingStats.total} icon={BarChart3} color="text-primary" />
          <StatCard title="Approved Bookings" value={bookingStats.approved} icon={CheckCircle} color="text-green-500" />
          <StatCard title="Pending Bookings" value={bookingStats.pending} icon={Clock} color="text-yellow-500" />
          <StatCard title="Total Venues" value={venues.length} icon={Building} color="text-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card text-card-foreground border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Bookings per Venue (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {bookingsPerVenue.map(item => (
                  <li key={item.name} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <span className="font-semibold text-primary">{item.bookings} bookings</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Peak Booking Times</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {peakBookingTimes.map(item => (
                  <li key={item.time} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-foreground">{item.time}</span>
                    <span className="font-semibold text-primary">{item.count} bookings</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card text-card-foreground border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">Most Active Users/Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mostActiveUsers.map(item => (
                <li key={item.name} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="font-semibold text-primary">{item.bookings} bookings</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Placeholder for export buttons */}
        <div className="pt-4 flex space-x-4">
            <Button variant="outline">Export as CSV</Button>
            <Button variant="outline">Export as PDF</Button>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;