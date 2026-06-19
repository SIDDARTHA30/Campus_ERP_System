const Joi = require('joi');

const roleValues = ['admin', 'faculty', 'student'];
const statusValues = ['active', 'inactive'];
const attendanceStatusValues = ['present', 'absent', 'late', 'excused'];
const examTypes = ['internal', 'mid', 'semester', 'assignment', 'quiz'];
const noticeAudiences = ['all', 'students', 'faculty', 'admins', 'department'];
const priorityValues = ['low', 'normal', 'high'];
const feeStatuses = ['paid', 'pending', 'partial'];
const bookIssueStatuses = ['issued', 'returned', 'overdue'];
const passwordSchema = Joi.string().min(8).max(128).required();
const objectIdSchema = Joi.alternatives().try(
  Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  Joi.object({ _id: Joi.string().length(24).hex().required() }).unknown(true)
).allow('', null);

function makeUpdateSchema(schema) {
  const keys = Object.keys(schema.describe().keys || {});
  return schema.fork(keys, (field) => field.optional()).min(1);
}

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(100),
    Joi.string().valid('all')
  ).default(10),
  search: Joi.string().trim().allow(''),
  sortBy: Joi.string().trim().allow(''),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const idParamSchema = Joi.object({
  id: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId').required()
});

const dateRangeSchema = Joi.object({
  from: Joi.string().isoDate().allow(''),
  to: Joi.string().isoDate().allow('')
});

const userCreateSchema = Joi.object({
  role: Joi.string().valid(...roleValues).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().pattern(/^[0-9]{8,15}$/).allow('', null),
  status: Joi.string().valid(...statusValues).default('active')
});

const userUpdateSchema = makeUpdateSchema(userCreateSchema);
const userListSchema = paginationSchema.keys({
  role: Joi.string().valid(...roleValues),
  status: Joi.string().valid(...statusValues)
});

const studentCreateSchema = Joi.object({
  user: objectIdSchema,
  admissionNo: Joi.string().trim().min(3).max(40).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  department: Joi.string().trim().min(2).max(60).required(),
  year: Joi.number().integer().min(1).max(8).required(),
  section: Joi.string().trim().min(1).max(10).required(),
  batch: Joi.string().trim().max(30).allow(''),
  gender: Joi.string().trim().max(20).allow(''),
  dateOfBirth: Joi.string().isoDate().allow(''),
  address: Joi.string().trim().max(250).allow(''),
  phone: Joi.string().trim().pattern(/^[0-9]{8,15}$/).allow('', null),
  status: Joi.string().valid(...statusValues).default('active')
});

const studentUpdateSchema = makeUpdateSchema(studentCreateSchema);
const studentListSchema = paginationSchema.keys({
  department: Joi.string().trim().allow(''),
  year: Joi.number().integer().min(1).max(8),
  section: Joi.string().trim().allow(''),
  status: Joi.string().lowercase().valid(...statusValues)
});

const facultyCreateSchema = Joi.object({
  user: objectIdSchema,
  employeeCode: Joi.string().trim().min(2).max(40).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().pattern(/^[0-9]{8,15}$/).allow('', null),
  department: Joi.string().trim().min(2).max(60).required(),
  designation: Joi.string().trim().min(2).max(80).required(),
  subjects: Joi.array().items(Joi.string().length(24).hex().message('{#label} must be a valid ObjectId')).default([]),
  assignedClasses: Joi.array().items(Joi.string().trim().min(2).max(40)).default([]),
  status: Joi.string().valid(...statusValues).default('active')
});

const facultyUpdateSchema = makeUpdateSchema(facultyCreateSchema);
const facultyListSchema = paginationSchema.keys({
  department: Joi.string().trim().allow(''),
  status: Joi.string().lowercase().valid(...statusValues)
});

const subjectCreateSchema = Joi.object({
  code: Joi.string().trim().min(2).max(30).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  department: Joi.string().trim().min(2).max(60).required(),
  faculty: objectIdSchema.required(),
  credits: Joi.number().integer().min(0).max(10).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  className: Joi.string().trim().min(2).max(40).allow(''),
  active: Joi.boolean().default(true)
});

