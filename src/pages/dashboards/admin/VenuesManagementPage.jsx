import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock venues data
const mockVenues = [
  { id: 'venue-1', name: 'Lecture Hall A', capacity: 120, location: 'Block 1', type: 'Lecture Hall', status: 'Active' },
  { id: 'venue-2', name: 'Auditorium', capacity: 300, location: 'Main Building', type: 'Auditorium', status: 'Active' },
  { id: 'venue-3', name: 'Lab 101', capacity: 40, location: 'Science Block', type: 'Lab', status: 'Inactive' },
  { id: 'venue-4', name: 'Seminar Room 2', capacity: 60, location: 'Block 2', type: 'Seminar Room', status: 'Active' },
];

const VenuesManagementPage = () => {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVenues(mockVenues);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6 w-full h-full px-0 md:px-2 py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <Building className="w-6 h-6 mr-2 text-primary" /> Venues Management
        </h1>
        <Button disabled className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-not-allowed">
          <Plus className="w-4 h-4 mr-2" /> Add New Venue (Disabled)
        </Button>
      </motion.div>
      <Card className="bg-card text-card-foreground border-border shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-foreground">All Venues ({venues.length})</CardTitle>
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
                    <TableHead className="text-foreground">Type</TableHead>
                    <TableHead className="text-foreground">Location</TableHead>
                    <TableHead className="text-foreground">Capacity</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.map(venue => (
                    <TableRow key={venue.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{venue.name}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.type}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.location}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.capacity}</TableCell>
                      <TableCell className="text-muted-foreground">{venue.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && venues.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No venues found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenuesManagementPage; 