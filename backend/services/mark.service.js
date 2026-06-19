const AppError = require("../utils/appError");
const Mark = require("../models/Mark");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");

async function validateRelations(payload) {
  if (payload.student) {
    const student = await Student.findById(payload.student);
    if (!student) throw new AppError("Student not found", 404);
  }
  if (payload.subject) {
    const subject = await Subject.findById(payload.subject);
    if (!subject) throw new AppError("Subject not found", 404);
  }
  if (payload.faculty) {
    const faculty = await Faculty.findById(payload.faculty);
    if (!faculty) throw new AppError("Faculty not found", 404);
  }
}

function enrichMark(mark) {
  const markObj = mark.toObject ? mark.toObject() : mark;
  return {
    ...markObj,
    percentage: Number(((Number(markObj.score) / Number(markObj.maxScore)) * 100).toFixed(2))
  };
}

const { sanitizeQuery, enforceRoleFilters } = require('../utils/queryHelper');

async function list(query = {}, user) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { student, subject, faculty, examType, sortBy = "date", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Marks → capped to 10000');
  let filter = {};

  // Enforce Privacy (Double Layer Security)
  filter = enforceRoleFilters(filter, user, query);
  
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;
  
  if (search) {
    const [students, subjects] = await Promise.all([
      Student.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { admissionNo: { $regex: search, $options: "i" } }
        ]
      }).select("_id").lean(),
      Subject.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } }
        ]
      }).select("_id").lean()
    ]);
    
    filter.$or = [
      { student: { $in: students.map(s => s._id) } },
      { subject: { $in: subjects.map(s => s._id) } },
      { examType: { $regex: search, $options: "i" } }
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Mark.find(filter)
      .populate("student")
      .populate("subject")
      .populate("faculty")
      .sort(sort)
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Mark.countDocuments(filter)
  ]);

  return {
    items: items.map(enrichMark),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / (numericLimit || 1))
    }
  };
}

async function getById(id) {
  const record = await Mark.findById(id)
    .populate("student")
    .populate("subject")
    .populate("faculty");
  if (!record) throw new AppError("Mark record not found", 404);
  return enrichMark(record);
}

async function create(payload) {
  await validateRelations(payload);
  const record = await Mark.create(payload);
  return enrichMark(record);
}

async function update(id, payload) {
  await validateRelations(payload);
  const record = await Mark.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!record) throw new AppError("Mark record not found", 404);
  return enrichMark(record);
}

async function bulkUpload(results) {
  const summary = { created: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    try {
      const { studentid, subjectcode, marks, maxscore, examtype } = row;
      
      if (!studentid || !subjectcode || !marks) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing required fields (studentid, subjectcode, marks)" });
        continue;
      }

      const sId = row.studentid.trim();
      const sCode = row.subjectcode.trim();

      console.log("Searching student:", sId);
      const student = await Student.findOne({ 
        admissionNo: { $regex: `^${sId}$`, $options: "i" } 
      });

      if (!student) {
        console.log("❌ Student not found (admissionNo):", sId);
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: `Student with admissionNo ${sId} not found` });
        continue;
      }

      console.log("Searching subject:", sCode);
      const subjectData = await Subject.findOne({ 
        code: { $regex: `^${sCode}$`, $options: "i" } 
      });

      if (!subjectData) {
        console.log("❌ Subject not found:", sCode);
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: `Subject ${sCode} not found` });
        continue;
      }

      if (!subjectData.faculty) {
        console.log("❌ Faculty missing for subject:", sCode);
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: `Subject ${sCode} has no faculty assigned` });
        continue;
      }

      const faculty = subjectData.faculty;

      await Mark.create({
        student: student._id,
        subject: subjectData._id,
        faculty: faculty, // REQUIRED FIELD
        score: Number(row.marks),
        maxScore: Number(row.maxscore) || 100,
        examType: (row.examtype || 'internal').toLowerCase(), // Enum is lowercase
        date: new Date()
      });
      summary.created++;
    } catch (err) {
      console.error(`❌ DB Error Row ${i + 1}:`, err.message);
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }
  return summary;
}

async function remove(id) {
  const record = await Mark.findByIdAndDelete(id);
  if (!record) throw new AppError("Mark record not found", 404);
  return record;
}

async function removeAll() {
  return Mark.deleteMany({});
}

