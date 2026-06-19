const express = require('express');
const usersRoutes = require('./users.routes');
const studentsRoutes = require('./students.routes');
const facultyRoutes = require('./faculty.routes');
const subjectsRoutes = require('./subjects.routes');
const attendanceRoutes = require('./attendance.routes');
const marksRoutes = require('./marks.routes');
const materialsRoutes = require('./materials.routes');
const noticesRoutes = require('./notices.routes');
const feesRoutes = require('./fees.routes');
const libraryRoutes = require('./library.routes');
const dashboardRoutes = require('./dashboard.routes');
const authRoutes = require('./auth.routes');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRoutes);

router.use(protect);

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);
router.use('/faculty', facultyRoutes);
router.use('/subjects', subjectsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/marks', marksRoutes);
router.use('/materials', materialsRoutes);
router.use('/notices', noticesRoutes);
router.use('/fees', feesRoutes);
router.use('/library', libraryRoutes);

module.exports = router;