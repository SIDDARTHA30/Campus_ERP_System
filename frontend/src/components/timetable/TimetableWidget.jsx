import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function TimetableWidget({ user }) {
  const [activeDay, setActiveDay] = useState('Mon');
  const [isExpanded, setIsExpanded] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Timetable datasets mapped realistically by department or division
  const dept = user?.department || 'CSE';
  
  const schedules = {
    Mon: [
      { period: '1', time: '09:00 - 10:00 AM', code: 'CS101PC', subject: 'Data Structures', instructor: 'Dr. Aris Kumar', room: 'Room 302' },
      { period: '2', time: '10:00 - 11:00 AM', code: 'EC202PC', subject: 'Microprocessors', instructor: 'Prof. Anil Dev', room: 'Lab 3' },
      { period: '3', time: '11:15 - 12:15 PM', code: 'MA301BS', subject: 'Business Economics', instructor: 'Dr. Vivek Sharma', room: 'Room 201' },
      { period: '4', time: '01:15 - 02:15 PM', code: 'CS302PC', subject: 'Database Management', instructor: 'Dr. Sameer Sen', room: 'Room 302' },
      { period: '5', time: '02:15 - 03:15 PM', code: 'ME102PC', subject: 'Thermodynamics', instructor: 'Dr. S. K. Mitra', room: 'Lab 2' },
    ],
    Tue: [
      { period: '1', time: '09:00 - 10:00 AM', code: 'CS302PC', subject: 'Database Management', instructor: 'Dr. Sameer Sen', room: 'Room 302' },
      { period: '2', time: '10:00 - 11:00 AM', code: 'CS101PC', subject: 'Data Structures', instructor: 'Dr. Aris Kumar', room: 'Room 302' },
      { period: '3', time: '11:15 - 12:15 PM', code: 'EC202PC', subject: 'Microprocessors', instructor: 'Prof. Anil Dev', room: 'Lab 3' },
      { period: '4', time: '01:15 - 02:15 PM', code: 'MA301BS', subject: 'Business Economics', instructor: 'Dr. Vivek Sharma', room: 'Room 201' },
      { period: '5', time: '02:15 - 03:15 PM', code: 'CS401PC', subject: 'Web Technologies', instructor: 'Dr. K. N. Rao', room: 'Room 304' },
    ],
    Wed: [
      { period: '1', time: '09:00 - 10:00 AM', code: 'MA301BS', subject: 'Business Economics', instructor: 'Dr. Vivek Sharma', room: 'Room 201' },
      { period: '2', time: '10:00 - 11:00 AM', code: 'CS302PC', subject: 'Database Management', instructor: 'Dr. Sameer Sen', room: 'Room 302' },
      { period: '3', time: '11:15 - 12:15 PM', code: 'CS101PC', subject: 'Data Structures', instructor: 'Dr. Aris Kumar', room: 'Room 302' },
      { period: '4', time: '01:15 - 02:15 PM', code: 'EC202PC', subject: 'Microprocessors', instructor: 'Prof. Anil Dev', room: 'Lab 3' },
      { period: '5', time: '02:15 - 03:15 PM', code: 'ME102PC', subject: 'Thermodynamics', instructor: 'Dr. S. K. Mitra', room: 'Lab 2' },
    ],
    Thu: [
      { period: '1', time: '09:00 - 10:00 AM', code: 'EC202PC', subject: 'Microprocessors', instructor: 'Prof. Anil Dev', room: 'Lab 3' },
      { period: '2', time: '10:00 - 11:00 AM', code: 'MA301BS', subject: 'Business Economics', instructor: 'Dr. Vivek Sharma', room: 'Room 201' },
      { period: '3', time: '11:15 - 12:15 PM', code: 'CS302PC', subject: 'Database Management', instructor: 'Dr. Sameer Sen', room: 'Room 302' },
      { period: '4', time: '01:15 - 02:15 PM', code: 'CS101PC', subject: 'Data Structures', instructor: 'Dr. Aris Kumar', room: 'Room 302' },
      { period: '5', time: '02:15 - 03:15 PM', code: 'CS401PC', subject: 'Web Technologies', instructor: 'Dr. K. N. Rao', room: 'Room 304' },
    ],
    Fri: [
      { period: '1', time: '09:00 - 10:00 AM', code: 'CS101PC', subject: 'Data Structures', instructor: 'Dr. Aris Kumar', room: 'Room 302' },
      { period: '2', time: '10:00 - 11:00 AM', code: 'EC202PC', subject: 'Microprocessors', instructor: 'Prof. Anil Dev', room: 'Lab 3' },
      { period: '3', time: '11:15 - 12:15 PM', code: 'MA301BS', subject: 'Business Economics', instructor: 'Dr. Vivek Sharma', room: 'Room 201' },
      { period: '4', time: '01:15 - 02:15 PM', code: 'ME102PC', subject: 'Thermodynamics', instructor: 'Dr. S. K. Mitra', room: 'Lab 2' },
      { period: '5', time: '02:15 - 03:15 PM', code: 'CS401PC', subject: 'Web Technologies', instructor: 'Dr. K. N. Rao', room: 'Room 304' },
    ]
  };

  const todaySchedule = schedules[activeDay] || [];

  return (
    <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xl transition-all duration-300">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none pb-4 border-b border-slate-100 dark:border-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Calendar className="h-5.5 w-5.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Daily Class Schedule
            </h3>
            <p className="text-xs font-semibold text-slate-400">Interactive hourly timetable for the current academic session.</p>
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
            className="overflow-hidden pt-5 space-y-5"
          >
            {/* Day Selector */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 overflow-x-auto scrollbar-none">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeDay === day 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* List of periods */}
            <div className="space-y-3.5">
              {todaySchedule.map((p, i) => (
                <div 
                  key={i} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                >
                  {/* Left block: Period & Time */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xs">
                      {p.period}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{p.code} • {p.subject}</h4>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-500" /> {p.time}
                      </p>
                    </div>
                  </div>

                  {/* Right block: Faculty & Room */}
                  <div className="flex items-center gap-6 sm:self-center">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-650 dark:text-slate-300">{p.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-0.5 rounded-full">
                        {p.room}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
