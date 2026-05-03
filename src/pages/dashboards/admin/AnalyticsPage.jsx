import React from 'react';
import { BarChart3, TrendingUp, Calendar, Users } from 'lucide-react';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div className="card-institutional p-6 border-l-4 border-l-ucc-gold">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-ucc-crimson" />
          <h3 className="font-heading font-bold text-ucc-navy text-lg">Analytics Dashboard</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Advanced analytics with venue utilization, booking trends, and scheduling insights will be available in Phase 4.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-institutional p-5 text-center">
          <TrendingUp className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h4 className="font-heading font-bold text-ucc-navy">Venue Utilization</h4>
          <p className="text-gray-400 text-sm mt-1">Utilization rates per venue</p>
        </div>
        <div className="card-institutional p-5 text-center">
          <Calendar className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <h4 className="font-heading font-bold text-ucc-navy">Booking Trends</h4>
          <p className="text-gray-400 text-sm mt-1">Booking volume over time</p>
        </div>
        <div className="card-institutional p-5 text-center">
          <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <h4 className="font-heading font-bold text-ucc-navy">User Growth</h4>
          <p className="text-gray-400 text-sm mt-1">Registration trends</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;