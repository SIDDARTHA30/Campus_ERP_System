const AppError = require("../utils/appError");
const Attendance = require("../models/Attendance");
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

const { sanitizeQuery, enforceRoleFilters } = require('../utils/queryHelper');

async function list(query = {}, user) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { student, subject, faculty, status, from, to, sortBy = "date", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Attendance → capped to 10000');
  let filter = {};

  // Enforce Privacy (Double Layer Security)
  filter = enforceRoleFilters(filter, user, query);
  
  if (subject) filter.subject = subject;
  if (status) filter.status = status;
  
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
      { subject: { $in: subjects.map(s => s._id) } }
    ];
  }
  
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate("student")
      .populate("subject")
      .populate("faculty")
      .sort(sort)
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Attendance.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / (numericLimit || 1))
    }
  };
}

async function getById(id) {
  const record = await Attendance.findById(id)
    .populate("student")
    .populate("subject")
    .populate("faculty");
  if (!record) throw new AppError("Attendance record not found", 404);
  return record;
}

async function create(payload) {
  await validateRelations(payload);
  try {
    return await Attendance.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("Attendance record already exists for this student, subject, and date", 409);
    }
    throw error;
  }
}

async function update(id, payload) {
  await validateRelations(payload);
  const record = await Attendance.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!record) throw new AppError("Attendance record not found", 404);
  return record;
}

async function bulkUpload(results) {
  const summary = { created: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    try {
      const { studentid, subjectcode, date, status } = row;
      
      if (!studentid || !subjectcode || !date || !status) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing required fields (studentid, subjectcode, date, status)" });
        continue;
      }

      const sId = row.studentid.trim();
      const sCode = row.subjectcode.trim();

      console.log(`--- Attendance Row ${i + 1} ---`);
      console.log("Searching student:", sId);
      const student = await Student.findOne({ 
        admissionNo: { $regex: `^${sId}$`, $options: "i" } 
      });

      console.log("Searching subject:", sCode);
      const subject = await Subject.findOne({ 
        code: { $regex: `^${sCode}$`, $options: "i" } 
      });
      console.log(`DB Match Subject: ${subject?.code || "NOT FOUND"}`);

      if (!subject) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: `Subject ${sCode} not found in database` });
        continue;
      }

      await Attendance.create({
        student: student._id,
        subject: subject._id,
        faculty: subject.faculty, // Required by DB
        date: new Date(row.date),
        status: (row.status || 'present').toLowerCase() // Enum is lowercase
      });
      summary.created++;
    } catch (err) {
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }
  return summary;
}

async function getAnalytics(query = {}, user) {
  let filter = {};
  filter = enforceRoleFilters(filter, user, query);

  // 1. Subject-wise Attendance Analysis
  const subjectWise = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$subject",
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subjectDetails"
      }
    },
    { $unwind: "$subjectDetails" },
    {
      $project: {
        name: "$subjectDetails.name",
        code: "$subjectDetails.code",
        present: 1,
        total: 1,
        percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] }
      }
    },
    { $sort: { percentage: -1 } }
  ]);

  // 2. Risk Alerts (Shortage < 75%)
  const riskAlerts = subjectWise.filter(s => s.percentage < 75);

  // 3. Weekly Trends (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyTrend = await Attendance.aggregate([
    { $match: { ...filter, date: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    {
      $project: {
        date: "$_id",
        percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] }
      }
    },
    { $sort: { date: 1 } }
  ]);

  // 4. Heatmap Data (Activity by Date)
  const heatmapData = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        status: { $push: "$status" }
      }
    },
    {
      $project: {
        date: "$_id",
        count: { $size: "$status" },
        status: 1
      }
    },
    { $sort: { date: 1 } }
  ]);

  // 5. Streak Calculation (Student Only)
  let streak = { current: 0, best: 0 };
  if (user.role === 'student' || query.student) {
    const allAttendance = await Attendance.find({ 
      student: user.studentId || query.student,
      status: 'present'
    }).sort({ date: -1 }).select('date').lean();

    if (allAttendance.length > 0) {
      let current = 0;
      let best = 0;
      let temp = 0;
      
      // Simplified streak (consecutive records in DB)
      // For a real production app, you'd check day-by-day gaps
      current = 1; // Start with 1 if we have at least one record
      for(let i=0; i < allAttendance.length - 1; i++) {
        const diff = (allAttendance[i].date - allAttendance[i+1].date) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) { // Roughly 1 day gap
          temp++;
        } else {
          best = Math.max(best, temp);
          temp = 0;
        }
      }
      streak.current = temp + 1;
      streak.best = Math.max(best, temp + 1);
    }
  }

  // 6. Admin/Institutional Stats
  let adminStats = null;
  if (user.role === 'admin') {
    const deptStats = await Student.aggregate([
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student',
          as: 'attendance'
        }
      },
      { $unwind: { path: '$attendance', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$department',
          present: { $sum: { $cond: [{ $eq: ["$attendance.status", "present"] }, 1, 0] } },
          total: { $sum: { $cond: [{ $ifNull: ["$attendance._id", false] }, 1, 0] } }
        }
      },
      {
        $project: {
          department: "$_id",
          percentage: { 
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);
    adminStats = { deptStats };
  }

  return {
    subjectWise,
    riskAlerts,
    weeklyTrend,
    heatmapData,
    streak,
    adminStats
  };
}

async function remove(id) {
  const record = await Attendance.findByIdAndDelete(id);
  if (!record) throw new AppError("Attendance record not found", 404);
  return record;
}

async function removeAll() {
  return Attendance.deleteMany({});
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  bulkUpload,
  removeAll,
  getAnalytics
};