const subjectUpdateSchema = makeUpdateSchema(subjectCreateSchema);
const subjectListSchema = paginationSchema.keys({
  department: Joi.string().trim().allow(''),
  faculty: objectIdSchema,
  semester: Joi.number().integer().min(1).max(12)
});

const attendanceCreateSchema = Joi.object({
  student: objectIdSchema.required(),
  classId: Joi.string().trim().min(2).max(40).allow('', null),
  subject: objectIdSchema.required(),
  faculty: objectIdSchema.allow('', null),
  date: Joi.string().isoDate().required(),
  status: Joi.string().lowercase().valid(...attendanceStatusValues).required(),
  remarks: Joi.string().trim().max(250).allow('', null)
});

const attendanceUpdateSchema = makeUpdateSchema(attendanceCreateSchema);
const attendanceListSchema = paginationSchema.keys({
  student: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  classId: Joi.string().trim().allow(''),
  subject: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  faculty: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  status: Joi.string().lowercase().valid(...attendanceStatusValues),
  from: Joi.string().isoDate().allow(''),
  to: Joi.string().isoDate().allow('')
});

const markCreateSchema = Joi.object({
  student: objectIdSchema.required(),
  subject: objectIdSchema.required(),
  faculty: objectIdSchema.required(),
  examType: Joi.string().lowercase().valid(...examTypes).required(),
  score: Joi.number().min(0).required(),
  maxScore: Joi.number().min(1).required(),
  date: Joi.string().isoDate().allow('', null),
  remarks: Joi.string().trim().max(250).allow('')
});

const markUpdateSchema = makeUpdateSchema(markCreateSchema);
const markListSchema = paginationSchema.keys({
  student: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  subject: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  faculty: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  examType: Joi.string().lowercase().valid(...examTypes).allow('', null)
});

const materialCreateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  subject: objectIdSchema.required(),
  faculty: objectIdSchema.required(),
  classId: Joi.string().trim().max(50).allow('', null),
  fileUrl: Joi.string().trim().allow('', null),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim()
  ).default([])
});

const materialUpdateSchema = makeUpdateSchema(materialCreateSchema);
const materialListSchema = paginationSchema.keys({
  subject: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  faculty: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  classId: Joi.string().trim().allow('')
});

const noticeCreateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  content: Joi.string().trim().min(2).max(5000).required(),
  author: objectIdSchema,
  targetRoles: Joi.alternatives().try(
    Joi.array().items(Joi.string().lowercase().valid('admin', 'faculty', 'student')),
    Joi.string().lowercase().valid('admin', 'faculty', 'student')
  ).default(['student']),
  category: Joi.string().trim().lowercase().default('general'),
  isPinned: Joi.boolean().default(false),
  expiryDate: Joi.string().isoDate().allow('', null)
});

const noticeUpdateSchema = makeUpdateSchema(noticeCreateSchema);
const noticeListSchema = paginationSchema.keys({
  category: Joi.string().trim().lowercase(),
  targetRole: Joi.string().lowercase().valid('admin', 'faculty', 'student'),
  isPinned: Joi.boolean()
});

const feeCreateSchema = Joi.object({
  student: objectIdSchema.required(),
  amount: Joi.number().min(0).required(),
  type: Joi.string().lowercase().valid('tuition', 'library', 'exam', 'hostel', 'other').required(),
  status: Joi.string().lowercase().valid('paid', 'pending', 'partial').default('pending'),
  dueDate: Joi.string().isoDate().required(),
  term: Joi.string().trim().allow('', null),
  feeType: Joi.string().trim().allow('', null),
  paidAmount: Joi.number().min(0).default(0),
  paidDate: Joi.string().isoDate().allow('', null),
  transactionId: Joi.string().trim().allow('', null),
  remarks: Joi.string().trim().max(500).allow('', null)
});

