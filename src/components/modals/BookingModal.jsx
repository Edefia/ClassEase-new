
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, Building, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useBooking } from '@/contexts/BookingContext';
import { toast } from '@/components/ui/use-toast';
import API from '@/lib/api';

const API_BASE_URL = 'https://classease-new.onrender.com';

const BookingModal = ({ isOpen, onClose, initialVenueId, initialBuildingId }) => {
  const { venues, createBooking, isLoading, bookings } = useBooking();
  const [buildings, setBuildings] = useState([]);
  const [formData, setFormData] = useState({
    buildingId: '',
    venueId: initialVenueId || '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    recurrence: 'once',
    weeks: 1
  });
  const [errors, setErrors] = useState({});
  const [overlapError, setOverlapError] = useState('');

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await API.get('/buildings');
        setBuildings(res.data);
      } catch (err) {
        setBuildings([]);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (initialVenueId && initialBuildingId) {
      setFormData(prev => ({ ...prev, buildingId: initialBuildingId, venueId: initialVenueId }));
    } else if (initialVenueId) {
      const venue = venues.find(v => v._id === initialVenueId || v.id === initialVenueId);
      if (venue && venue.building && (venue.building._id || venue.building.id)) {
        setFormData(prev => ({ ...prev, buildingId: venue.building._id || venue.building.id, venueId: initialVenueId }));
      } else {
        setFormData(prev => ({ ...prev, venueId: initialVenueId }));
      }
    } else if (initialBuildingId) {
      setFormData(prev => ({ ...prev, buildingId: initialBuildingId }));
    }
  }, [initialVenueId, initialBuildingId, venues]);

  const handleChange = (name, value) => {
    setFormData(prev => {
      if (name === 'buildingId') {
        return { ...prev, buildingId: value, venueId: '' };
      }
      return { ...prev, [name]: value };
    });
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (name === 'recurrence' && value === 'once') {
      setFormData(prev => ({ ...prev, weeks: 1 }));
    }
  };

  const getBookingDates = () => {
    if (formData.recurrence === 'once') {
      return [formData.date];
    }
    const dates = [];
    let current = new Date(formData.date);
    for (let i = 0; i < Number(formData.weeks); i++) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }
    return dates;
  };

  const hasConflict = () => {
    const dates = getBookingDates();
    return dates.some(date => {
      return bookings.some(b =>
        b.venue_id === formData.venueId &&
        b.date === date &&
        ((formData.startTime < b.end_time && formData.endTime > b.start_time))
      );
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.buildingId) newErrors.buildingId = 'Please select a building';
    if (!formData.venueId) newErrors.venueId = 'Please select a venue';
    if (!formData.date) newErrors.date = 'Please select a date';
    else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) newErrors.date = 'Cannot book venues for past dates';
    }
    if (!formData.startTime) newErrors.startTime = 'Please select start time';
    if (!formData.endTime) newErrors.endTime = 'Please select end time';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) newErrors.endTime = 'End time must be after start time';
    if (!formData.purpose.trim()) newErrors.purpose = 'Please describe the purpose of booking';
    if (formData.recurrence === 'weekly' && (!formData.weeks || isNaN(formData.weeks) || formData.weeks < 1)) {
      newErrors.weeks = 'Enter a valid number of weeks';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOverlapError('');
    if (!validateForm()) return;
    if (hasConflict()) {
      setOverlapError('This venue is already booked for one or more of the selected dates/times. Please choose a different time or venue.');
      return;
    }
    const dates = getBookingDates();
    let result;
    if (formData.recurrence === 'weekly') {
      const bookingsArr = dates.map(date => ({
        ...formData,
        date
      }));
      result = await createBooking(bookingsArr);
    } else {
      result = await createBooking(formData);
    }
    if (result.success) {
      setFormData({
        buildingId: '',
        venueId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        recurrence: 'once',
        weeks: 1
      });
      onClose();
    } else if (result.error) {
      setOverlapError(result.error);
    }
  };

  const selectedVenue = venues.find(v => v._id === formData.venueId);

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
      <DialogContent
        className="dashboard-card border-0 w-[95vw] max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100 scrollbar-thumb-rounded-lg mx-auto"
        style={{ scrollbarColor: '#3b82f6 #dbeafe', scrollbarWidth: 'thin' }}
        aria-describedby="booking-modal-desc"
      >
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl sm:text-2xl font-bold">
            Book a Venue
          </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-sm">Available for booking</span>
              </div>
            </div>
          </div>
          
          <DialogDescription id="booking-modal-desc" className="text-white/80 text-sm sm:text-base leading-relaxed">
            Fill out the form below to book a venue. Please check for any fixed weekly bookings before submitting.
          </DialogDescription>
          
          {/* Simple divider line */}
          <div className="mt-4 h-px bg-white/10"></div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-2 sm:px-0 pb-6"
        >
          {/* Building and Venue Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Select Building
              </Label>
            <Select value={formData.buildingId} onValueChange={(value) => handleChange('buildingId', value)}>
                <SelectTrigger className={`form-input mt-2 h-12 text-base ${errors.buildingId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Choose a building" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {buildings.map((building) => (
                    <SelectItem key={building._id} value={building._id} className="text-white hover:bg-gray-700 text-base py-3">
                      {building.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
              {errors.buildingId && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.buildingId}
                </p>
              )}
          </div>

            <div>
              <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Select Venue
              </Label>
            <Select value={formData.venueId} onValueChange={(value) => handleChange('venueId', value)} disabled={!formData.buildingId}>
                <SelectTrigger className={`form-input mt-2 h-12 text-base ${errors.venueId ? 'border-red-500' : ''}`} disabled={!formData.buildingId}>
                  <SelectValue placeholder={formData.buildingId ? "Choose a venue" : "Select a building first"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {venues.filter(v => v.building && v.building._id === formData.buildingId).map((venue) => (
                    <SelectItem key={venue._id} value={venue._id} className="text-white hover:bg-gray-700 text-base py-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-sm text-gray-400">Capacity: {venue.capacity}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              {errors.venueId && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.venueId}
                </p>
              )}
            </div>
          </div>

          {/* Venue Preview */}
          {selectedVenue && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" 
                  alt={`${selectedVenue.name} venue`} 
                  src={selectedVenue.image && selectedVenue.image.startsWith('/uploads') ? `${API_BASE_URL}${selectedVenue.image}` : selectedVenue.image} 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg">{selectedVenue.name}</h3>
                  <p className="text-white/70 text-sm mb-2">{selectedVenue.location}</p>
                  <div className="flex items-center gap-4 text-white/60 text-sm mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedVenue.capacity} capacity
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {selectedVenue.type || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVenue.amenities?.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  {Array.isArray(selectedVenue.defaultWeeklyBookings) && selectedVenue.defaultWeeklyBookings.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-white/80 text-xs font-semibold mb-1">Fixed Weekly Bookings:</h4>
                      <ul className="text-white/70 text-xs space-y-1">
                        {selectedVenue.defaultWeeklyBookings.map((booking, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{booking.dayOfWeek}:</span>
                            <span>{booking.timeSlotStart} - {booking.timeSlotEnd}</span>
                            <span className="italic text-white/50">({booking.reservedFor})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Date and Time Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => handleChange('date', e.target.value)} 
                  className={`form-input pl-12 h-12 text-base ${errors.date ? 'border-red-500' : ''}`} 
                  min={new Date().toISOString().split('T')[0]} 
                />
              </div>
              {errors.date && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.date}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </Label>
              <Select value={formData.startTime} onValueChange={(value) => handleChange('startTime', value)}>
                  <SelectTrigger className={`form-input mt-2 h-12 text-base ${errors.startTime ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-48">
                  {timeOptions.map((time) => (
                      <SelectItem key={time} value={time} className="text-white hover:bg-gray-700 text-base py-3">
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                {errors.startTime && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.startTime}
                  </p>
                )}
            </div>

              <div>
                <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  End Time
                </Label>
              <Select value={formData.endTime} onValueChange={(value) => handleChange('endTime', value)}>
                  <SelectTrigger className={`form-input mt-2 h-12 text-base ${errors.endTime ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-48">
                  {timeOptions.map((time) => (
                      <SelectItem key={time} value={time} className="text-white hover:bg-gray-700 text-base py-3">
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                {errors.endTime && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recurrence Settings */}
          <div className="space-y-4">
            <div>
            <Label className="text-white/80 text-sm font-medium">Recurrence</Label>
            <Select value={formData.recurrence} onValueChange={v => handleChange('recurrence', v)}>
                <SelectTrigger className="form-input mt-2 h-12 text-base">
                  <SelectValue placeholder="Recurrence" />
                </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="once" className="text-white hover:bg-gray-700 text-base py-3">One Day Only</SelectItem>
                  <SelectItem value="weekly" className="text-white hover:bg-gray-700 text-base py-3">Weekly (Same day for N weeks)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.recurrence === 'weekly' && (
              <div>
              <Label className="text-white/80 text-sm font-medium">Number of Weeks</Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={formData.weeks} 
                  onChange={e => handleChange('weeks', e.target.value)} 
                  className={`form-input mt-2 h-12 text-base ${errors.weeks ? 'border-red-500' : ''}`} 
                  placeholder="e.g. 4" 
                />
                {errors.weeks && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.weeks}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <Label className="text-white/80 text-sm font-medium">Purpose of Booking</Label>
            <textarea 
              value={formData.purpose} 
              onChange={(e) => handleChange('purpose', e.target.value)} 
              className={`form-input w-full p-3 rounded-lg mt-2 min-h-[120px] resize-none text-base ${errors.purpose ? 'border-red-500' : ''}`} 
              placeholder="Describe the purpose of your booking (e.g., Computer Science Lecture, Student Meeting, etc.)" 
            />
            {errors.purpose && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.purpose}
              </p>
            )}
          </div>

          {/* Error Messages */}
          {overlapError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{overlapError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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