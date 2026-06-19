const AppError = require("../utils/appError");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");

const { sanitizeQuery } = require('../utils/queryHelper');

async function list(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { department, faculty, semester, sortBy = "createdAt", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Subjects → capped to 10000');
  const filter = {};

  if (department) filter.department = department;
  if (faculty) filter.faculty = faculty;
  if (semester) filter.semester = Number(semester);
  
  if (search) {
    const faculties = await Faculty.find({ name: { $regex: search, $options: "i" } }).select("_id").lean();
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { faculty: { $in: faculties.map(f => f._id) } }
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Subject.find(filter).populate("faculty").sort(sort).skip(skip).limit(numericLimit).lean(),
    Subject.countDocuments(filter)
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
  const subject = await Subject.findById(id).populate("faculty");
  if (!subject) throw new AppError("Subject not found", 404);
  return subject;
}

async function create(payload) {
  const codeDuplicate = await Subject.findOne({ code: { $regex: new RegExp(`^${payload.code}$`, "i") } });
  if (codeDuplicate) {
    throw new AppError("Subject code already exists", 409);
  }

  if (payload.faculty) {
    const faculty = await Faculty.findById(payload.faculty);
    if (!faculty) throw new AppError("Faculty not found", 404);
  }

  return Subject.create(payload);
}

async function update(id, payload) {
  if (payload.code) {
    const codeDuplicate = await Subject.findOne({ 
      code: { $regex: new RegExp(`^${payload.code}$`, "i") },
      _id: { $ne: id }
    });
    if (codeDuplicate) {
      throw new AppError("Subject code already exists", 409);
    }
  }

  if (payload.faculty) {
    const faculty = await Faculty.findById(payload.faculty);
    if (!faculty) throw new AppError("Faculty not found", 404);
  }

  const subject = await Subject.findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true });
  if (!subject) throw new AppError("Subject not found", 404);
  return subject;
}

async function bulkUpload(results) {
  const summary = { created: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    try {
      // 1. Key Normalization & Validation
      const code = row.code?.trim()?.toUpperCase();
      const name = row.name?.trim();
      const department = row.department?.trim();
      const semester = row.semester?.trim();

      if (!code) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing subject code" });
        continue;
      }

      if (!name || !department || !semester) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing required fields (name, department, semester)" });
        continue;
      }

      // 2. Strict Faculty Mapping
      const fCode = (row.facultyId || "").toString().trim();
      const facultyData = fCode ? await Faculty.findOne({ 
        employeeCode: { $regex: `^${fCode}$`, $options: "i" } 
      }).lean() : null;

      const faculty = facultyData?._id;

      // 3. Robust Atomic Upsert
      const updateData = { code }; // Ensure normalized code is stored
      if (name) updateData.name = name;
      if (department) updateData.department = department;
      if (faculty) updateData.faculty = faculty;
      if (row.credits) updateData.credits = Number(row.credits);
      if (semester) updateData.semester = Number(semester);
      if (row.classname || row.className) updateData.className = row.classname || row.className;

      const result = await Subject.findOneAndUpdate(
        { code },
        { $set: updateData },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, setDefaultsOnInsert: true }
      );

      if (result.lastErrorObject.upserted) {
        summary.created++;
      } else {
        summary.updated++;
      }
    } catch (err) {
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }
  
  return {
    created: summary.created,
    updated: summary.updated,
    skipped: summary.skipped,
    errors: summary.errors
  };
}

async function remove(id) {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) throw new AppError("Subject not found", 404);
  return subject;
}

async function removeAll() {
  return Subject.deleteMany({});
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  bulkUpload,
  removeAll
};