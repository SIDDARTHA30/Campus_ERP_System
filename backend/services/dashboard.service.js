const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Notice = require('../models/Notice');

const ALL_DEPARTMENTS = [
  'CSE', 'IT', 'AI&DS', 'AIML', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL', 'BIOTECH'
];

async function getAdminStats() {
  const [studentCount, facultyCount, subjectCount, noticeCount] = await Promise.all([
    Student.countDocuments(),
    Faculty.countDocuments(),
    Subject.countDocuments(),
    Notice.countDocuments()
  ]);

  // Helper to merge aggregation with full list
  const mergeDist = (aggResults) => {
    return ALL_DEPARTMENTS.map(dept => {
      const match = aggResults.find(r => r._id === dept);
      return { _id: dept, count: match ? match.count : 0 };
    });
  };

  // Department-wise student distribution
  const studentAgg = await Student.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  // Department-wise faculty distribution
  const facultyAgg = await Faculty.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  // Recent activity (e.g., last 5 students created)
  const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5).lean();

  return {
    counts: {
      students: studentCount,
      faculty: facultyCount,
      subjects: subjectCount,
      notices: noticeCount
    },
    distributions: {
      studentsByDept: mergeDist(studentAgg),
      facultyByDept: mergeDist(facultyAgg)
    },
    recentActivity: recentStudents
  };
}

async function getStudentStats(studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  // Attendance summary
  const attendance = await Attendance.aggregate([
    { $match: { student: student._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Marks summary
  const marks = await Mark.find({ student: student._id }).populate('subject').lean();

  return {
    attendance,
    marks,
    profile: {
      name: student.name,
      admissionNo: student.admissionNo,
      department: student.department
    }
  };
}

async function getFacultyStats(facultyId) {
  const faculty = await Faculty.findById(facultyId).populate('subjects');
  if (!faculty) throw new Error('Faculty not found');

  // Count students in assigned subjects (simplified)
  const studentCount = await Student.countDocuments({ department: faculty.department });

  return {
    assignedSubjects: faculty.subjects,
    totalStudents: studentCount,
    profile: {
      name: faculty.name,
      employeeCode: faculty.employeeCode,
      department: faculty.department
    }
  };
}

module.exports = {
  getAdminStats,
  getStudentStats,
  getFacultyStats
};
