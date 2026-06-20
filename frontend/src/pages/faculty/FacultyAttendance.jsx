import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import AttendanceAnalytics from '../../components/attendance/AttendanceAnalytics';

function FacultyAttendance() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await api.get('/subjects');
        setSubjects(s.data.data.items || []);
        const st = await api.get('/students');
        setStudents(st.data.data.items || []);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!selectedSubject) return [];
    const subj = subjects.find((x) => x.id === selectedSubject || x._id === selectedSubject) || {};
    // Heuristic: match by department or subject.assignedTo
    return students.filter((st) => {
      if (subj.department && st.department) return subj.department === st.department;
      return true;
    });
  }, [students, subjects, selectedSubject]);

  useEffect(() => {
    // init attendance map for visible students
    const map = {};
    filteredStudents.forEach((s) => { map[s.id || s._id] = 'present'; });
    setAttendanceMap(map);
  }, [filteredStudents]);

  const toggle = (studentId) => {
    setAttendanceMap((m) => ({ ...m, [studentId]: m[studentId] === 'present' ? 'absent' : 'present' }));
  };

  const markAll = (status) => {
    const map = {};
    filteredStudents.forEach((s) => { map[s.id || s._id] = status; });
    setAttendanceMap(map);
  };

  const submit = async () => {
    if (!selectedSubject) return toast.error('Select subject first');
    setSaving(true);
    try {
      const payload = filteredStudents.map((s) => ({
        student: s.id || s._id,
        subject: selectedSubject,
        faculty: user.facultyId,
        date,
        status: attendanceMap[s.id || s._id] || 'absent'
      }));

      await api.post('/attendance', payload);
      toast.success('Attendance submitted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <AttendanceAnalytics role="faculty" />
      
      <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
        <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Mark Attendance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select subject and date, then mark students present/absent.</p>
          </div>

          <div className="flex gap-3 items-center">
            <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Choose subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} — ${s.title}` : s.title}</option>)}
            </select>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="btn-secondary cursor-pointer" onClick={() => markAll('present')}>Mark All Present</button>
            <button className="btn-secondary cursor-pointer" onClick={() => markAll('absent')}>Mark All Absent</button>
            <button className="btn-primary cursor-pointer" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto p-4 md:p-6">
          {loading ? <LoadingState label="Loading students..." /> : null}
          {!loading && !filteredStudents.length ? <EmptyState title="No students to mark" description="Select a subject to see students in this class." /> : null}
          {!loading && filteredStudents.length ? (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-5 py-4 font-medium">Admission No</th>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Department</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{st.admissionNo}</td>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{st.name}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{st.department}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${attendanceMap[st.id] === 'present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>{attendanceMap[st.id]}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="btn-secondary cursor-pointer" onClick={() => toggle(st.id)}>{attendanceMap[st.id] === 'present' ? 'Mark Absent' : 'Mark Present'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : null}
        </div>
      </section>
      </div>
    </div>
  );
}

export default FacultyAttendance;
