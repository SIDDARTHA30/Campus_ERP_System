function successResponse(message, data = null) {
  // If data is a paginated result, flatten it (with array safety)
  if (data && Array.isArray(data.items) && data.pagination) {
    return {
      success: true,
      message,
      data: data.items,
      pagination: data.pagination
    };
  }
  return {
    success: true,
    message,
    data
  };
}

function errorResponse(message, data = null) {
  return {
    success: false,
    message,
    data
  };
}

module.exports = {
  successResponse,
  errorResponse
};