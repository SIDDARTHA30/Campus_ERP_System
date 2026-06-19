import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function MyClasses() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get('/subjects');
        setSubjects(s.data.data.items || []);
        const st = await api.get('/students');
        setStudents(st.data.data.items || []);
      } catch (err) {
        toast.error('Failed to load classes');
      }
    })();
  }, []);

  const assigned = subjects.filter((sub) => {
    // try to infer assigned subjects by faculty id/name
    if (sub.assignedTo && user) {
      const uId = user._id || user.id;
      return sub.assignedTo === uId || sub.assignedTo === user.email || sub.assignedTo === user.name;
    }
    // fallback: match department if faculty has department
    if (user?.department && sub.department) return sub.department === user.department;
    return true;
  });

  const classStudents = selectedSubject
    ? students.filter((st) => students && ((selectedSubject.department && st.department === selectedSubject.department) || true))
    : [];

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">My Classes</h2>
            <p className="mt-1 text-sm text-slate-500">Subjects assigned to you and their students.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {assigned.map((sub) => {
            const subId = sub._id || sub.id;
            const isSelected = (selectedSubject?._id || selectedSubject?.id) === subId;
            return (
              <div key={subId} className={`p-4 rounded-xl border ${isSelected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{sub.title}</div>
                    <div className="text-xs text-slate-500">{sub.code} • {sub.department}</div>
                  </div>
                  <button className="btn-secondary cursor-pointer" onClick={() => setSelectedSubject(sub)}>View</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedSubject ? (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Students for {selectedSubject.title}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Admission No</th>
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {classStudents.length ? classStudents.map((st) => (
                  <tr key={st._id || st.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-700">{st.admissionNo}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{st.name}</td>
                    <td className="px-5 py-4 text-slate-700">{st.department}</td>
                  </tr>
                )) : (
                  <tr><td className="px-5 py-6 text-slate-500" colSpan={3}>No students found for this subject.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
