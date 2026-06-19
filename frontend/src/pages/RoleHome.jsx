import { useEffect, useMemo, useState } from 'react';
import TimetableWidget from '../components/timetable/TimetableWidget';
import PlacementWidget from '../components/placements/PlacementWidget';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SummaryCard from '../components/common/SummaryCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Library, 
  ClipboardCheck, 
  FileText, 
  Bell, 
  ChevronRight,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

const summaryByRole = {
  admin: [
    { label: 'Manage Students', path: '/app/students', icon: Users },
    { label: 'Manage Faculty', path: '/app/faculty', icon: GraduationCap },
    { label: 'Monitor Academics', path: '/app/attendance', icon: ClipboardCheck },
    { label: 'Library Management', path: '/app/library', icon: Library }
  ],
  faculty: [
    { label: 'Mark Attendance', path: '/app/faculty/attendance', icon: ClipboardCheck },
    { label: 'Upload Marks', path: '/app/faculty/marks', icon: FileText },
    { label: 'My Classes', path: '/app/faculty/classes', icon: GraduationCap }
  ],
  student: [
    { label: 'View Attendance', path: '/app/attendance', icon: ClipboardCheck },
    { label: 'Check Marks', path: '/app/marks', icon: FileText },
    { label: 'Library Books', path: '/app/library', icon: Library }
  ]
};

function RoleHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const actions = summaryByRole[user?.role] || [];
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, noticesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/notices?limit=3')
        ]);
        setStats(statsRes.data?.data);
        setNotices(noticesRes.data?.data?.items || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        toast.error('Could not load real-time analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const adminCards = useMemo(() => {
    if (!stats || user?.role !== 'admin') return [];
    return [
      { label: 'Total Students', value: stats.counts.students, path: '/app/students', icon: Users, color: 'text-blue-600' },
      { label: 'Total Faculty', value: stats.counts.faculty, path: '/app/faculty', icon: GraduationCap, color: 'text-indigo-600' },
      { label: 'Subjects', value: stats.counts.subjects, path: '/app/subjects', icon: BookOpen, color: 'text-emerald-600' },
      { label: 'Active Notices', value: stats.counts.notices, path: '/app/notices', icon: Bell, color: 'text-amber-600' }
    ];
  }, [stats, user?.role]);

  const studentCards = useMemo(() => {
    if (!stats || user?.role !== 'student') return [];
    const totalRecords = stats.attendance.reduce((acc, curr) => acc + curr.count, 0);
    const presentRecords = stats.attendance.find(a => a._id === 'present')?.count || 0;
    const overallAtt = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;
    
    return [
      { label: 'Attendance', value: `${overallAtt}%`, path: '/app/attendance', icon: ClipboardCheck, color: overallAtt >= 75 ? 'text-emerald-600' : 'text-red-600' },
      { label: 'My Marks', value: stats.marks.length, path: '/app/marks', icon: FileText, color: 'text-indigo-600' },
      { label: 'Active Notices', value: notices.length, path: '/app/notices', icon: Bell, color: 'text-amber-600' }
    ];
  }, [stats, notices, user?.role]);

  const facultyCards = useMemo(() => {
    if (!stats || user?.role !== 'faculty') return [];
    return [
      { label: 'My Subjects', value: stats.assignedSubjects.length, path: '/app/faculty/classes', icon: BookOpen, color: 'text-emerald-600' },
      { label: 'Students', value: stats.totalStudents, path: '/app/faculty/attendance', icon: Users, color: 'text-blue-600' },
      { label: 'Active Notices', value: notices.length, path: '/app/notices', icon: Bell, color: 'text-amber-600' }
    ];
  }, [stats, notices, user?.role]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    if (user?.role === 'admin') {
      return stats.distributions.studentsByDept.map(d => ({
        name: d._id || 'General',
        count: d.count
      }));
    }
    if (user?.role === 'student') {
      // Show subject-wise marks or attendance
      const subjectMap = {};
      stats.marks.forEach(m => {
        const name = m.subject?.name || 'Sub';
        subjectMap[name] = (m.marks / (m.maxMarks || 100)) * 100;
      });
      return Object.keys(subjectMap).map(name => ({ name, count: subjectMap[name] }));
    }
    return [];
  }, [stats, user?.role]);

  if (loading) return <LoadingState label="Synchronizing real-time data..." />;

  const displayCards = user?.role === 'admin' ? adminCards : user?.role === 'student' ? studentCards : facultyCards;

  return (
    <div className="space-y-10 pb-12 fade-in-up">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back, <span className="text-brand-600 dark:text-blue-400">{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Here is what is happening in the Campus ERP today.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {displayCards.map((card) => (
          <SummaryCard 
            key={card.label} 
            label={card.label} 
            value={card.value} 
            icon={card.icon}
            color={card.color}
            onClick={() => navigate(card.path)}
          />
        ))}
      </section>

      {/* Analytics Chart */}
      <section className="card p-8 bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {user?.role === 'student' ? 'Academic Performance (%)' : 'Institutional Statistics'}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {user?.role === 'student' 
                ? 'Your subject-wise marks analytics.' 
                : 'Real-time student distribution across core departments.'}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Live Data</span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {!chartData.length ? (
             <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 font-bold">No analytics data available yet</p>
                </div>
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#fff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Faculty Performance Panel (Admin Only) */}
      {user?.role === 'admin' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2rem] p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-indigo-500" />
                Faculty Performance & Compliance Panel
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
                Institutional analysis of instructor efficacy, grading curves, and attendance logging compliance.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20 rounded-xl shadow-inner">
              Compliance Audit Active
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Best Faculty / Subject Results */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-md dark:hover:shadow-none hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" /> Efficacy & Subject Results
              </h4>
              <div className="space-y-1.5">
                <FacultyRow name="Dr. Aris Kumar" dept="CSE" score="89.4%" label="DBMS" badge="Outstanding" color="emerald" />
                <FacultyRow name="Prof. Priya Rao" dept="AI&DS" score="87.1%" label="Machine Learning" badge="Outstanding" color="emerald" />
                <FacultyRow name="Dr. Vivek Sharma" dept="MECH" score="84.5%" label="Thermodynamics" badge="Exceptional" color="blue" />
              </div>
            </div>

            {/* Average Class Performance */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-md dark:hover:shadow-none hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-indigo-500" /> Class Progression Indexes
              </h4>
              <div className="space-y-1.5">
                <FacultyRow name="Dr. Sameer Sen" dept="CSBS" score="85.2%" label="CSBS101PC" badge="Exceptional" color="blue" />
                <FacultyRow name="Prof. Anil Dev" dept="ECE" score="82.9%" label="Microprocessors" badge="Highly Compliant" color="blue" />
                <FacultyRow name="Prof. Meera Joshi" dept="CIVIL" score="81.4%" label="Fluid Mechanics" badge="Compliant" color="slate" />
              </div>
            </div>

            {/* Attendance Handling */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-md dark:hover:shadow-none hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck className="h-4.5 w-4.5 text-indigo-500" /> Attendance Ledger Audit
              </h4>
              <div className="space-y-1.5">
                <FacultyRow name="Dr. K. N. Rao" dept="IT" score="99.2% log rate" label="Web Tech" badge="100% On-Time" color="emerald" />
                <FacultyRow name="Prof. Lata Nair" dept="BIOTECH" score="97.8% log rate" label="Bio-Tech" badge="On-Time" color="emerald" />
                <FacultyRow name="Dr. S. K. Mitra" dept="CHEMICAL" score="95.5% log rate" label="Heat Transfer" badge="On-Time" color="emerald" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Timetable Widget & Placement Widget */}
      <div className="grid gap-8 lg:grid-cols-2">
        <TimetableWidget user={user} />
        <PlacementWidget />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Institutional Notices
            </h3>
            <button 
              onClick={() => navigate('/app/notices')}
              className="text-sm font-semibold text-brand-600 dark:text-blue-400 hover:text-brand-700 dark:hover:text-blue-300 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {!notices.length ? <EmptyState title="No recent notices found" /> : null}
            {notices.map((notice) => (
              <button 
                key={notice._id} 
                className="card group w-full text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-brand-200 dark:hover:border-slate-700 p-5 cursor-pointer"
                onClick={() => navigate('/app/notices')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      notice.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {notice.priority}
                    </span>
                    <h4 className="mt-2 font-bold text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-blue-400 transition-colors">{notice.title}</h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{notice.content}</p>
                    <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors mt-2" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            Quick Access
          </h3>
          <div className="space-y-3">
            {actions.map((action) => (
              <button 
                key={action.label} 
                onClick={() => navigate(action.path)}
                className="card flex items-center justify-between gap-3 w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-all duration-300">
                    <action.icon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FacultyRow({ name, dept, score, label, badge, color }) {
  const badgeColors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  
  return (
    <div className="flex items-center justify-between py-2.5 px-2.5 rounded-xl border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-950/20 last:border-0 transition-all duration-200">
      <div className="min-w-0 pr-2">
        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight">{name}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 uppercase tracking-wide">{dept} • {label}</p>
      </div>
      <div className="text-right flex-shrink-0 flex flex-col items-end">
        <p className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{score}</p>
        <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-md mt-1 border ${badgeColors[color] || badgeColors.slate}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

export default RoleHome;