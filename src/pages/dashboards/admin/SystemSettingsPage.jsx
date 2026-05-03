import React from 'react';
import { Settings, Shield, Database, Globe } from 'lucide-react';

const SystemSettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="card-institutional p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-ucc-crimson" />
          <h3 className="font-heading font-bold text-ucc-navy text-lg">System Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="form-label">Platform Name</label>
              <input type="text" defaultValue="ClassEase" className="form-input-institutional" readOnly />
            </div>
            <div>
              <label className="form-label">Institution</label>
              <input type="text" defaultValue="University of Cape Coast" className="form-input-institutional" readOnly />
            </div>
            <div>
              <label className="form-label">Academic Year</label>
              <input type="text" defaultValue="2025/2026" className="form-input-institutional" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">Contact Email</label>
              <input type="email" defaultValue="admin@ucc.edu.gh" className="form-input-institutional" />
            </div>
            <div>
              <label className="form-label">Max Booking Duration (hours)</label>
              <input type="number" defaultValue="4" className="form-input-institutional" />
            </div>
            <div>
              <label className="form-label">Auto-approve Bookings</label>
              <select className="form-input-institutional">
                <option value="false">No — Require manager approval</option>
                <option value="true">Yes — Auto-approve all</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-institutional p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-ucc-crimson" />
            <h4 className="font-semibold text-ucc-navy text-sm">Security</h4>
          </div>
          <p className="text-xs text-gray-500">JWT-based authentication. Tokens expire after 7 days.</p>
        </div>
        <div className="card-institutional p-5">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-ucc-crimson" />
            <h4 className="font-semibold text-ucc-navy text-sm">Database</h4>
          </div>
          <p className="text-xs text-gray-500">MongoDB Atlas. Data is preserved across deployments.</p>
        </div>
        <div className="card-institutional p-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-ucc-crimson" />
            <h4 className="font-semibold text-ucc-navy text-sm">API</h4>
          </div>
          <p className="text-xs text-gray-500">REST API hosted on Render with CORS protection.</p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;