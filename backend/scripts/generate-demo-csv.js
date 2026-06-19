const fs = require('fs');
const path = require('path');

const demoDir = path.join(__dirname, '../../demo-data');
if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

const departments = ['CSE', 'IT', 'ECE', 'EEE', 'CIVIL'];
const designations = ['Professor', 'Assistant Professor', 'Associate Professor', 'Lecturer'];
const examTypes = ['internal', 'mid', 'semester'];
const feeStatuses = ['paid', 'pending', 'partial'];

// 1. Generate Faculty
const faculty = [];
for (let i = 1; i <= 15; i++) {
  const code = `VIGN-FAC-${String(i).padStart(3, '0')}`;
  const dept = departments[i % departments.length];
  faculty.push({
    employeeCode: code,
    name: `Faculty Name ${i}`,
    email: `faculty${i}@vignanerp.test`,
    department: dept,
    designation: designations[i % designations.length],
    phone: `98480${String(10000 + i)}`
  });
}

// 2. Generate Students
const students = [];
const years = [1, 2, 3, 4];
const sections = ['A', 'B', 'C'];
for (let i = 1; i <= 50; i++) {
  const deptIndex = i % departments.length;
  const dept = departments[deptIndex];
  const deptCode = ['05', '12', '04', '02', '01'][deptIndex];
  const admissionNo = `23891A${deptCode}${String(i).padStart(2, '0')}`;
  
  students.push({
    admissionNo,
    name: `Student Name ${i}`,
    email: `student${i}@gmail.com`,
    department: dept,
    year: years[i % years.length],
    section: sections[i % sections.length],
    batch: '2023-2027',
    gender: i % 2 === 0 ? 'male' : 'female',
    dateOfBirth: `2005-0${(i % 9) + 1}-15`,
    address: `${i} Main Road, Hyderabad`,
    phone: `81234${String(20000 + i)}`
  });
}

// 3. Generate Subjects
const subjects = [];
const subjectNames = {
  'CSE': ['Data Structures', 'Operating Systems', 'DBMS', 'Algorithms'],
  'IT': ['Web Technologies', 'Software Engineering', 'Networking', 'Cyber Security'],
  'ECE': ['Signals and Systems', 'VLSI Design', 'Embedded Systems', 'Digital Logic'],
  'EEE': ['Power Electronics', 'Electrical Machines', 'Control Systems', 'Circuit Theory'],
  'CIVIL': ['Surveying', 'Structural Analysis', 'Geotechnical Engineering', 'Transportation']
};

departments.forEach(dept => {
  const deptFaculty = faculty.filter(f => f.department === dept);
  subjectNames[dept].forEach((name, idx) => {
    const code = `${dept}${idx + 1}01PC`;
    subjects.push({
      code,
      name,
      department: dept,
      semester: (idx % 2) + 1,
      credits: 3,
      facultyId: deptFaculty[idx % deptFaculty.length].employeeCode
    });
  });
});

// 4. Generate Attendance
const attendance = [];
const dates = ['2024-05-10', '2024-05-11', '2024-05-12', '2024-05-13', '2024-05-14'];
students.forEach(student => {
  const studentSubjects = subjects.filter(s => s.department === student.department);
  dates.forEach(date => {
    studentSubjects.forEach(subject => {
      attendance.push({
        studentId: student.admissionNo,
        subjectCode: subject.code,
        date,
        status: Math.random() > 0.15 ? 'present' : 'absent'
      });
    });
  });
});

// 5. Generate Marks
const marks = [];
students.forEach(student => {
  const studentSubjects = subjects.filter(s => s.department === student.department);
  studentSubjects.forEach(subject => {
    examTypes.forEach(exam => {
      marks.push({
        studentId: student.admissionNo,
        subjectCode: subject.code,
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        maxScore: 100,
        examType: exam
      });
    });
  });
});

// 6. Generate Materials
const materials = [];
subjects.forEach(subject => {
  materials.push({
    title: `${subject.name} Lecture Notes`,
    subjectCode: subject.code,
    facultyId: subject.facultyId,
    type: 'pdf',
    link: 'https://drive.google.com/file/d/dummy-notes/view'
  });
});

// 7. Generate Notices
const notices = [
  { title: 'Semester Exams Schedule', description: 'The semester exams will start from June 15th.', targetAudience: 'students', date: '2024-05-01' },
  { title: 'Faculty Meeting', description: 'Monthly faculty meeting in conference room A.', targetAudience: 'faculty', date: '2024-05-05' },
  { title: 'Campus Holiday', description: 'Campus will be closed for National Holiday.', targetAudience: 'all', date: '2024-05-20' }
];

// 8. Generate Library Books
const libraryBooks = [];
departments.forEach(dept => {
  for (let i = 1; i <= 5; i++) {
    libraryBooks.push({
      bookId: `LIB-${dept}-${String(i).padStart(3, '0')}`,
      title: `${dept} Advanced Study Vol ${i}`,
      author: `Author ${dept} ${i}`,
      department: dept,
      availableCopies: 10,
      totalCopies: 15
    });
  }
});

// 9. Generate Fees
const fees = students.map(student => ({
  studentId: student.admissionNo,
  totalFee: 85000,
  paidAmount: Math.random() > 0.5 ? 85000 : 42500,
  status: Math.random() > 0.7 ? 'paid' : (Math.random() > 0.5 ? 'partial' : 'pending')
}));

// Helper to write CSV
function writeCSV(filename, data) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  fs.writeFileSync(path.join(demoDir, filename), csvContent);
}

writeCSV('faculty-demo.csv', faculty);
writeCSV('students-demo.csv', students);
writeCSV('subjects-demo.csv', subjects);
writeCSV('attendance-demo.csv', attendance.slice(0, 500)); // Capping for sanity
writeCSV('marks-demo.csv', marks.slice(0, 500)); // Capping for sanity
writeCSV('materials-demo.csv', materials);
writeCSV('notices-demo.csv', notices);
writeCSV('library-books-demo.csv', libraryBooks);
writeCSV('fees-demo.csv', fees);

// UPLOAD_ORDER.txt
const uploadOrder = `
UPLOAD SEQUENCE FOR CAMPUS ERP:
-------------------------------
1. faculty-demo.csv       (Creates faculty records and accounts)
2. students-demo.csv      (Creates student records and accounts)
3. subjects-demo.csv      (Links to existing faculty)
4. attendance-demo.csv    (Links to students and subjects)
5. marks-demo.csv         (Links to students and subjects)
6. materials-demo.csv     (Links to faculty and subjects)
7. notices-demo.csv       (General institutional updates)
8. library-books-demo.csv (Inventory management)
9. fees-demo.csv          (Student financial records)

IMPORTANT:
- Ensure the Faculty and Students are uploaded FIRST as other data depends on their IDs.
- Login for Students: ROLLNUMBER@student
- Login for Faculty: FACULTYID@faculty
`.trim();

fs.writeFileSync(path.join(demoDir, 'UPLOAD_ORDER.txt'), uploadOrder);

console.log('✅ Demo CSV data generated successfully in /demo-data');
