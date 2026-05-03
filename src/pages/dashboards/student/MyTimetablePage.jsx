import React, { useState, useEffect } from 'react';
import { Calendar, Download, Clock, MapPin, Users, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
const TYPE_BADGES = { lecture: 'bg-blue-100 text-blue-700', tutorial: 'bg-teal-100 text-teal-700', lab: 'bg-purple-100 text-purple-700', exam: 'bg-red-100 text-red-700' };

const MyTimetablePage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('lectures');

  useEffect(() => {
    API.get('/semesters').then(r => { setSemesters(r.data); if (r.data.length > 0) setSelectedSemester(r.data[0]._id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    setLoading(true);
    API.get(`/timetable/semester/${selectedSemester}?status=published`)
      .then(r => {
        // Filter by student's department if available
        let filtered = r.data;
        if (user?.department) {
          filtered = filtered.filter(e => e.department?.name === user.department || e.department?._id === user.department);
        }
        setEntries(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSemester, user]);

  const lectureEntries = entries.filter(e => e.entryType !== 'exam' && e.type !== 'exam');
  const examEntries = entries.filter(e => e.entryType === 'exam' || e.type === 'exam');
  const periods = [...new Set(entries.map(e => e.timeStart))].sort();

  return (
    <DashboardLayout title="My Timetable" breadcrumbs={[{ label: 'My Timetable' }]}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="form-input-institutional w-auto text-sm">
            {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.academicYear}</option>)}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('lectures')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${view === 'lectures' ? 'bg-white text-ucc-navy shadow-sm' : 'text-gray-500'}`}>Lectures</button>
            <button onClick={() => setView('exams')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${view === 'exams' ? 'bg-white text-ucc-navy shadow-sm' : 'text-gray-500'}`}>Exams</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : view === 'lectures' ? (
        lectureEntries.length === 0 ? (
          <div className="card-institutional py-16 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-ucc-navy text-lg">No Published Timetable</h3>
            <p className="text-sm text-gray-400">Your lecture timetable will appear here once published.</p>
          </div>
        ) : (
          <div className="card-institutional overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-20 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Time</th>
                    {DAYS.map(d => <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">{DAY_SHORT[d]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(time => (
                    <tr key={time}>
                      <td className="px-3 py-2 text-xs font-mono text-gray-500 border-r border-gray-100">{time}</td>
                      {DAYS.map(day => {
                        const cell = lectureEntries.filter(e => e.dayOfWeek === day && e.timeStart === time);
                        return (
                          <td key={day} className="px-1 py-1 align-top min-w-[130px]">
                            {cell.map(e => (
                              <div key={e._id} className="p-2 mb-1 rounded-lg bg-blue-50 border-l-4 border-l-ucc-navy">
                                <div className="text-xs font-bold text-ucc-navy font-mono">{e.course?.code}</div>
                                <div className="text-[10px] text-gray-500 truncate">{e.course?.name}</div>
                                <div className="text-[10px] text-gray-400 mt-1"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{e.venue?.name}</div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        examEntries.length === 0 ? (
          <div className="card-institutional py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-ucc-navy text-lg">No Exam Schedule</h3>
            <p className="text-sm text-gray-400">Your exam schedule will appear here once published.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {examEntries.sort((a, b) => new Date(a.examDate) - new Date(b.examDate)).map(e => (
              <div key={e._id} className="card-institutional p-4 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ucc-navy font-mono">{e.course?.code} — {e.course?.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />{e.examDate ? new Date(e.examDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '—'}
                      <span className="ml-3"><Clock className="w-3.5 h-3.5 inline mr-1" />{e.examTimeBlock === 'morning' ? 'Morning' : 'Afternoon'} ({e.timeStart}–{e.timeEnd})</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-500"><MapPin className="w-3.5 h-3.5 inline mr-1" />{(e.venues || [e.venue]).map(v => v?.name).filter(Boolean).join(', ')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default MyTimetablePage;
