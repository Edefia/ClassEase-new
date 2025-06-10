
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBooking } from '@/contexts/BookingContext';
import { toast } from '@/components/ui/use-toast';

const BookingModal = ({ isOpen, onClose }) => {
  const { venues, createBooking, isLoading } = useBooking();
  const [formData, setFormData] = useState({
    venueId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.venueId) {
      newErrors.venueId = 'Please select a venue';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Cannot book venues for past dates';
      }
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Please select start time';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'Please select end time';
    }
    
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Please describe the purpose of booking';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await createBooking(formData);
    
    if (result.success) {
      setFormData({
        venueId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: ''
      });
      onClose();
    }
  };

  const selectedVenue = venues.find(v => v.id === formData.venueId);

  // Generate time options
  const timeOptions = [];
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dashboard-card border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            Book a Venue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Venue Selection */}
          <div>
            <Label className="text-white/80 text-sm font-medium">
              Select Venue
            </Label>
            <Select value={formData.venueId} onValueChange={(value) => handleChange('venueId', value)}>
              <SelectTrigger className={`form-input mt-2 ${errors.venueId ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id} className="text-white hover:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-sm text-gray-400">{venue.location} • Capacity: {venue.capacity}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.venueId && (
              <p className="text-red-400 text-sm mt-1">{errors.venueId}</p>
            )}
          </div>

          {/* Selected Venue Info */}
          {selectedVenue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-start space-x-4">
                <img  
                  className="w-20 h-20 object-cover rounded-lg"
                  alt={`${selectedVenue.name} venue`}
                 src={selectedVenue.image} />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{selectedVenue.name}</h3>
                  <p className="text-white/70 text-sm mb-2">{selectedVenue.location}</p>
                  <div className="flex items-center space-x-4 text-white/60 text-sm">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {selectedVenue.capacity} capacity
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedVenue.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white/80 text-sm font-medium">
                Date
              </Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`form-input pl-12 ${errors.date ? 'border-red-500' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.date && (
                <p className="text-red-400 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <Label className="text-white/80 text-sm font-medium">
                Start Time
              </Label>
              <Select value={formData.startTime} onValueChange={(value) => handleChange('startTime', value)}>
                <SelectTrigger className={`form-input mt-2 ${errors.startTime ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-48">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startTime && (
                <p className="text-red-400 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <Label className="text-white/80 text-sm font-medium">
                End Time
              </Label>
              <Select value={formData.endTime} onValueChange={(value) => handleChange('endTime', value)}>
                <SelectTrigger className={`form-input mt-2 ${errors.endTime ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-48">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && (
                <p className="text-red-400 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <Label className="text-white/80 text-sm font-medium">
              Purpose of Booking
            </Label>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              className={`form-input w-full mt-2 min-h-[100px] resize-none ${errors.purpose ? 'border-red-500' : ''}`}
              placeholder="Describe the purpose of your booking (e.g., Computer Science Lecture, Student Meeting, etc.)"
            />
            {errors.purpose && (
              <p className="text-red-400 text-sm mt-1">{errors.purpose}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Booking...
                </div>
              ) : (
                'Submit Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
