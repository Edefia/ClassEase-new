import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { BellPlus, Send, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

// --- Mock Data ---
const mockUsers = [
  { auth_id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
  { auth_id: 'user-2', name: 'Bob Williams', email: 'bob@example.com' },
  { auth_id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com' },
  { auth_id: 'user-4', name: 'Diana Miller', email: 'diana@example.com' },
];
// --- End Mock Data ---

const SendNotificationPage = () => {
  const { addNotification, sendNotificationToAll, isLoading: notificationsLoading } = useNotifications();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipientType, setRecipientType] = useState('all'); // 'all' or 'specific'
  const [specificUserId, setSpecificUserId] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  React.useEffect(() => {
    const fetchUsersForDropdown = () => {
      if (recipientType === 'specific') {
        // TODO: Replace with your actual API call to fetch users
        console.log('Fetching users for dropdown...');
        setTimeout(() => {
          setAllUsers(mockUsers);
        }, 300);
      } else {
        setAllUsers([]);
      }
    };
    fetchUsersForDropdown();
  }, [recipientType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ title: "Validation Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }

    let result;
    if (recipientType === 'all') {
      // This function is already mocked in NotificationContext
      result = await sendNotificationToAll(title, message, type);
    } else {
      if (!specificUserId) {
        toast({ title: "Validation Error", description: "Please select a specific user.", variant: "destructive" });
        return;
      }
      // This function is already mocked in NotificationContext
      result = await addNotification({
        user_id: specificUserId,
        title,
        message,
        type,
      });
    }

    if (result?.success) {
      setTitle('');
      setMessage('');
      setType('info');
      setSpecificUserId('');
    }
  };

  return (
    <DashboardLayout title="Send Notification">
      <div className="space-y-6 max-w-2xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-foreground flex items-center"
        >
          <BellPlus className="w-6 h-6 mr-2 text-primary" /> Compose Notification
        </motion.h1>

        <Card className="bg-card text-card-foreground border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">Notification Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="recipientType" className="text-foreground">Recipient</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="all"><Users className="w-4 h-4 mr-2 inline-block" />All Users</SelectItem>
                    <SelectItem value="specific"><User className="w-4 h-4 mr-2 inline-block" />Specific User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'specific' && (
                <div>
                  <Label htmlFor="specificUserId" className="text-foreground">Select User</Label>
                  <Select value={specificUserId} onValueChange={setSpecificUserId}>
                    <SelectTrigger className="w-full mt-1 bg-background border-border focus:border-primary">
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border max-h-60">
                      {allUsers.length > 0 ? allUsers.map(u => (
                        <SelectItem key={u.auth_id} value={u.auth_id}>{u.name} ({u.email})</SelectItem>
                      )) : <SelectItem value="" disabled>Loading users...</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="title" className="text-foreground">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Notification Title"
                  className="mt-1 bg-background border-border focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-foreground">Message</Label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Enter your notification message here..."
                  className="mt-1 bg-background border-border focus:border-primary min-h-[120px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-foreground">Notification Type</Label>
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
              
              <Button type="submit" disabled={notificationsLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {notificationsLoading ? (
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
    </DashboardLayout>
  );
};

export default SendNotificationPage;