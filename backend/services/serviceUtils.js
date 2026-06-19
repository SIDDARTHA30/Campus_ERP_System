const AppError = require('../utils/appError');
const config = require('../config');
const { sanitizePagination, buildPaginationResult } = require('../utils/pagination');

function ensureFound(record, message) {
  if (!record) {
    throw new AppError(message, 404);
  }

  return record;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function applySearch(items, search, fields) {
  if (!search) {
    return items;
  }

  const query = normalizeText(search);
  return items.filter((item) => fields.some((field) => normalizeText(item[field]).includes(query)));
}

function applySort(items, sortBy, sortOrder = 'desc', fallbackField = 'createdAt') {
  const field = sortBy || fallbackField;
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];

    if (leftValue === rightValue) {
      return 0;
    }

    return leftValue > rightValue ? direction : -direction;
  });
}

function applyPagination(items, query) {
  const { page, limit, skip } = sanitizePagination(query, config.pagination);
  const paginatedItems = items.slice(skip, skip + limit);
  return buildPaginationResult(paginatedItems, items.length, page, limit);
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }

  return false;
}

function asNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

module.exports = {
  ensureFound,
  normalizeText,
  applySearch,
  applySort,
  applyPagination,
  toBoolean,
  asNumber
};