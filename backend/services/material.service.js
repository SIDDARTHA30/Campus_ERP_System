const { v4: uuidv4 } = require('uuid');
const Material = require('../models/Material');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const { applySearch, applySort, applyPagination } = require('./serviceUtils');
const AppError = require('../utils/appError');

async function validateRelations(payload) {
  if (payload.subject) {
    const subject = await Subject.findById(payload.subject);
    if (!subject) throw new AppError('Subject not found', 404);
  }
  if (payload.faculty) {
    const faculty = await Faculty.findById(payload.faculty);
    if (!faculty) throw new AppError('Faculty not found', 404);
  }
}

const { sanitizeQuery } = require('../utils/queryHelper');

async function list(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { subject, faculty, classId, sortBy = 'uploadedAt', sortOrder = 'desc' } = query;

  if (isAll) console.log('⚠️ limit=all requested in Materials → capped to 10000');
  const filter = {};

  if (subject) filter.subject = subject;
  if (faculty) filter.faculty = faculty;
  if (classId) filter.classId = classId;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { classId: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Material.find(filter).populate('subject').populate('faculty').sort(sort).skip(skip).limit(numericLimit).lean(),
    Material.countDocuments(filter)
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
  const record = await Material.findById(id).populate('subject').populate('faculty');
  if (!record) throw new AppError('Material not found', 404);
  return record;
}

async function create(payload) {
  await validateRelations(payload);

  const data = {
    ...payload,
    fileUrl: payload.fileUrl || `https://files.campus.local/materials/${uuidv4()}.pdf`,
    uploadedAt: payload.uploadedAt || new Date()
  };

  return Material.create(data);
}

async function update(id, payload) {
  const existing = await Material.findById(id);
  if (!existing) throw new AppError('Material not found', 404);

  if (payload.subject || payload.faculty) {
    await validateRelations({ subject: payload.subject || existing.subject, faculty: payload.faculty || existing.faculty });
  }

  if (!payload.fileUrl && !existing.fileUrl) {
    payload.fileUrl = `https://files.campus.local/materials/${uuidv4()}.pdf`;
  }

  const updated = await Material.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!updated) throw new AppError('Material not found', 404);
  return updated;
}

async function remove(id) {
  const existing = await Material.findById(id);
  if (!existing) throw new AppError('Material not found', 404);
  return await Material.findByIdAndDelete(id);
}

async function bulkUpload(rows) {
  const summary = { created: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const sCode = (row.subjectCode || "").toString().trim();
      const fCode = (row.facultyId || "").toString().trim();
      
      const [subject, faculty] = await Promise.all([
        Subject.findOne({ code: { $regex: `^${sCode}$`, $options: "i" } }),
        Faculty.findOne({ employeeCode: { $regex: `^${fCode}$`, $options: "i" } })
      ]);

      if (!subject || !faculty) {
        summary.skipped++;
        summary.errors.push({ 
          row: i + 1, 
          error: !subject ? `Subject ${sCode} not found` : `Faculty ${fCode} not found` 
        });
        continue;
      }

      await Material.create({
        title: row.title,
        description: row.description || "",
        subject: subject._id,
        faculty: faculty._id,
        classId: row.classId || "",
        tags: row.tags ? row.tags.split(",").map(t => t.trim()) : [],
        fileUrl: row.fileUrl || `https://files.campus.local/materials/${uuidv4()}.pdf`
      });
      summary.created++;
    } catch (err) {
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }
  return summary;
}

async function removeAll() {
  return Material.deleteMany({});
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