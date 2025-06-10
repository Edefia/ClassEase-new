import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import BookingApprovalModal from '@/components/modals/BookingApprovalModal';

const ManageBookingsPage = () => {
  const { user } = useAuth();
  const { bookings, isLoading, fetchBookings } = useBooking();
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchBookings(); // Fetch all relevant bookings
  }, [fetchBookings]);

  useEffect(() => {
    let newFilteredBookings = [];
    if (activeTab === "pending") {
      newFilteredBookings = bookings.filter(b => b.status === 'pending');
    } else if (activeTab === "approved") {
      newFilteredBookings = bookings.filter(b => b.status === 'approved');
    } else if (activeTab === "declined") {
      newFilteredBookings = bookings.filter(b => b.status === 'declined');
    } else { // "all"
      newFilteredBookings = bookings;
    }
    setFilteredBookings(newFilteredBookings.sort((a, b) => parseISO(b.created_at) - parseISO(a.created_at)));
  }, [bookings, activeTab]);

  const handleReviewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowApprovalModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'declined':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center"><XCircle className="w-3 h-3 mr-1" />Declined</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  return (
    <DashboardLayout title="Manage Bookings">
      <div className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-foreground"
        >
          Booking Management
        </motion.h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted p-1 rounded-lg">
            <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Pending ({bookings.filter(b => b.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Approved</TabsTrigger>
            <TabsTrigger value="declined" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Declined</TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All Bookings</TabsTrigger>
          </TabsList>
        
          <TabsContent value={activeTab}>
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="loading-spinner-large border-primary"></div>
              </div>
            )}

            {!isLoading && filteredBookings.length === 0 && (
              <Card className="bg-card text-card-foreground border-border">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">No Bookings Found</h3>
                  <p className="text-muted-foreground mt-2">
                    There are no bookings matching the current filter.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && filteredBookings.length > 0 && (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="bg-card text-card-foreground border-border shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row justify-between items-start pb-2">
                        <CardTitle className="text-lg text-foreground">{booking.venueName || 'Venue Name Missing'}</CardTitle>
                        {getStatusBadge(booking.status)}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">Purpose: {booking.purpose}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <User className="w-4 h-4 mr-2 text-primary" />
                            Booked by: {booking.userName || 'N/A'}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                            Date: {format(parseISO(booking.date), 'PPP')}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2 text-primary" />
                            Time: {format(parseISO(`1970-01-01T${booking.start_time}Z`), 'p')} - {format(parseISO(`1970-01-01T${booking.end_time}Z`), 'p')}
                          </div>
                        </div>
                        {booking.status === 'declined' && booking.reason_if_declined && (
                          <p className="text-red-600 text-xs italic">Reason: {booking.reason_if_declined}</p>
                        )}
                        {booking.status === 'pending' && (user.role === 'manager' || user.role === 'admin') && (
                          <div className="pt-2">
                            <Button size="sm" onClick={() => handleReviewBooking(booking)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <Eye className="w-4 h-4 mr-1" /> Review
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BookingApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedBooking(null);
          fetchBookings(); // Re-fetch to update list after modal action
        }}
        booking={selectedBooking}
      />
    </DashboardLayout>
  );
};

export default ManageBookingsPage;