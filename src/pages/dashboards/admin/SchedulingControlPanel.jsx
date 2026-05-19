import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Calendar, ChevronDown, AlertTriangle, CheckCircle, XCircle, Clock,
  BarChart3, Users, MapPin, Filter, Download, Trash2, Play, Eye, RefreshCw,
  ChevronRight, Edit2, X
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
const DEPT_COLORS = ['#1B3A6B', '#C9922A', '#2E7D52', '#7B2D8B', '#C0392B', '#1B6CA8', '#6B4226', '#2C7873'];
const TYPE_BADGES = {
  lecture: 'bg-blue-100 text-blue-700', tutorial: 'bg-teal-100 text-teal-700',
  lab: 'bg-purple-100 text-purple-700', exam: 'bg-red-100 text-red-700',
};
const STATUS_BADGES = {
  not_generated: { label: 'NOT GENERATED', cls: 'bg-gray-200 text-gray-600' },
  draft: { label: 'DRAFT', cls: 'bg-gray-200 text-gray-700' },
  under_review: { label: 'UNDER REVIEW', cls: 'bg-amber-100 text-amber-700' },
  published: { label: 'PUBLISHED', cls: 'bg-emerald-100 text-emerald-700' },
};

const SchedulingControlPanel = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [mode, setMode] = useState('semi_auto');
  const [timetableStatus, setTimetableStatus] = useState('not_generated');
  const [statusCounts, setStatusCounts] = useState({});
  const [entries, setEntries] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [clashReport, setClashReport] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClashReport, setShowClashReport] = useState(false);
  const [showAutoConfirm, setShowAutoConfirm] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(10);
  const [deptColorMap, setDeptColorMap] = useState({});
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editEntry, setEditEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preflight, setPreflight] = useState(null);
  const [showPreflight, setShowPreflight] = useState(false);
  const [generationType, setGenerationType] = useState('lecture');

  // Fetch semesters
  useEffect(() => {
    API.get('/semesters').then(r => { setSemesters(r.data); if (r.data.length > 0) setSelectedSemester(r.data[0]._id); }).catch(console.error);
    API.get('/timeslots').then(r => setTimeslots(r.data)).catch(console.error);
  }, []);

  // Fetch timetable data when semester changes
  const fetchTimetableData = useCallback(async () => {
    if (!selectedSemester) return;
    setLoading(true);
    try {
      const [statusRes, entriesRes] = await Promise.all([
        API.get(`/timetable/semester/${selectedSemester}/status`),
        API.get(`/timetable/semester/${selectedSemester}`),
      ]);
      setTimetableStatus(statusRes.data.currentStatus);
      setStatusCounts(statusRes.data.counts);
      setEntries(entriesRes.data);
      // Build dept color map
      const depts = [...new Set(entriesRes.data.map(e => e.department?.name).filter(Boolean))];
      const map = {};
      depts.forEach((d, i) => { map[d] = DEPT_COLORS[i % DEPT_COLORS.length]; });
      setDeptColorMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedSemester]);

  useEffect(() => { fetchTimetableData(); }, [fetchTimetableData]);

  // Handle generate click (runs preflight first)
  const handleGenerateClick = async (type = 'lecture') => {
    if (!selectedSemester) return;
    setGenerationType(type);
    
    if (mode === 'auto_pilot') { 
      setShowAutoConfirm(true); 
      setAutoCountdown(10); 
      return; 
    }
    
    // Run preflight check
    setIsGenerating(true);
    try {
      const res = await API.get(`/scheduling/preflight/${selectedSemester}`);
      setPreflight(res.data);
      setShowPreflight(true);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedGeneration = () => {
    setShowPreflight(false);
    triggerGeneration(generationType);
  };

  const triggerGeneration = async (type = 'lecture') => {
    setIsGenerating(true); setShowAutoConfirm(false);
    try {
      const endpoint = type === 'exam' ? '/scheduling/generate-exam' : '/scheduling/generate-lecture';
      const res = await API.post(endpoint, { semesterId: selectedSemester, mode });
      const runId = res.data.runId;
      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const runRes = await API.get(`/scheduling/run/${runId}`);
          if (runRes.data.status === 'complete' || runRes.data.status === 'failed') {
            clearInterval(poll);
            setRunResult(runRes.data);
            setShowClashReport(true);
            setIsGenerating(false);
            fetchTimetableData();
          }
        } catch { if (attempts > 30) { clearInterval(poll); setIsGenerating(false); } }
      }, 2000);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
      setIsGenerating(false);
    }
  };

  // Auto-pilot countdown
  useEffect(() => {
    if (!showAutoConfirm) return;
    if (autoCountdown <= 0) { triggerGeneration('lecture'); return; }
    const t = setTimeout(() => setAutoCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showAutoConfirm, autoCountdown]);

  // Lifecycle actions
  const handlePublish = async () => {
    try { await API.post(`/timetable/semester/${selectedSemester}/publish`); fetchTimetableData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const handleUnpublish = async () => {
    try { await API.post(`/timetable/semester/${selectedSemester}/unpublish`); fetchTimetableData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const handleBeginReview = async () => {
    try { await API.post(`/timetable/semester/${selectedSemester}/review`); fetchTimetableData(); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const handleClearDraft = async () => {
    if (!confirm('Delete all draft entries? This cannot be undone.')) return;
    try { await API.post(`/timetable/semester/${selectedSemester}/clear-draft`); fetchTimetableData(); setRunResult(null); setShowClashReport(false); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const handleDeleteEntry = async (id) => {
    try { await API.delete(`/timetable/${id}`); fetchTimetableData(); setEditEntry(null); }
    catch (e) { alert(e.response?.data?.error || e.message); }
  };

  // Build grid data
  const periods = [...new Set(timeslots.map(s => s.label))].sort();
  const periodTimes = {};
  timeslots.forEach(s => { if (!periodTimes[s.label]) periodTimes[s.label] = { start: s.startTime, end: s.endTime }; });

  const filteredEntries = entries.filter(e => {
    if (filterDept && e.department?.name !== filterDept) return false;
    if (filterType && e.entryType !== filterType && e.type !== filterType) return false;
    return true;
  });

  const getEntriesForCell = (period, day) => {
    const pt = periodTimes[period];
    if (!pt) return [];
    return filteredEntries.filter(e => e.dayOfWeek === day && e.timeStart === pt.start);
  };

  const deptList = [...new Set(entries.map(e => e.department?.name).filter(Boolean))];
  const sem = semesters.find(s => s._id === selectedSemester);
  const badge = STATUS_BADGES[timetableStatus] || STATUS_BADGES.not_generated;

  return (
    <DashboardLayout title="Scheduling Control Panel" breadcrumbs={[{ label: 'Scheduling' }]}>
      {/* ZONE 1 — Controls */}
      <div className="card-institutional p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedSemester || ''} onChange={e => setSelectedSemester(e.target.value)} className="form-input-institutional w-auto text-sm font-medium">
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.academicYear}</option>)}
          </select>
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide ${badge.cls}`}>{badge.label}</span>
          <div className="flex-1" />
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl">
            <button onClick={() => setMode('semi_auto')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${mode === 'semi_auto' ? 'bg-ucc-navy text-white shadow-sm' : 'text-gray-500'}`}>Semi-Auto</button>
            <button onClick={() => setMode('auto_pilot')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${mode === 'auto_pilot' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500'}`}>Auto-Pilot</button>
          </div>
          <Button onClick={() => handleGenerateClick('lecture')} disabled={!selectedSemester || isGenerating} className="bg-ucc-navy text-white gap-1.5 text-sm">
            {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Checking...</> : <><Play className="w-4 h-4" /> Generate Lectures</>}
          </Button>
          <Button onClick={() => handleGenerateClick('exam')} disabled={!selectedSemester || isGenerating} variant="outline" className="gap-1.5 text-sm border-ucc-navy text-ucc-navy">
            <Calendar className="w-4 h-4" /> Generate Exams
          </Button>
        </div>
      </div>

      {/* Auto-Pilot Confirmation Modal */}
      <AnimatePresence>
        {showAutoConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-600 mb-4"><AlertTriangle className="w-6 h-6" /><h3 className="font-heading font-bold text-lg">AUTO-PILOT CONFIRMATION</h3></div>
              <p className="text-sm text-gray-600 mb-2">The timetable will be generated and published immediately without manual review.</p>
              <p className="text-sm text-gray-600 mb-4">All students and lecturers will be notified. This cannot be undone without unpublishing.</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${(10 - autoCountdown) * 10}%` }} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAutoConfirm(false)}>Cancel</Button>
                <Button className="bg-amber-500 text-white" onClick={() => triggerGeneration('lecture')}>Confirm — {autoCountdown}s</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Flight Modal */}
      <AnimatePresence>
        {showPreflight && preflight && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {preflight.canRun ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                  <h3 className="font-heading font-bold text-lg text-ucc-navy">Pre-Flight Validation</h3>
                </div>
                <button onClick={() => setShowPreflight(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">The following checks were performed before scheduling can begin:</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Approved Courses</p>
                    <p className="text-lg font-bold text-ucc-navy">{preflight.counts.courses}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-500">Available Venues</p>
                    <p className="text-lg font-bold text-ucc-navy">{preflight.counts.venues}</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <p className="text-xs text-gray-500">Time Slots</p>
                    <p className="text-lg font-bold text-ucc-navy">{preflight.counts.timeslots}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-gray-500">Departments Approved</p>
                    <p className="text-lg font-bold text-ucc-navy">{preflight.counts.departmentsSubmitted}</p>
                  </div>
                </div>
              </div>

              {preflight.errors?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Errors ({preflight.errors.length})</h4>
                  <div className="space-y-2">
                    {preflight.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {e}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preflight.warnings?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-2">Warnings ({preflight.warnings.length})</h4>
                  <div className="space-y-2">
                    {preflight.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-6 border-t pt-4">
                <Button variant="outline" onClick={() => setShowPreflight(false)}>Cancel</Button>
                <Button 
                  className={preflight.canRun ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"} 
                  onClick={handleProceedGeneration}
                  disabled={!preflight.canRun}
                >
                  Proceed to Generation
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE 2 — Clash Report */}
      <AnimatePresence>
        {showClashReport && runResult && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card-institutional p-5 mb-4 border-l-4 border-l-ucc-navy">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-heading font-bold text-ucc-navy">GENERATION COMPLETE</h3>
                <span className="text-xs text-gray-400">Ran in {(runResult.durationMs / 1000).toFixed(1)}s • v{runResult.version}</span>
              </div>
              <button onClick={() => setShowClashReport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm">Fully Scheduled: <strong>{runResult.summary?.fullyScheduled || 0}</strong></span></div>
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm">Partially: <strong>{runResult.summary?.partiallyScheduled || 0}</strong></span></div>
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm">Unscheduled: <strong>{runResult.summary?.unscheduled || 0}</strong></span></div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-500">Placement Rate</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${runResult.placementRate || 0}%` }} /></div>
              <span className="text-sm font-bold text-ucc-navy">{runResult.placementRate || 0}%</span>
            </div>
            {runResult.failedCourses?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Unscheduled Courses</h4>
                {runResult.failedCourses.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg mb-1 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div><strong>{f.course?.code || 'Unknown'}</strong> — {f.reason}</div>
                  </div>
                ))}
              </div>
            )}
            {runResult.softConstraintViolations?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-600 uppercase mb-2">Soft Warnings ({runResult.softConstraintViolations.length})</h4>
                {runResult.softConstraintViolations.map((v, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg mb-1 text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      {entries.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="form-input-institutional w-auto text-xs">
            <option value="">All Departments</option>
            {deptList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input-institutional w-auto text-xs">
            <option value="">All Types</option>
            <option value="lecture">Lecture</option><option value="tutorial">Tutorial</option>
            <option value="lab">Lab</option><option value="exam">Exam</option>
          </select>
          {/* Dept color legend */}
          <div className="flex gap-2 ml-auto">
            {Object.entries(deptColorMap).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />{name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZONE 3 — Timetable Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="loading-spinner-large" /></div>
      ) : entries.length === 0 ? (
        <div className="card-institutional py-16 text-center">
          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="font-heading font-bold text-ucc-navy text-xl mb-2">No Timetable Data</h3>
          <p className="text-sm text-gray-400">Select a semester and click "Generate Lectures" to create a timetable.</p>
        </div>
      ) : (
        <div className="card-institutional overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, pi) => (
                  <tr key={period} className={pi % 2 === 0 ? '' : 'bg-gray-50/30'}>
                    <td className="px-3 py-2 border-r border-gray-100 align-top">
                      <div className="text-xs font-semibold text-ucc-navy">{period}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{periodTimes[period]?.start}–{periodTimes[period]?.end}</div>
                    </td>
                    {DAYS.map(day => {
                      const cellEntries = getEntriesForCell(period, day);
                      return (
                        <td key={day} className="px-1 py-1 border-r border-gray-50 align-top min-w-[140px]">
                          {cellEntries.map(entry => {
                            const deptName = entry.department?.name || '';
                            const color = deptColorMap[deptName] || '#6B7280';
                            const typeBadge = TYPE_BADGES[entry.entryType || entry.type] || TYPE_BADGES.lecture;
                            return (
                              <div key={entry._id} onClick={() => setEditEntry(entry)} className="p-2 mb-1 rounded-lg bg-white border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                                style={{ borderLeftWidth: '4px', borderLeftColor: color }}>
                                <div className="text-xs font-bold text-gray-800 font-mono">{entry.course?.code}</div>
                                <div className="text-[10px] text-gray-500 truncate">{entry.course?.name}</div>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                  <MapPin className="w-2.5 h-2.5" />{entry.venue?.name || '—'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                                  <Users className="w-2.5 h-2.5" />{entry.lecturer?.name || '—'}
                                </div>
                                <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${typeBadge}`}>{entry.entryType || entry.type}</span>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Sidebar */}
      <AnimatePresence>
        {editEntry && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 overflow-y-auto border-l border-gray-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-ucc-navy">Edit Entry</h3>
                <button onClick={() => setEditEntry(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">Course:</span> <span className="font-semibold">{editEntry.course?.code} — {editEntry.course?.name}</span></div>
                <div><span className="text-gray-500">Lecturer:</span> <span className="font-semibold">{editEntry.lecturer?.name || '—'}</span></div>
                <div><span className="text-gray-500">Department:</span> <span className="font-semibold">{editEntry.department?.name || '—'}</span></div>
                <div><span className="text-gray-500">Venue:</span> <span className="font-semibold">{editEntry.venue?.name || '—'} ({editEntry.venue?.capacity} seats)</span></div>
                <div><span className="text-gray-500">Slot:</span> <span className="font-semibold">{editEntry.dayOfWeek} {editEntry.timeStart}–{editEntry.timeEnd}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded ${TYPE_BADGES[editEntry.entryType || editEntry.type] || ''}`}>{editEntry.entryType || editEntry.type}</span></div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => handleDeleteEntry(editEntry._id)} className="text-red-500 border-red-200 hover:bg-red-50 flex-1 gap-1"><Trash2 className="w-3.5 h-3.5" /> Remove</Button>
                <Button onClick={() => setEditEntry(null)} className="bg-ucc-navy text-white flex-1">Close</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE 5 — Publish Bar */}
      {entries.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-ucc-navy">{badge.label} — {sem?.name} {sem?.academicYear}</span>
              <span className="text-gray-400 ml-3">{statusCounts.total || 0} entries</span>
            </div>
            <div className="flex gap-2">
              {timetableStatus === 'draft' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleClearDraft} className="text-red-500 border-red-200 gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear Draft</Button>
                  <Button size="sm" onClick={handleBeginReview} className="bg-amber-500 text-white gap-1"><Eye className="w-3.5 h-3.5" /> Begin Review</Button>
                </>
              )}
              {timetableStatus === 'under_review' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleClearDraft}>← Back to Draft</Button>
                  <Button size="sm" onClick={handlePublish} className="bg-emerald-600 text-white gap-1"><CheckCircle className="w-3.5 h-3.5" /> Publish Timetable</Button>
                </>
              )}
              {timetableStatus === 'published' && (
                <Button variant="outline" size="sm" onClick={handleUnpublish} className="text-amber-600 border-amber-200">Unpublish</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchedulingControlPanel;