async function getStudentAnalytics(studentId) {
  const Attendance = require("../models/Attendance");
  
  const currentStudent = await Student.findById(studentId).lean();
  const department = currentStudent?.department || "CSE";
  
  const marks = await Mark.find({ student: studentId }).populate("subject").lean();
  
  const subjectMap = {};
  marks.forEach(m => {
    if (!m.subject) return;
    const subId = m.subject._id.toString();
    if (!subjectMap[subId]) {
      subjectMap[subId] = {
        subject: m.subject.name,
        code: m.subject.code,
        marksObtained: 0,
        maxMarks: 0,
        exams: []
      };
    }
    subjectMap[subId].marksObtained += m.score;
    subjectMap[subId].maxMarks += m.maxScore;
    subjectMap[subId].exams.push({ type: m.examType, score: m.score, max: m.maxScore, percentage: (m.score / m.maxScore) * 100, date: m.date });
  });

  const subjectPerformance = Object.values(subjectMap).map(s => {
    const percentage = s.maxMarks > 0 ? (s.marksObtained / s.maxMarks) * 100 : 0;
    return {
      ...s,
      percentage: Number(percentage.toFixed(2)),
      status: percentage >= 40 ? "Pass" : "Fail",
      isRisk: percentage < 40,
      isWarning: percentage >= 40 && percentage < 50
    };
  });

  const examMap = {};
  marks.forEach(m => {
    if (!examMap[m.examType]) examMap[m.examType] = { totalScore: 0, totalMax: 0 };
    examMap[m.examType].totalScore += m.score;
    examMap[m.examType].totalMax += m.maxScore;
  });
  const trends = Object.keys(examMap).map(type => ({
    examType: type,
    percentage: Number(((examMap[type].totalScore / examMap[type].totalMax) * 100).toFixed(2))
  }));

  const totalPercentage = subjectPerformance.reduce((acc, curr) => acc + curr.percentage, 0) / (subjectPerformance.length || 1);
  const estimatedGpa = Number((totalPercentage / 9.5).toFixed(2)) || 0;
  
  const passedCount = subjectPerformance.filter(s => s.status === 'Pass').length;
  const failedCount = subjectPerformance.filter(s => s.status === 'Fail').length;

  const classmates = await Student.find({ department }).lean();
  const classmateIds = classmates.map(c => c._id);
  const classmateMarks = await Mark.find({ student: { $in: classmateIds } }).lean();
  
  const classmateAverages = {};
  classmates.forEach(c => {
    const cId = c._id.toString();
    const cMarks = classmateMarks.filter(m => m.student.toString() === cId);
    let totalScore = 0;
    let totalMax = 0;
    cMarks.forEach(m => {
      totalScore += m.score;
      totalMax += m.maxScore;
    });
    classmateAverages[cId] = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  });

  const sortedClassmates = Object.keys(classmateAverages).sort((a, b) => classmateAverages[b] - classmateAverages[a]);
  const rank = sortedClassmates.indexOf(studentId.toString()) + 1;

  const attendance = await Attendance.find({ student: studentId }).lean();
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendancePercentage = attendance.length > 0 ? Number(((presentCount / attendance.length) * 100).toFixed(2)) : 100;

  const sortedAttendance = attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (const record of sortedAttendance) {
    if (record.status === 'present') streak++;
    else break;
  }

  const badges = [];
  if (estimatedGpa >= 8.5) badges.push({ type: 'elite', label: '🏆 Elite Performer', desc: 'GPA is above 8.5' });
  else if (estimatedGpa >= 7.0) badges.push({ type: 'stellar', label: '⭐ Stellar Student', desc: 'Maintained GPA above 7.0' });
  
  if (streak >= 5) badges.push({ type: 'regular', label: '🔥 Perfect Attendance', desc: '5+ days present streak' });
  if (failedCount === 0) badges.push({ type: 'unstoppable', label: '⚡ Clean Sheet', desc: 'Passed all current subjects' });

  const heatmap = sortedAttendance.slice(0, 14).map(a => ({
    date: a.date,
    status: a.status === 'present' ? 1 : 0
  })).reverse();

  return {
    subjectPerformance,
    trends,
    heatmap,
    attendance: {
      percentage: attendancePercentage,
      streak
    },
    summary: {
      averagePercentage: Number(totalPercentage.toFixed(2)) || 0,
      estimatedGpa: estimatedGpa || 0,
      passedCount,
      failedCount,
      rank,
      totalStudents: classmates.length,
      badges,
      topSubject: [...subjectPerformance].sort((a,b) => b.percentage - a.percentage)[0] || null,
      weakestSubject: [...subjectPerformance].sort((a,b) => a.percentage - b.percentage)[0] || null
    }
  };
}

