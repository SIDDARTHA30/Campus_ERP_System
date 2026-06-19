const navigation = {
  admin: [
    { label: 'Dashboard', path: '/app' },
    { label: 'Students', path: '/app/students' },
    { label: 'Faculty', path: '/app/faculty' },
    { label: 'Subjects', path: '/app/subjects' },
    { label: 'Attendance', path: '/app/attendance' },
    { label: 'Marks', path: '/app/marks' },
    { label: 'Materials', path: '/app/materials' },
    { label: 'Notices', path: '/app/notices' },
    { label: 'Fees', path: '/app/fees' },
    { label: 'Library', path: '/app/library' }
  ],
  faculty: [
    { label: 'Dashboard', path: '/app' },
    { label: 'My Classes', path: '/app/faculty/classes' },
    { label: 'Subjects', path: '/app/subjects' },
    { label: 'Attendance', path: '/app/faculty/attendance' },
    { label: 'Marks', path: '/app/faculty/marks' },
    { label: 'Materials', path: '/app/materials' },
    { label: 'Notices', path: '/app/notices' }
  ],
  student: [
    { label: 'Dashboard', path: '/app' },
    { label: 'Attendance', path: '/app/attendance' },
    { label: 'Marks', path: '/app/marks' },
    { label: 'Materials', path: '/app/materials' },
    { label: 'Notices', path: '/app/notices' },
    { label: 'Fees', path: '/app/fees' },
    { label: 'Library', path: '/app/library' },
    { label: 'Performance', path: '/app/performance' }
  ]
};

export default navigation;