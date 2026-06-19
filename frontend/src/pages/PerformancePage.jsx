import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingState from '../components/common/LoadingState';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function PerformancePage() {
  const { user } = useAuth();
  const [data, setData] = useState({ attendance: [], marks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const [attRes, marksRes] = await Promise.all([
          api.get('/attendance?limit=all'),
          api.get('/marks?limit=all')
        ]);
        setData({ 
          attendance: attRes.data?.data || [], 
          marks: marksRes.data?.data || [] 
        });
      } catch (err) {
        console.error('Failed to fetch performance data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const attendanceBySubject = useMemo(() => {
    const stats = {};
    data.attendance.forEach(r => {
      const subName = r.subject?.name || 'Unknown';
      if (!stats[subName]) stats[subName] = { name: subName, present: 0, total: 0 };
      stats[subName].total++;
      if (r.status === 'present') stats[subName].present++;
    });
    return Object.values(stats).map(s => ({
      ...s,
      percentage: parseFloat(((s.present / s.total) * 100).toFixed(1))
    })).sort((a, b) => a.percentage - b.percentage);
  }, [data.attendance]);

  const marksBySubject = useMemo(() => {
    return data.marks.map(m => ({
      name: m.subject?.name || 'Unknown',
      marks: m.marks,
      maxMarks: m.maxMarks || 100,
      percentage: parseFloat(((m.marks / (m.maxMarks || 100)) * 100).toFixed(1))
    })).sort((a, b) => b.marks - a.marks);
  }, [data.marks]);

  const attendanceTrend = useMemo(() => {
    const trend = {};
    data.attendance.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(r => {
      const date = new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!trend[date]) trend[date] = { date, present: 0, total: 0 };
      trend[date].total++;
      if (r.status === 'present') trend[date].present++;
    });
    return Object.values(trend).map(t => ({
      date: t.date,
      rate: parseFloat(((t.present / t.total) * 100).toFixed(1))
    }));
  }, [data.attendance]);

  if (loading) return <LoadingState label="Analyzing your performance..." />;

  return (
    <div className="space-y-10 pb-12 fade-in-up">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Performance Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs opacity-70">Deep analysis of your academic journey</p>
      </header>

      {/* Top Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card p-6 border-b-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Subject</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{marksBySubject[0]?.name || 'N/A'}</h4>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-b-4 border-emerald-500">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Marks</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.round(marksBySubject.reduce((acc, curr) => acc + curr.percentage, 0) / marksBySubject.length) || 0}%
              </h4>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-b-4 border-amber-500">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendance Status</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {attendanceBySubject.filter(s => s.percentage < 75).length > 0 ? '⚠️ Shortage Risk' : '✅ Healthy'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Attendance Analysis */}
        <section className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Attendance Analysis</h3>
              <p className="text-sm font-medium text-slate-500 italic">Subject-wise attendance breakdown (%)</p>
            </div>
            <Target className="h-6 w-6 text-blue-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBySubject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={20}>
                  {attendanceBySubject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#f43f5e' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Marks Breakdown */}
        <section className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Academic Performance</h3>
              <p className="text-sm font-medium text-slate-500 italic">Scores across different subjects</p>
            </div>
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marksBySubject}>
                <defs>
                  <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Area type="monotone" dataKey="marks" stroke="#6366f1" fillOpacity={1} fill="url(#colorMarks)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Attendance Trend */}
        <section className="card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Daily Attendance Trend</h3>
              <p className="text-sm font-medium text-slate-500 italic">How your consistency changed over time</p>
            </div>
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis unit="%" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Line type="stepAfter" dataKey="rate" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      
      {/* Shortage Alerts */}
      {attendanceBySubject.some(s => s.percentage < 75) && (
        <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-white dark:bg-red-900 flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-red-900 dark:text-red-400">Attendance Alert!</h4>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mt-1">
              You have low attendance in {attendanceBySubject.filter(s => s.percentage < 75).map(s => s.name).join(', ')}. 
              Maintaining at least 75% is mandatory to avoid condonation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
