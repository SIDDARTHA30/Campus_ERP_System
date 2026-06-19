const mongoose = require('mongoose');
const config = require('../config');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const LibraryIssue = require('../models/LibraryIssue');
const Fee = require('../models/Fee');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');
const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const emailService = require('./email.service');

const { sanitizeQuery } = require('../utils/queryHelper');

async function list(query = {}) {
  const { page, limit, numericLimit, skip, search, isAll } = sanitizeQuery(query);
  const { department, year, section, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  
  if (isAll) console.log('⚠️ limit=all requested in Students → capped to 10000');
  const filter = {};

  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (section) filter.section = section;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }, { admissionNo: { $regex: search, $options: 'i' } }];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate('user')
      .sort(sort)
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Student.countDocuments(filter)
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
  const student = await Student.findById(id).populate('user');
  if (!student) throw new AppError('Student not found', 404);
  return student;
}

async function create(payload, session) {
  const email = payload.email?.trim().toLowerCase();
  const admissionNo = payload.admissionNo?.toUpperCase();
  const activeSession = session || (await mongoose.startSession());

  const admissionDuplicate = await Student.findOne({ admissionNo }).session(activeSession);
  if (admissionDuplicate) {
    throw new AppError('Admission number already exists', 409);
  }

  // 1. Auto-create User account with default password: ROLLNUMBER@student
  if (!payload.user) {
    if (!email) throw new AppError('Email is required to create a user account', 400);
    
    let user = await User.findOne({ email }).session(activeSession);
    
    if (user) {
      if (user.role !== 'student') {
        throw new AppError(`Email already registered as a ${user.role}`, 400);
      }
    } else {
      const defaultPassword = `${admissionNo}@student`;
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h

      const newUser = await User.create([{
        name: payload.name,
        email: email,
        passwordHash,
        role: 'student',
        phone: payload.phone || '',
        status: 'active',
        isVerified: process.env.EMAIL_VERIFICATION === 'false',
        mustChangePassword: true,
        verificationToken,
        verificationTokenExpire
      }], { session: activeSession });
      user = newUser[0];
      
      // Send verification email
      await emailService.sendVerificationEmail(user, verificationToken, defaultPassword);
      console.log(`✅ [StudentService] Student created & Email sent to: ${email}`);
    }
    payload.user = user._id;
  }

  const student = await Student.create([payload], { session: activeSession });
  return student[0];
}

async function bulkUpload(filePath) {
  const report = { created: 0, updated: 0, skipped: 0, errors: [] };

  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
      }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            try {
              const admissionNo = (row.admissionno || row.admissionNo || "").toString().trim().toUpperCase();
              if (!admissionNo) {
                report.skipped++;
                report.errors.push({ row: results.indexOf(row) + 1, error: "Missing admission number" });
                continue;
              }

              const email = (row.email || "").trim().toLowerCase();
              if (!email) {
                report.skipped++;
                report.errors.push({ row: results.indexOf(row) + 1, error: "Missing email" });
                continue;
              }

              const payload = {
                ...row,
                admissionNo,
                email,
                dateOfBirth: row.dateofbirth || row.dateOfBirth,
                year: Number(row.year) || 1,
                gender: (row.gender || "").toLowerCase().trim(),
                status: (row.status || "active").toLowerCase().trim()
              };

              const studentResult = await Student.findOneAndUpdate(
                { admissionNo },
                { $set: payload },
                { upsert: true, returnDocument: 'after', includeResultMetadata: true, setDefaultsOnInsert: true }
              );

              const student = studentResult.value;

              if (studentResult.lastErrorObject.upserted) {
                // Created new student, create User account
                const defaultPassword = `${admissionNo}@student`;
                const passwordHash = await bcrypt.hash(defaultPassword, 10);
                
                const verificationToken = crypto.randomBytes(32).toString('hex');
                const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

                const newUser = await User.create({
                  name: payload.name || 'Student',
                  email: email,
                  passwordHash,
                  role: 'student',
                  status: 'active',
                  isVerified: process.env.EMAIL_VERIFICATION === 'false',
                  mustChangePassword: true,
                  verificationToken,
                  verificationTokenExpire
                });
                
                await Student.findByIdAndUpdate(student._id, { user: newUser._id });
                await emailService.sendVerificationEmail(newUser, verificationToken, defaultPassword);
                
                report.created++;
              } else {
                report.updated++;
              }
            } catch (e) {
              console.log("❌ ERROR Row", results.indexOf(row) + 1, ":", e.message);
              report.skipped++;
              report.errors.push({ row: results.indexOf(row) + 1, error: e.message });
            }
          }
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          resolve(report);
        } catch (error) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(error);
        }
      })
      .on('error', (error) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(error);
      });
  });
}

async function update(id, payload) {
  if (payload.admissionNo) {
    const admissionDuplicate = await Student.findOne({ admissionNo: payload.admissionNo.toUpperCase(), _id: { $ne: id } });
    if (admissionDuplicate) {
      throw new AppError('Admission number already exists', 409);
    }
  }

  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
    const duplicateEmail = await Student.findOne({ email: payload.email, _id: { $ne: id } });
    if (duplicateEmail) {
      throw new AppError('Student email already exists', 409);
    }
  }

  const student = await Student.findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true });
  if (!student) throw new AppError('Student not found', 404);
  return student;
}

async function remove(id) {
  const student = await Student.findById(id);
  if (!student) throw new AppError('Student not found', 404);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (student.user) {
      const userToDelete = await User.findById(student.user);
      if (userToDelete && userToDelete.role === 'student') {
        await User.findByIdAndDelete(student.user).session(session);
      }
    }
    await Attendance.deleteMany({ student: id }).session(session);
    await Mark.deleteMany({ student: id }).session(session);
    await LibraryIssue.deleteMany({ student: id }).session(session);
    await Fee.deleteMany({ student: id }).session(session);
    await Student.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return student;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function removeAll() {
  await Student.deleteMany({});
  return User.deleteMany({ role: 'student' });
}

module.exports = {
  list,
  getById,
  create,
  bulkUpload,
  update,
  remove,
  removeAll
};