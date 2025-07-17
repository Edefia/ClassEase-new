import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { BellPlus, Send, Users, User, Building, Target, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import API from '@/lib/api';

const SendNotificationPage = () => {
  const { user } = useAuth();
  const { 
    addNotification, 
    sendNotificationToAll, 
    sendNotificationToBuilding,
    sendNotificationToRole,
    isLoading: notificationsLoading 
  } = useNotifications();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipientType, setRecipientType] = useState('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('announcement');
  const [link, setLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsersForDropdown();
    fetchBuildings();
  }, [recipientType, buildingId]);

  const fetchUsersForDropdown = async () => {
    if (recipientType === 'specific' || recipientType === 'building') {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (recipientType === 'building' && buildingId) {
          params.append('building_id', buildingId);
        }
        
        const response = await API.get(`/notifications/users?${params}`);
        setAllUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setAllUsers([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setAllUsers([]);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await API.get('/notifications/buildings');
      setAllBuildings(response.data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setAllBuildings([]);
    }
  };

  const getRecipientTypeOptions = () => {
    const options = [
      { value: 'all', label: 'All Users', icon: Users, description: 'Send to all users in the system' }
    ];

    if (user?.role === 'admin') {
      options.push(
        { value: 'specific', label: 'Specific User', icon: User, description: 'Send to a specific user' },
        { value: 'building', label: 'Building Users', icon: Building, description: 'Send to all users in a specific building' },
        { value: 'role', label: 'Role-based', icon: Target, description: 'Send to users with a specific role' }
      );
    } else if (user?.role === 'manager') {
      options.push(
        { value: 'building', label: 'My Buildings', icon: Building, description: 'Send to users in your assigned buildings' }
      );
    }

    return options;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ title: "Validation Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }

    let result;

    try {
      switch (recipientType) {
        case 'all':
          result = await sendNotificationToAll(title, message, type, link);
          break;
        
        case 'specific':
      if (!specificUserId) {
        toast({ title: "Validation Error", description: "Please select a specific user.", variant: "destructive" });
        return;
      }
      result = await addNotification({
        title,
        message,
        type,
            recipient_type: 'specific',
            recipients: [specificUserId],
            priority,
            category,
            link,
            expires_at: expiresAt || null
          });
          break;
        
        case 'building':
          if (!buildingId) {
            toast({ title: "Validation Error", description: "Please select a building.", variant: "destructive" });
            return;
          }
          result = await sendNotificationToBuilding(title, message, buildingId, type);
          break;
        
        case 'role':
          if (!roleFilter) {
            toast({ title: "Validation Error", description: "Please select a role.", variant: "destructive" });
            return;
          }
          result = await sendNotificationToRole(title, message, roleFilter, type);
          break;
        
        default:
          toast({ title: "Error", description: "Invalid recipient type.", variant: "destructive" });
          return;
    }

    if (result?.success) {
      setTitle('');
      setMessage('');
      setType('info');
      setSpecificUserId('');
        setBuildingId('');
        setRoleFilter('');
        setPriority('medium');
        setCategory('announcement');
        setLink('');
        setExpiresAt('');
        toast({ title: "Success", description: "Notification sent successfully!" });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.error || "Failed to send notification", 
        variant: "destructive" 
      });
    }
  };

  const recipientTypeOptions = getRecipientTypeOptions();

  return (
    <div className="space-y-8 w-full h-full max-w-4xl mx-auto px-0 md:px-2 py-4">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-foreground flex items-center"
      >
        <BellPlus className="w-6 h-6 mr-2 text-primary" /> Compose Notification
      </motion.h1>

      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Notification Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Type Selection */}
            <div>
              <Label className="text-foreground font-medium">Recipient Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {recipientTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setRecipientType(option.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      recipientType === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific User Selection */}
            {recipientType === 'specific' && (
              <div>
                <Label className="text-foreground">Select User</Label>
                <Select value={specificUserId} onValueChange={setSpecificUserId}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-60">
                    {isLoading ? (
                      <SelectItem value="" disabled>Loading users...</SelectItem>
                    ) : allUsers.length > 0 ? (
                      allUsers.map(user => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No users found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Building Selection */}
            {recipientType === 'building' && (
              <div>
                <Label className="text-foreground">Select Building</Label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Choose a building" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-60">
                    {allBuildings.length > 0 ? (
                      allBuildings.map(building => (
                        <SelectItem key={building._id} value={building._id}>
                          {building.name} - {building.location}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No buildings found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role Selection */}
            {recipientType === 'role' && (
              <div>
                <Label className="text-foreground">Select Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="lecturer">Lecturers</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title and Message */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label className="text-foreground">Title</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Notification Title"
                className="mt-1 bg-background border-border focus:border-primary"
                required
              />
              </div>
              <div>
                <Label className="text-foreground">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Message</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Enter your notification message here..."
                className="mt-1 bg-background border-border focus:border-primary min-h-[120px]"
                required
              />
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              </div>

              <div>
                <Label className="text-foreground">Expires At (Optional)</Label>
                <Input 
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1 bg-background border-border focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">Link (Optional)</Label>
              <Input 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                placeholder="https://example.com"
                className="mt-1 bg-background border-border focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Users can click on the notification to open this link
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={notificationsLoading || isLoading} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {notificationsLoading || isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Sending...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendNotificationPage;