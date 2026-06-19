import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Award, Briefcase, Building, 
  MapPin, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PlacementWidget() {
  const [isExpanded, setIsExpanded] = useState(false);

  const placementStats = [
    { label: 'Highest Package', value: '44.0 LPA', subtitle: 'Microsoft Redmond', icon: <Award />, color: 'purple' },
    { label: 'Average Package', value: '7.8 LPA', subtitle: 'CSE & AI&DS leading', icon: <TrendingUp />, color: 'emerald' },
    { label: 'Placement Rate', value: '89.4%', subtitle: 'Batch of 2025', icon: <Briefcase />, color: 'blue' },
    { label: 'Active Internships', value: '142 Students', subtitle: 'Summer cohort', icon: <Building />, color: 'amber' }
  ];

  const companyStats = [
    { company: 'TCS', count: 58 },
    { company: 'Cognizant', count: 46 },
    { company: 'Accenture', count: 38 },
    { company: 'Amazon', count: 12 },
    { company: 'Microsoft', count: 4 },
    { company: 'Salesforce', count: 6 }
  ];

  const featuredPlacements = [
    { name: 'Aditya Vardhan', dept: 'AI&DS', company: 'Microsoft', package: '44 LPA', type: 'Full-Time Offer' },
    { name: 'K. Sai Priya', dept: 'CSE', company: 'Amazon', package: '32 LPA', type: 'FTE + Internship' },
    { name: 'Rohan Sharma', dept: 'IT', company: 'Salesforce', package: '24 LPA', type: 'FTE Offer' }
  ];

  const colors = {
    purple: 'bg-purple-950/50 text-purple-400 border-purple-900/40',
    emerald: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40',
    blue: 'bg-blue-950/50 text-blue-400 border-blue-900/40',
    amber: 'bg-amber-950/50 text-amber-400 border-amber-900/40',
  };

  return (
    <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xl transition-all duration-300">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none pb-4 border-b border-slate-100 dark:border-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Briefcase className="h-5.5 w-5.5 text-purple-550 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Corporate Placements & Career Analytics
            </h3>
            <p className="text-xs font-semibold text-slate-400">Institutional recruitment indices, top package updates, and internship analytics.</p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-5 space-y-6"
          >
            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {placementStats.map((stat, i) => (
                <div key={i} className="p-4.5 rounded-2xl flex items-center gap-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${colors[stat.color] || colors.blue}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-none">{stat.value}</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 truncate">{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Graphs & Featured Placements */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recruiter Graph */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Recruiters Distribution Graph
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyStats} margin={{ left: -25, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#f8fafc' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Topper Placements List */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex flex-col justify-between">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-450" /> Elite Placements Highlight
                </h4>
                <div className="space-y-3">
                  {featuredPlacements.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">{p.dept} • {p.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full">
                          {p.company}
                        </span>
                        <p className="text-xs font-black text-emerald-450 mt-1">{p.package}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
