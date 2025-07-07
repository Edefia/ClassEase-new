import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Mock Data ---
const mockUsers = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', student_id: null, staff_id: 'S001', created_at: new Date().toISOString(), department: { name: 'Administration' } },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', role: 'lecturer', student_id: null, staff_id: 'S002', created_at: new Date().toISOString(), department: { name: 'Computer Science' } },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'student', student_id: 'C123', staff_id: null, created_at: new Date().toISOString(), department: { name: 'Computer Science' } },
  { id: 'user-4', name: 'Diana Miller', email: 'diana@example.com', role: 'student', student_id: 'D456', staff_id: null, created_at: new Date().toISOString(), department: { name: 'Business Studies' } },
];

const mockDepartments = [
  { id: 'dept-1', name: 'Administration' },
  { id: 'dept-2', name: 'Computer Science' },
  { id: 'dept-3', name: 'Business Studies' },
  { id: 'dept-4', name: 'Engineering' },
];
// --- End Mock Data ---

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = () => {
    setIsLoading(true);
    // TODO: Replace with your actual API call
    setTimeout(() => {
      setUsers(mockUsers);
      setIsLoading(false);
    }, 500);
  };
  
  const fetchDepartments = () => {
    // TODO: Replace with your actual API call
    setDepartments(mockDepartments);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm) ||
    (user.department?.name && user.department.name.toLowerCase().includes(searchTerm))
  );

  const handleDeleteUser = (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This is a mock action.")) return;
    // TODO: Replace with your actual API call to delete a user
    console.log(`Deleting user ${userId}`);
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast({ title: "User Deleted", description: "User has been removed from the local list." });
  };

  return (
    <div className="space-y-8 w-full h-full px-0 md:px-2 py-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground">Manage Users</h1>
        <Button disabled className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-not-allowed">
          <UserPlus className="w-4 h-4 mr-2" /> Add New User (Disabled)
        </Button>
      </motion.div>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-foreground">All Users ({filteredUsers.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 bg-background border-border focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner-large border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Role</TableHead>
                    <TableHead className="text-foreground">Department</TableHead>
                    <TableHead className="text-foreground">Identifier</TableHead>
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{user.role}</TableCell>
                      <TableCell className="text-muted-foreground">{user.department?.name || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{user.student_id || user.staff_id || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user.id)} className="hover:bg-destructive/10 hover:border-destructive">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found matching your criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;