async function getFacultyAnalytics(facultyId) {
  const marks = await Mark.find({ faculty: facultyId }).populate("subject student").lean();
  
  const subjectMap = {};
  const studentMap = {};
  
  marks.forEach(m => {
    if (!m.subject || !m.student) return;
    
    const subId = m.subject._id.toString();
    if (!subjectMap[subId]) {
      subjectMap[subId] = {
        subject: m.subject.name,
        code: m.subject.code,
        totalScore: 0,
        totalMax: 0,
        students: {}
      };
    }
    subjectMap[subId].totalScore += m.score;
    subjectMap[subId].totalMax += m.maxScore;
    
    const stuId = m.student._id.toString();
    if(!subjectMap[subId].students[stuId]) subjectMap[subId].students[stuId] = { score: 0, max: 0 };
    subjectMap[subId].students[stuId].score += m.score;
    subjectMap[subId].students[stuId].max += m.maxScore;

    if (!studentMap[stuId]) {
      studentMap[stuId] = {
        name: m.student.name,
        rollNumber: m.student.admissionNo,
        department: m.student.department,
        section: m.student.section,
        totalScore: 0,
        totalMax: 0
      };
    }
    studentMap[stuId].totalScore += m.score;
    studentMap[stuId].totalMax += m.maxScore;
  });

  const subjectPerformance = Object.values(subjectMap).map(s => {
    let passCount = 0;
    const studentList = Object.values(s.students);
    studentList.forEach(st => {
      if ((st.score / st.max) * 100 >= 40) passCount++;
    });
    return {
      subject: s.subject,
      code: s.code,
      averagePercentage: Number(((s.totalScore / s.totalMax) * 100).toFixed(2)) || 0,
      passPercentage: Number(((passCount / (studentList.length || 1)) * 100).toFixed(2)) || 0
    };
  });

  const processedStudents = Object.values(studentMap).map(st => {
    const percentage = st.totalMax > 0 ? (st.totalScore / st.totalMax) * 100 : 0;
    return {
      ...st,
      percentage: Number(percentage.toFixed(2)),
      gpa: Number((percentage / 9.5).toFixed(2))
    };
  });

  const topStudents = [...processedStudents].sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  const weakStudents = processedStudents.filter(s => s.percentage < 50).slice(0, 5);

  let passCount = 0, failCount = 0;
  let distA = 0, distB = 0, distC = 0, distF = 0;
  
  marks.forEach(m => {
    const pct = (m.score / m.maxScore) * 100;
    if (pct >= 80) distA++;
    else if (pct >= 60) distB++;
    else if (pct >= 40) distC++;
    else distF++;
    
    if (pct >= 40) passCount++;
    else failCount++;
  });

  const totalExams = marks.length || 1;
  const distribution = [
    { range: '80-100 (Excellent)', count: distA },
    { range: '60-80 (Good)', count: distB },
    { range: '40-60 (Struggling)', count: distC },
    { range: '<40 (Failed)', count: distF }
  ];

  const sectionMap = {};
  marks.forEach(m => {
    if (!m.student) return;
    const sec = m.student.section || "A";
    if (!sectionMap[sec]) sectionMap[sec] = { total: 0, max: 0 };
    sectionMap[sec].total += m.score;
    sectionMap[sec].max += m.maxScore;
  });

  const sectionAnalytics = Object.keys(sectionMap).map(sec => ({
    section: `Section ${sec}`,
    average: Number(((sectionMap[sec].total / sectionMap[sec].max) * 100).toFixed(2)) || 0
  }));

  return { 
    subjectPerformance,
    topStudents,
    weakStudents,
    sectionAnalytics,
    distribution,
    overallPassRate: Number(((passCount / totalExams) * 100).toFixed(2)) || 0
  };
}

