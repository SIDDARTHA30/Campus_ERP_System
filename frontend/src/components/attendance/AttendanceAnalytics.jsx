import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Flame, 
  Calendar,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProgressRing = ({ percentage, label, sublabel, color }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-slate-900 dark:text-white">{percentage}%</span>
        </div>
      </div>
      <h4 className="mt-4 font-bold text-slate-800 dark:text-slate-200 text-sm text-center line-clamp-1">{label}</h4>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{sublabel}</p>
    </div>
  );
};

const AttendanceAnalytics = ({ studentId, role }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const params = studentId ? { student: studentId } : {};
        const res = await api.get('/attendance/analytics', { params });
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch attendance analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [studentId]);

  if (loading || !data) return null;

  const getStatusColor = (pct) => {
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 75) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Top Row: Insights & Streaks */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Streak Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-orange-500 to-rose-600 border-none text-white overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest opacity-80">Attendance Streak</span>
            </div>
            <h2 className="text-5xl font-black">{data.streak.current} <span className="text-lg opacity-80 font-bold">Days</span></h2>
            <p className="mt-2 text-sm font-medium opacity-90">Best Streak: {data.streak.best} days</p>
          </div>
          <Flame className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 rotate-12" />
        </motion.div>

        {/* Shortage Risk Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card p-6 border-l-8 ${data.riskAlerts.length > 0 ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-900/10' : 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10'}`}
        >
          <div className="flex items-center gap-3 mb-4">
             <div className={`p-2 rounded-xl ${data.riskAlerts.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {data.riskAlerts.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
             </div>
             <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Risk Assessment</span>
          </div>
          {data.riskAlerts.length > 0 ? (
            <div>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400">{data.riskAlerts.length} Subjects at Risk</h3>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/60 mt-1 font-medium">Attendance dropped below 75% threshold.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">All Safe!</h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/60 mt-1 font-medium">Maintain 75%+ to stay out of the risk zone.</p>
            </div>
          )}
        </motion.div>

        {/* Overall Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 border-l-8 border-brand-500"
        >
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
                <Calendar className="h-6 w-6" />
             </div>
             <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Monthly Consistency</span>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              {data.weeklyTrend.length > 0 ? data.weeklyTrend[data.weeklyTrend.length - 1].percentage : 0}%
            </h2>
            <div className="flex items-center text-emerald-500 text-sm font-bold pb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Real-time</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2">Based on last 7 days activity</p>
        </motion.div>
      </div>

      {/* Main Grid: Heatmap & Subject Rings */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Weekly Trend Chart */}
        <section className="lg:col-span-8 card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Attendance Trend</h3>
              <p className="text-sm font-medium text-slate-500">Daily attendance consistency over last 7 days.</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend}>
                <defs>
                  <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPct)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Heatmap (Mini Activity View) */}
        <section className="lg:col-span-4 card p-8 flex flex-col justify-between">
           <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Activity Heatmap</h3>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(28)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (27 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  const dayData = data.heatmapData.find(d => d.date === dateStr);
                  
                  let bgColor = 'bg-slate-100 dark:bg-slate-800';
                  if (dayData) {
                    bgColor = dayData.status.includes('absent') ? 'bg-rose-500/40' : 'bg-emerald-500/40';
                    if (dayData.status.every(s => s === 'present')) bgColor = 'bg-emerald-500';
                  }

                  return (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-sm ${bgColor} cursor-help transition-all hover:scale-110`}
                      title={dayData ? `${dateStr}: ${dayData.count} Classes` : dateStr}
                    />
                  );
                })}
              </div>
           </div>
           <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
             <span>Less Activity</span>
             <div className="flex gap-1">
               <div className="h-2 w-2 rounded-sm bg-slate-100 dark:bg-slate-800" />
               <div className="h-2 w-2 rounded-sm bg-emerald-500/40" />
               <div className="h-2 w-2 rounded-sm bg-emerald-500" />
             </div>
             <span>More Activity</span>
           </div>
        </section>
      </div>

      {/* Subject-wise Progress Rings */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Subject-wise Progress</h3>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Safe</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Critical</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.subjectWise.map((subject, idx) => (
            <motion.div
              key={subject.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ProgressRing 
                percentage={subject.percentage} 
                label={subject.name}
                sublabel={`${subject.present}/${subject.total} Classes`}
                color={getStatusColor(subject.percentage)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Admin Department View */}
      {role === 'admin' && data.adminStats && (
        <section className="card p-8 border-t-8 border-brand-600">
           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Institutional Performance (by Dept)</h3>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.adminStats.deptStats.map(dept => (
                <div key={dept.department} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{dept.department}</h4>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Global Avg</p>
                  </div>
                  <span className={`text-2xl font-black ${getStatusColor(dept.percentage)}`}>{dept.percentage}%</span>
                </div>
              ))}
           </div>
        </section>
      )}
    </div>
  );
};

export default AttendanceAnalytics;
