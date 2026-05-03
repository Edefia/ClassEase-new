import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

const MySchedulePage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/semesters').then(r => { setSemesters(r.data); if (r.data.length > 0) setSelectedSemester(r.data[0]._id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    setLoading(true);
    API.get(`/timetable/semester/${selectedSemester}?status=published`)
      .then(r => setEntries(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSemester]);

  const lectureEntries = entries.filter(e => e.entryType !== 'exam');
  const periods = [...new Set(lectureEntries.map(e => e.timeStart))].sort();

  return (
    <DashboardLayout title="My Schedule" breadcrumbs={[{ label: 'My Schedule' }]}>
      <div className="flex items-center gap-3 mb-6">
        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="form-input-institutional w-auto text-sm">
          {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.academicYear}</option>)}
        </select>
        <span className="text-sm text-gray-400">{lectureEntries.length} sessions assigned</span>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div> : lectureEntries.length === 0 ? (
        <div className="card-institutional py-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-ucc-navy text-lg">No Schedule</h3>
          <p className="text-sm text-gray-400">Your teaching schedule will appear here once the timetable is published.</p>
        </div>
      ) : (
        <div className="card-institutional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr><th className="w-20 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Time</th>
                {DAYS.map(d => <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">{DAY_SHORT[d]}</th>)}</tr></thead>
              <tbody>
                {periods.map(time => (
                  <tr key={time}>
                    <td className="px-3 py-2 text-xs font-mono text-gray-500 border-r">{time}</td>
                    {DAYS.map(day => {
                      const cell = lectureEntries.filter(e => e.dayOfWeek === day && e.timeStart === time);
                      return (<td key={day} className="px-1 py-1 align-top min-w-[130px]">
                        {cell.map(e => (<div key={e._id} className="p-2 mb-1 rounded-lg bg-blue-50 border-l-4 border-l-ucc-navy">
                          <div className="text-xs font-bold text-ucc-navy font-mono">{e.course?.code}</div>
                          <div className="text-[10px] text-gray-500 truncate">{e.course?.name}</div>
                          <div className="text-[10px] text-gray-400 mt-1"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{e.venue?.name}</div>
                          <div className="text-[10px] text-gray-400"><Users className="w-2.5 h-2.5 inline mr-0.5" />{e.course?.expectedEnrollment} students</div>
                        </div>))}
                      </td>);
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySchedulePage;