async function getAdminAnalytics() {
  const marks = await Mark.find().populate("subject student").lean();
  
  const deptMap = {};
  const subjectMap = {};
  const studentMap = {};
  const facultyMap = {};

  marks.forEach(m => {
    const dept = m.subject?.department || "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { totalScore: 0, totalMax: 0, passCount: 0, failCount: 0 };
    deptMap[dept].totalScore += m.score;
    deptMap[dept].totalMax += m.maxScore;
    
    const pct = m.maxScore > 0 ? (m.score / m.maxScore) * 100 : 0;
    if (pct >= 40) deptMap[dept].passCount++;
    else deptMap[dept].failCount++;

    if (m.subject) {
      const subCode = m.subject.code;
      if (!subjectMap[subCode]) {
        subjectMap[subCode] = {
          subject: m.subject.name,
          code: subCode,
          dept,
          total: 0,
          max: 0,
          pass: 0,
          fail: 0
        };
      }
      subjectMap[subCode].total += m.score;
      subjectMap[subCode].max += m.maxScore;
      if (pct >= 40) subjectMap[subCode].pass++;
      else subjectMap[subCode].fail++;
    }

    if (m.student) {
      const stuId = m.student._id.toString();
      if (!studentMap[stuId]) {
        studentMap[stuId] = {
          name: m.student.name,
          rollNumber: m.student.admissionNo,
          dept,
          total: 0,
          max: 0
        };
      }
      studentMap[stuId].total += m.score;
      studentMap[stuId].max += m.maxScore;
    }

    if (m.faculty) {
      const facId = m.faculty.toString();
      if (!facultyMap[facId]) {
        facultyMap[facId] = { total: 0, max: 0 };
      }
      facultyMap[facId].total += m.score;
      facultyMap[facId].max += m.maxScore;
    }
  });

  const departmentPerformance = Object.keys(deptMap).map(dept => {
    const d = deptMap[dept];
    const avg = Number(((d.totalScore / d.totalMax) * 100).toFixed(2)) || 0;
    return {
      department: dept,
      averagePercentage: avg,
      estimatedGpa: Number((avg / 9.5).toFixed(2)) || 0,
      passPercentage: Number(((d.passCount / (d.passCount + d.failCount || 1)) * 100).toFixed(2)) || 0
    };
  });

  const departmentRankings = [...departmentPerformance].sort((a, b) => b.averagePercentage - a.averagePercentage);

  const processedStudents = Object.values(studentMap).map(st => {
    const avg = st.max > 0 ? (st.total / st.max) * 100 : 0;
    return {
      name: st.name,
      rollNumber: st.rollNumber,
      department: st.dept,
      average: Number(avg.toFixed(2)),
      gpa: Number((avg / 9.5).toFixed(2)) || 0
    };
  });
  const institutionalToppers = processedStudents.sort((a, b) => b.average - a.average).slice(0, 5);

  const subjectDifficulty = Object.values(subjectMap).map(s => {
    const totalExams = s.pass + s.fail || 1;
    return {
      subject: s.subject,
      code: s.code,
      department: s.dept,
      failRate: Number(((s.fail / totalExams) * 100).toFixed(2)),
      average: Number(((s.total / s.max) * 100).toFixed(2))
    };
  }).sort((a, b) => b.failRate - a.failRate).slice(0, 5);

  const examMap = {};
  marks.forEach(m => {
    if (!examMap[m.examType]) examMap[m.examType] = { total: 0, max: 0 };
    examMap[m.examType].total += m.score;
    examMap[m.examType].max += m.maxScore;
  });
  const academicTrends = Object.keys(examMap).map(type => ({
    examType: type,
    percentage: Number(((examMap[type].total / examMap[type].max) * 100).toFixed(2)) || 0
  }));

  const instAvg = departmentPerformance.reduce((acc, curr) => acc + curr.averagePercentage, 0) / (departmentPerformance.length || 1);
  const totalGpa = Number((instAvg / 9.5).toFixed(2)) || 0;

  const totalPassed = departmentPerformance.reduce((acc, curr) => acc + (deptMap[curr.department]?.passCount || 0), 0);
  const totalFailed = departmentPerformance.reduce((acc, curr) => acc + (deptMap[curr.department]?.failCount || 0), 0);
  const passRate = Number(((totalPassed / (totalPassed + totalFailed || 1)) * 100).toFixed(2)) || 0;

  return {
    departmentPerformance,
    departmentRankings,
    subjectDifficulty,
    institutionalToppers,
    academicTrends,
    summary: {
      institutionalAverage: Number(instAvg.toFixed(2)) || 0,
      estimatedGpa: totalGpa,
      passRate,
      failureRate: Number((100 - passRate).toFixed(2)) || 0,
      topDept: departmentRankings[0]?.department || "N/A",
      weakDept: departmentRankings[departmentRankings.length - 1]?.department || "N/A"
    }
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  bulkUpload,
  removeAll,
  getStudentAnalytics,
  getFacultyAnalytics,
  getAdminAnalytics
};