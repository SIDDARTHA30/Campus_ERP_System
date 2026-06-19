import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from './CrudPage';
import MarksAnalytics from '../components/marks/MarksAnalytics';

const fields = [
  { name: 'student', label: 'Student ID', required: true },
  { name: 'subject', label: 'Subject ID', required: true },
  { name: 'score', label: 'Score', type: 'number', required: true },
  { name: 'maxScore', label: 'Max Score', type: 'number' },
  { name: 'examType', label: 'Exam Type', type: 'select', options: [
    { label: 'Internal', value: 'internal' },
    { label: 'Mid-Term', value: 'mid' },
    { label: 'Semester', value: 'semester' }
  ]}
];

const filters = [
  { 
    name: 'examType', 
    label: 'Exam Type', 
    options: [
      { label: 'Internal', value: 'internal' },
      { label: 'Mid-Term', value: 'mid' },
      { label: 'Semester', value: 'semester' }
    ]
  }
];

export default function MarksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Academic Marks</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track and manage academic performance.</p>
        </div>
        
        {user.role !== 'student' && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'manage' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage Marks
            </button>
          </div>
        )}
      </div>

      <div className="pt-2">
        {activeTab === 'analytics' ? (
          <MarksAnalytics />
        ) : (
          <div className="fade-in-up">
            <CrudPage title="Marks" endpoint="/marks" fields={fields} customFilters={filters} hideHeader={true} />
          </div>
        )}
      </div>
    </div>
  );
}