const feeUpdateSchema = makeUpdateSchema(feeCreateSchema);
const feeListSchema = paginationSchema.keys({
  student: objectIdSchema,
  status: Joi.string().lowercase().valid('paid', 'pending', 'partial'),
  type: Joi.string().lowercase().valid('tuition', 'library', 'exam', 'hostel', 'other')
});

const bookCreateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  author: Joi.string().trim().min(2).max(120).required(),
  isbn: Joi.string().trim().min(5).max(20).required(),
  category: Joi.string().trim().min(2).max(80).required(),
  copiesTotal: Joi.number().integer().min(1).required(),
  copiesAvailable: Joi.number().integer().min(0),
  location: Joi.string().trim().max(120).allow('')
});

const bookUpdateSchema = makeUpdateSchema(bookCreateSchema);
const bookListSchema = paginationSchema.keys({
  author: Joi.string().trim().allow(''),
  category: Joi.string().trim().allow(''),
  availableOnly: Joi.boolean().default(false)
});

const issueBookSchema = Joi.object({
  book: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId').required(),
  student: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId').required(),
  issuedBy: Joi.string().trim().allow(''),
  issueDate: Joi.string().isoDate().required(),
  dueDate: Joi.string().isoDate().required()
});

const returnBookSchema = Joi.object({
  issue: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId').required(),
  returnDate: Joi.string().isoDate().required()
});

const issueListSchema = paginationSchema.keys({
  student: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  book: Joi.string().length(24).hex().message('{#label} must be a valid ObjectId'),
  status: Joi.string().valid(...bookIssueStatuses)
});

const authRegisterSchema = Joi.object({
  role: Joi.string().valid(...roleValues).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: passwordSchema,
  phone: Joi.string().trim().pattern(/^[0-9]{8,15}$/).allow('', null),
  status: Joi.string().valid(...statusValues).default('active')
});

const authLoginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(1).max(128).required()
});

module.exports = {
  idParamSchema,
  paginationSchema,
  dateRangeSchema,
  userSchemas: {
    create: userCreateSchema,
    update: userUpdateSchema,
    list: userListSchema
  },
  studentSchemas: {
    create: studentCreateSchema,
    update: studentUpdateSchema,
    list: studentListSchema
  },
  facultySchemas: {
    create: facultyCreateSchema,
    update: facultyUpdateSchema,
    list: facultyListSchema
  },
  subjectSchemas: {
    create: subjectCreateSchema,
    update: subjectUpdateSchema,
    list: subjectListSchema
  },
  attendanceSchemas: {
    create: attendanceCreateSchema,
    update: attendanceUpdateSchema,
    list: attendanceListSchema
  },
  markSchemas: {
    create: markCreateSchema,
    update: markUpdateSchema,
    list: markListSchema
  },
  materialSchemas: {
    create: materialCreateSchema,
    update: materialUpdateSchema,
    list: materialListSchema
  },
  noticeSchemas: {
    create: noticeCreateSchema,
    update: noticeUpdateSchema,
    list: noticeListSchema
  },
  feeSchemas: {
    create: feeCreateSchema,
    update: feeUpdateSchema,
    list: feeListSchema
  },
  bookSchemas: {
    create: bookCreateSchema,
    update: bookUpdateSchema,
    list: bookListSchema,
    issue: issueBookSchema,
    return: returnBookSchema,
    issueList: issueListSchema
  },
  authSchemas: {
    register: authRegisterSchema,
    login: authLoginSchema,
    forgotPassword: Joi.object({
      email: Joi.string().trim().email({ tlds: { allow: false } }).required()
    }),
    resetPassword: Joi.object({
      newPassword: passwordSchema
    }),
    sendOtp: Joi.object({
      email: Joi.string().trim().email({ tlds: { allow: false } }).required()
    }),
    verifyOtp: Joi.object({
      email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
      otp: Joi.string().length(6).required()
    }),
    resendVerification: Joi.object({
      email: Joi.string().trim().email({ tlds: { allow: false } }).required()
    })
  }
};