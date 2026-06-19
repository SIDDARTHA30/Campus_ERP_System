const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

module.exports = {
  getStats: asyncHandler(async (req, res) => {
    let data;
    if (req.user.role === 'admin') {
      data = await dashboardService.getAdminStats();
    } else if (req.user.role === 'student') {
      data = await dashboardService.getStudentStats(req.user.studentId);
    } else if (req.user.role === 'faculty') {
      data = await dashboardService.getFacultyStats(req.user.facultyId);
    }
    res.json(successResponse('Dashboard stats fetched successfully', data));
  })
};
