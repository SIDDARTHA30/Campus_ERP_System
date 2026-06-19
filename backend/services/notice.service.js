const AppError = require("../utils/appError");
const Notice = require("../models/Notice");

const { sanitizeQuery } = require('../utils/queryHelper');

async function list(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { category, targetRole, sortBy = "createdAt", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Notices → capped to 10000');
  const filter = {};

  if (category) filter.category = category;
  if (targetRole) filter.targetRoles = targetRole;
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } }
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Notice.find(filter).populate("author").sort(sort).skip(skip).limit(numericLimit).lean(),
    Notice.countDocuments(filter)
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
  const notice = await Notice.findById(id).populate("author");
  if (!notice) throw new AppError("Notice not found", 404);
  return notice;
}

async function create(payload) {
  return Notice.create(payload);
}

async function update(id, payload) {
  const notice = await Notice.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!notice) throw new AppError("Notice not found", 404);
  return notice;
}

async function remove(id) {
  const notice = await Notice.findByIdAndDelete(id);
  if (!notice) throw new AppError("Notice not found", 404);
  return notice;
}

async function bulkUpload(rows, adminId) {
  const summary = { created: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.title || !row.content) {
        throw new Error("Title and content are required");
      }

      await Notice.create({
        title: row.title,
        content: row.content,
        author: adminId,
        category: row.category || 'general',
        targetRoles: row.targetRoles ? row.targetRoles.split(",").map(r => r.trim().toLowerCase()) : ['student'],
        isPinned: row.isPinned === 'true' || row.isPinned === true,
        expiryDate: row.expiryDate ? new Date(row.expiryDate) : null
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
  return Notice.deleteMany({});
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