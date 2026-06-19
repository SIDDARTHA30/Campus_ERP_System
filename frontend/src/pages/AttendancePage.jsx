import CrudPage from './CrudPage';
import AttendanceAnalytics from '../components/attendance/AttendanceAnalytics';
import { useAuth } from '../context/AuthContext';

const fields = [
  { name: 'student', label: 'Student ID', required: true },
  { name: 'subject', label: 'Subject ID', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: [
    { label: 'present', value: 'present' },
    { label: 'absent', value: 'absent' }
  ]}
];

const filters = [
  { 
    name: 'status', 
    label: 'Status', 
    options: [
      { label: 'Present', value: 'present' },
      { label: 'Absent', value: 'absent' }
    ]
  }
];

export default function AttendancePage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8">
      <AttendanceAnalytics role={user?.role} />
      <CrudPage title="Attendance" endpoint="/attendance" fields={fields} customFilters={filters} />
    </div>
  );
}
