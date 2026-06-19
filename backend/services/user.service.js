const AppError = require('../utils/appError');
const User = require('../models/User');

async function findRawByEmail(email) {
  return User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');
}

async function list(query = {}) {
  const { page = 1, limit = 10, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

async function getById(id, selectPassword = false) {
  let query = User.findById(id);
  if (selectPassword) query = query.select('+passwordHash');
  const user = await query;
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function create(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError('User email already exists', 409);
  }

  return User.create(payload);
}

async function update(id, payload) {
  if (payload.email) {
    const existing = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: id } });
    if (existing) {
      throw new AppError('User email already exists', 409);
    }
  }

  const user = await User.findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function remove(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  findRawByEmail
};