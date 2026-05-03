import React from 'react';
import { MapPin } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const CampusMapPage = () => {
  return (
    <DashboardLayout title="Campus Map" breadcrumbs={[{ label: 'Campus Map' }]}>
      <div className="card-institutional p-8">
        <div className="empty-state">
          <MapPin className="empty-state-icon" />
          <h3 className="empty-state-title">Campus Map</h3>
          <p className="empty-state-description">
            Interactive campus map with building locations and venue details will be available in a future update.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CampusMapPage;