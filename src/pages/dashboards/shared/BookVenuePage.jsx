import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FindVenuesPage from './FindVenuesPage';

// BookVenuePage wraps FindVenuesPage with embedded=true to prevent double DashboardLayout
const BookVenuePage = () => {
  return (
    <DashboardLayout title="Book a Venue" breadcrumbs={[{ label: 'Book Venue' }]}>
      <FindVenuesPage embedded />
    </DashboardLayout>
  );
};

export default BookVenuePage;