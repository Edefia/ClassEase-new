import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, MapPin, Star, ChevronDown, ChevronUp, Clock, Monitor, Wifi, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';

const VenueSuggestionPanel = ({ onSelectVenue, date, timeStart, timeEnd, capacity, equipment }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (capacity) params.append('capacity', capacity);
      if (equipment) params.append('equipment', equipment);
      if (date) params.append('date', date);
      if (timeStart) params.append('timeStart', timeStart);
      if (timeEnd) params.append('timeEnd', timeEnd);

      const res = await API.get(`/venues/suggest?${params.toString()}`);
      setSuggestions(res.data);
    } catch (err) {
      setError('Could not load suggestions');
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Fetch whenever inputs change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [date, timeStart, timeEnd, capacity, equipment]);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent Match';
    if (score >= 40) return 'Good Match';
    return 'Partial Match';
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 hover:border-ucc-crimson/30 hover:bg-red-50/30 transition-colors w-full"
      >
        <Sparkles className="w-4 h-4 text-ucc-crimson" />
        <span className="text-sm font-medium text-gray-600">Show Smart Suggestions</span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-ucc-crimson/5 to-ucc-gold/10 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ucc-crimson" />
          <span className="text-sm font-heading font-bold text-ucc-navy">Smart Suggestions</span>
          <span className="text-xs text-gray-400">({suggestions.length} found)</span>
        </div>
        <button onClick={() => setExpanded(false)} className="p-1 hover:bg-white/50 rounded transition-colors">
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="loading-spinner mr-2" />
            <span className="text-sm text-gray-500">Finding best venues...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 py-4 text-center">{error}</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No venues match your criteria. Try adjusting capacity or equipment.</p>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {suggestions.slice(0, 6).map((venue, index) => (
              <motion.div
                key={venue._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectVenue(venue)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-ucc-navy/20 hover:bg-gray-50 cursor-pointer transition-all group"
              >
                {/* Rank */}
                <div className="w-7 h-7 rounded-full bg-ucc-navy/5 flex items-center justify-center flex-shrink-0 text-xs font-bold text-ucc-navy group-hover:bg-ucc-navy group-hover:text-white transition-colors">
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-ucc-navy truncate">{venue.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{venue.type}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {venue.capacity}
                    </span>
                    {venue.building?.name && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {venue.building.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${getScoreColor(venue.suggestionScore)}`}>
                  <Star className="w-3 h-3 inline mr-0.5" />
                  {venue.suggestionScore}%
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueSuggestionPanel;
