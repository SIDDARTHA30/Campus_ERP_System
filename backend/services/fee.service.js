const AppError = require("../utils/appError");
const Fee = require("../models/Fee");
const Student = require("../models/Student");

const { sanitizeQuery, enforceRoleFilters } = require('../utils/queryHelper');

async function list(query = {}, user) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { student, status, sortBy = "createdAt", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Fees → capped to 10000');
  let filter = {};

  // Enforce Privacy (Double Layer Security)
  filter = enforceRoleFilters(filter, user, query);

  if (student) filter.student = student;
  if (status) filter.status = status;
  
  if (search) {
    const students = await Student.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { admissionNo: { $regex: search, $options: "i" } }
      ]
    }).select("_id").lean();
    
    filter.$or = [
      { student: { $in: students.map(s => s._id) } },
      { type: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } }
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Fee.find(filter).populate("student").sort(sort).skip(skip).limit(numericLimit).lean(),
    Fee.countDocuments(filter)
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
  const fee = await Fee.findById(id).populate("student");
  if (!fee) throw new AppError("Fee record not found", 404);
  return fee;
}

async function create(payload) {
  if (payload.student) {
    const student = await Student.findById(payload.student);
    if (!student) throw new AppError("Student not found", 404);
  }
  return Fee.create(payload);
}

async function update(id, payload) {
  if (payload.student) {
    const student = await Student.findById(payload.student);
    if (!student) throw new AppError("Student not found", 404);
  }
  const fee = await Fee.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!fee) throw new AppError("Fee record not found", 404);
  return fee;
}

async function remove(id) {
  const fee = await Fee.findByIdAndDelete(id);
  if (!fee) throw new AppError("Fee record not found", 404);
  return fee;
}

async function bulkUpload(rows) {
  const summary = { 
    total: rows.length,
    created: 0, 
    duplicates: 0,
    invalid: 0,
    skipped: 0, 
    errors: [] 
  };
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const sId = (row.studentId || "").toString().trim();
      if (!sId) {
        summary.invalid++;
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing Student ID", code: "INVALID" });
        console.error(`[Fee Bulk Upload Error] Row ${i + 1}: Missing Student ID`);
        continue;
      }
      
      const student = await Student.findOne({ admissionNo: { $regex: `^${sId}$`, $options: "i" } });
      if (!student) {
        summary.invalid++;
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: `Student '${sId}' not found`, code: "INVALID" });
        console.error(`[Fee Bulk Upload Error] Row ${i + 1}: Student '${sId}' not found`);
        continue;
      }

      const term = (row.term || "Term 1").toString().trim();
      const feeType = row.feeType || 'Tuition Fee';
      
      // Duplicate detection before insert (same student + same term + same feeType)
      const existingFee = await Fee.findOne({
        student: student._id,
        term: { $regex: `^${term}$`, $options: "i" },
        feeType: { $regex: `^${feeType}$`, $options: "i" }
      });
      
      if (existingFee) {
        summary.duplicates++;
        summary.skipped++;
        summary.errors.push({ 
          row: i + 1, 
          error: `Duplicate fee record already exists for term '${term}' and type '${feeType}'`, 
          code: "DUPLICATE" 
        });
        console.warn(`[Fee Bulk Upload Duplicate] Row ${i + 1}: Student '${sId}' already has '${feeType}' for '${term}'`);
        continue;
      }

      const amount = Number(row.amount) || 0;
      const paidAmount = Number(row.paidAmount) || 0;
      
      // Auto-compute status
      let calculatedStatus = 'pending';
      if (paidAmount >= amount && amount > 0) {
        calculatedStatus = 'paid';
      } else if (paidAmount > 0 && paidAmount < amount) {
        calculatedStatus = 'partial';
      }

      // Auto-compute type enum
      const rawFeeType = feeType.toLowerCase().trim();
      const validTypes = ['tuition', 'library', 'exam', 'hostel', 'other'];
      const mappedType = validTypes.includes(rawFeeType) ? rawFeeType : 'other';

      await Fee.create({
        student: student._id,
        term: term,
        feeType: feeType,
        amount: amount,
        paidAmount: paidAmount,
        type: mappedType,
        status: calculatedStatus,
        dueDate: row.dueDate ? new Date(row.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remarks: row.remarks || "Bulk uploaded"
      });
      summary.created++;
    } catch (err) {
      summary.invalid++;
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message, code: "INVALID" });
      console.error(`[Fee Bulk Upload Error] Row ${i + 1}: ${err.message}`);
    }
  }
  return summary;
}

async function removeAll() {
  return Fee.deleteMany({});
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  removeAll,
  bulkUpload
};