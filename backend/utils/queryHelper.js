const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Sanitizes and clamps pagination and search parameters.
 * @param {Object} query - Express request query object
 * @returns {Object} Sanitized parameters
 */
const sanitizeQuery = (query = {}) => {
  const { page, limit, search } = query;
  
  // 1. Pagination Clamping
  const pageNum = Math.max(1, Number(page) || 1);
  const isAll = limit === 'all';
  
  // Cap standard pages to 100, but allow 10000 for 'all' mode
  const numericLimit = isAll 
    ? 10000 
    : Math.min(100, Math.max(1, Number(limit) || 10));
    
  const skip = isAll ? 0 : (pageNum - 1) * numericLimit;

  // 2. Regex Escaping for safe searching
  const escapedSearch = escapeRegex(search?.trim());

  return {
    page: pageNum,
    limit: isAll ? 'all' : numericLimit,
    numericLimit,
    skip,
    search: escapedSearch,
    isAll
  };
};

/**
 * Enforces role-based filters on a database query object.
 * @param {Object} filter - The Mongoose filter object to modify
 * @param {Object} user - The authenticated user object from req.user
 * @param {Object} query - The raw request query
 */
const enforceRoleFilters = (filter, user, query = {}) => {
  if (!user) return filter;

  if (user.role === 'student') {
    filter.student = user.studentId;
  } else if (user.role === 'faculty') {
    filter.faculty = user.facultyId;
  } else {
    // Admin can filter by anything provided in query
    if (query.student) filter.student = query.student;
    if (query.faculty) filter.faculty = query.faculty;
  }
  
  return filter;
};

module.exports = {
  escapeRegex,
  sanitizeQuery,
  enforceRoleFilters
};
