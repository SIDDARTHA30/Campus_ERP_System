import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

function FacultyMarks() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marksMap, setMarksMap] = useState({});

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
    const subj = subjects.find((x) => (x._id || x.id) === selectedSubject) || {};
    return students.filter((st) => {
      if (subj.department && st.department) return subj.department === st.department;
      return true;
    });
  }, [students, subjects, selectedSubject]);

  useEffect(() => {
    const map = {};
    filteredStudents.forEach((s) => { map[s._id || s.id] = ''; });
    setMarksMap(map);
  }, [filteredStudents]);

  const updateMark = (studentId, value) => {
    setMarksMap((m) => ({ ...m, [studentId]: value }));
  };

  const submit = async () => {
    if (!selectedSubject) return toast.error('Select subject first');
    setSaving(true);
    try {
      const payload = filteredStudents.map((s) => {
        const sId = s._id || s.id;
        return {
          studentId: sId,
          subjectId: selectedSubject,
          marks: Number(marksMap[sId] || 0),
          maxMarks: 100,
          awardedBy: user?._id || user?.id
        };
      });

      await api.post('/marks', payload);
      toast.success('Marks submitted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Upload Marks</h2>
            <p className="mt-1 text-sm text-slate-500">Enter marks for students and submit in bulk.</p>
          </div>

          <div className="flex gap-3 items-center">
            <select className="input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Choose subject</option>
              {subjects.map((s) => {
                const sId = s._id || s.id;
                return <option key={sId} value={sId}>{s.code ? `${s.code} — ${s.title}` : s.title}</option>;
              })}
            </select>
            <button className="btn-primary cursor-pointer" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Submit Marks'}</button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto p-4 md:p-6">
          {loading ? <LoadingState label="Loading students..." /> : null}
          {!loading && !filteredStudents.length ? <EmptyState title="No students to grade" description="Select a subject to start entering marks." /> : null}
          {!loading && filteredStudents.length ? (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="sticky top-0 bg-white z-10 shadow-sm text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Admission No</th>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Department</th>
                <th className="px-5 py-4 font-medium">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredStudents.map((st) => {
                const studentId = st._id || st.id;
                return (
                  <tr key={studentId} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-700">{st.admissionNo}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{st.name}</td>
                    <td className="px-5 py-4 text-slate-700">{st.department}</td>
                    <td className="px-5 py-4">
                      <input className="input w-28" type="number" min="0" max="100" value={marksMap[studentId] ?? ''} onChange={(e) => updateMark(studentId, e.target.value)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default FacultyMarks;
