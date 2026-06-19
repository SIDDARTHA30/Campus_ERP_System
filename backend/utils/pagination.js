function sanitizePagination(query = {}, fallback = {}) {
  const defaultPage = fallback.defaultPage || 1;
  const defaultLimit = fallback.defaultLimit || 10;
  const maxLimit = fallback.maxLimit || 100;

  const page = Math.max(parseInt(query.page, 10) || defaultPage, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildPaginationResult(items, total, page, limit) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = {
  sanitizePagination,
  buildPaginationResult
};