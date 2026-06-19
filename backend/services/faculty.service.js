const mongoose = require("mongoose");
const config = require("../config");
const AppError = require("../utils/appError");
const Faculty = require("../models/Faculty");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Mark = require("../models/Mark");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('./email.service');

const { sanitizeQuery } = require('../utils/queryHelper');

async function list(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { department, status, sortBy = "createdAt", sortOrder = "desc" } = query;

  if (isAll) console.log('⚠️ limit=all requested in Faculty → capped to 10000');
  const filter = {};

  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeCode: { $regex: search, $options: "i" } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Faculty.find(filter)
      .populate("user")
      .populate("subjects")
      .sort(sort)
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Faculty.countDocuments(filter)
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
  const faculty = await Faculty.findById(id).populate("user").populate("subjects");
  if (!faculty) throw new AppError("Faculty not found", 404);
  return faculty;
}

async function create(payload, session = null) {
  const ownSession = !session;
  const activeSession = session || (await mongoose.startSession());
  if (ownSession) activeSession.startTransaction();

  try {
    const email = payload.email?.trim().toLowerCase();
    const employeeCode = payload.employeeCode?.trim().toUpperCase();

    if (!employeeCode) throw new AppError("Employee code is required", 400);

    const codeDuplicate = await Faculty.findOne({ 
      employeeCode: { $regex: new RegExp(`^${employeeCode}$`, "i") } 
    }).session(activeSession);
    if (codeDuplicate) {
      throw new AppError("Employee code already exists", 409);
    }

    if (!payload.user) {
      if (!email) throw new AppError("Email is required to create a user account", 400);

      let user = await User.findOne({ email }).session(activeSession);
      
      if (!user) {
        const defaultPassword = `${employeeCode}@faculty`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

        const newUser = await User.create([{
          name: payload.name,
          email: email,
          passwordHash,
          role: 'faculty',
          phone: payload.phone || '',
          status: 'active',
          isVerified: process.env.EMAIL_VERIFICATION === 'false',
          mustChangePassword: true,
          verificationToken,
          verificationTokenExpire
        }], { session: activeSession });
        user = newUser[0];

        await emailService.sendVerificationEmail(user, verificationToken, defaultPassword);
        console.log(`✅ [FacultyService] Faculty created & Email sent to: ${email}`);
      }
      payload.user = user._id;
    }

    const faculty = await Faculty.create([payload], { session: activeSession });
    if (ownSession) await activeSession.commitTransaction();
    return faculty[0];
  } catch (error) {
    if (ownSession) await activeSession.abortTransaction();
    throw error;
  } finally {
    if (ownSession) activeSession.endSession();
  }
}

async function bulkUpload(results) {
  const summary = { created: 0, updated: 0, skipped: 0, errors: [] };
  
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    try {
      const employeeCode = row.employeeCode?.trim()?.toUpperCase();
      const email = row.email?.trim()?.toLowerCase();
      const name = row.name?.trim();
      const department = row.department?.trim();

      if (!employeeCode || !email || !name || !department) {
        summary.skipped++;
        summary.errors.push({ row: i + 1, error: "Missing required fields (employeeCode, email, name, department)" });
        continue;
      }

      const facultyResult = await Faculty.findOneAndUpdate(
        { employeeCode },
        { $set: { employeeCode, email, name, department, designation: row.designation?.trim() } },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, setDefaultsOnInsert: true }
      );

      const faculty = facultyResult.value;

      if (facultyResult.lastErrorObject.upserted) {
        const defaultPassword = `${employeeCode}@faculty`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

        const newUser = await User.create({
          name,
          email,
          passwordHash,
          role: 'faculty',
          status: 'active',
          isVerified: process.env.EMAIL_VERIFICATION === 'false',
          mustChangePassword: true,
          verificationToken,
          verificationTokenExpire
        });

        await Faculty.findByIdAndUpdate(faculty._id, { $set: { user: newUser._id } });
        await emailService.sendVerificationEmail(newUser, verificationToken, defaultPassword);
        
        summary.created++;
      } else {
        summary.updated++;
      }
    } catch (err) {
      summary.skipped++;
      summary.errors.push({ row: i + 1, error: err.message });
    }
  }
  
  return summary;
}

async function update(id, payload) {
  if (payload.employeeCode) {
    const codeDuplicate = await Faculty.findOne({ 
      employeeCode: { $regex: new RegExp(`^${payload.employeeCode}$`, "i") },
      _id: { $ne: id }
    });
    if (codeDuplicate) {
      throw new AppError("Employee code already exists", 409);
    }
  }

  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
    const duplicateEmail = await Faculty.findOne({ 
      email: payload.email,
      _id: { $ne: id }
    });
    if (duplicateEmail) {
      throw new AppError("Faculty email already exists", 409);
    }
  }

  const faculty = await Faculty.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!faculty) throw new AppError("Faculty not found", 404);
  return faculty;
}

async function remove(id) {
  const faculty = await Faculty.findById(id);
  if (!faculty) throw new AppError("Faculty not found", 404);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (faculty.user) {
      const userToDelete = await User.findById(faculty.user);
      if (userToDelete && userToDelete.role === 'faculty') {
        await User.findByIdAndDelete(faculty.user).session(session);
      }
    }
    await Attendance.deleteMany({ faculty: id }).session(session);
    await Mark.deleteMany({ faculty: id }).session(session);
    await Faculty.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return faculty;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function removeAll() {
  await Faculty.deleteMany({});
  return User.deleteMany({ role: 'faculty' });
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