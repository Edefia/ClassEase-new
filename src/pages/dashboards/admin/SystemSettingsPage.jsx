import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; 
import { toast } from '@/components/ui/use-toast';
import { Settings, Bell, Database, Palette, Save, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

const SystemSettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    siteName: "ClassEase",
    maintenanceMode: false,
    defaultUserRole: "student",
    maxBookingDuration: 4, // hours
    allowWeekendBookings: true,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  const handleSaveChanges = () => {
    // In a real app, save these settings to Supabase (e.g., a 'system_settings' table)
    console.log("Saving settings:", settings);
    toast({
      title: "Settings Saved",
      description: "System settings have been updated.",
    });
  };

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-foreground"
      >
        Configure System Parameters
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Settings */}
          <Card className="lg:col-span-2 bg-card text-card-foreground border-border shadow-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Settings className="w-5 h-5 mr-2 text-primary" /> General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteName" className="text-foreground">Site Name</Label>
                <Input 
                  id="siteName" 
                  name="siteName"
                  value={settings.siteName} 
                  onChange={handleInputChange} 
                  className="mt-1 bg-background border-border focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceMode" className="text-foreground">Maintenance Mode</Label>
                <Switch 
                  id="maintenanceMode" 
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                />
              </div>
               <div>
                <Label htmlFor="defaultUserRole" className="text-foreground">Default New User Role</Label>
                <select 
                  id="defaultUserRole" 
                  name="defaultUserRole"
                  value={settings.defaultUserRole} 
                  onChange={handleInputChange} 
                  className="mt-1 block w-full p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Palette className="w-5 h-5 mr-2 text-primary" /> Theme Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">Select the application theme.</p>
              <div className="flex space-x-4">
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('light')}
                  className="flex-1"
                >
                  Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  onClick={() => handleThemeChange('dark')}
                  className="flex-1"
                >
                  Dark
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Booking Settings */}
        <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Calendar className="w-5 h-5 mr-2 text-primary" /> Booking Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="maxBookingDuration" className="text-foreground">Max Booking Duration (hours)</Label>
              <Input 
                type="number"
                id="maxBookingDuration" 
                name="maxBookingDuration"
                value={settings.maxBookingDuration} 
                onChange={handleInputChange} 
                min="1"
                className="mt-1 bg-background border-border focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allowWeekendBookings" className="text-foreground">Allow Weekend Bookings</Label>
              <Switch 
                id="allowWeekendBookings" 
                checked={settings.allowWeekendBookings}
                onCheckedChange={(checked) => handleSwitchChange('allowWeekendBookings', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings (Placeholder) */}
        <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Bell className="w-5 h-5 mr-2 text-primary" /> Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Email notification settings would go here (e.g., SMTP config).</p>
          </CardContent>
        </Card>

        {/* Database Settings (Placeholder) */}
        <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Database className="w-5 h-5 mr-2 text-primary" /> Database & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Database management and backup options.</p>
            <Button variant="outline">Trigger Manual Backup</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChanges} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" /> Save All Settings
          </Button>
        </div>
    </div>
  );
};

export default SystemSettingsPage;