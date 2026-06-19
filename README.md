# 📌 Campus ERP - Enterprise Resource Planning System

A comprehensive, production-ready Enterprise Resource Planning (ERP) system designed for educational institutions. The system manages students, faculty, attendance, marks, fees, library, notices, and study materials in one unified platform.

---

## 📖 1. Project Overview

### **What is Campus ERP?**
Campus ERP is a complete institutional management solution that digitalizes and streamlines all academic operations. It replaces manual paperwork with an automated, role-based system accessible to administrators, faculty, and students.

### **Problems It Solves**
- 🎯 **Manual Attendance Tracking** → Automated attendance marking and reporting
- 📚 **Paper-Based Mark Sheets** → Digital mark management with instant updates
- 💰 **Manual Fee Calculation** → Automated fee tracking and payment status
- 📖 **Library Chaos** → Centralized book inventory and issue tracking
- 📢 **Communication Delays** → Instant notice distribution to targeted roles
- 🔐 **Scattered Data** → Unified database for all institutional data
- 🕐 **Time-Consuming Processes** → Bulk uploads and automated operations

### **Target Users**
- **Administrators** - Full system control, user management, data uploads
- **Faculty** - Mark attendance, upload marks, manage classes
- **Students** - View attendance, check marks, track fees, access materials

### **Core Idea**
A centralized digital hub where every stakeholder in an educational institution can access, manage, and track academic data in real-time through an intuitive, role-based interface.

---

## 🚀 2. Features (Comprehensive List)

### **Authentication & Security**
✅ Role-based login (Admin, Faculty, Student)  
✅ JWT token-based authentication (Stateless ID embedding)
✅ Password hashing with bcrypt  
✅ Double-layer data isolation (Middleware + Service enforcement)
✅ Email verification system (Optional/Disabled in Demo)
✅ Forgot password & reset functionality  
✅ Session management with short-expiry tokens (30m)
✅ Automatic state cleanup on logout
✅ Change password feature  
✅ Rate limiting & Security headers (Helmet)

### **Admin Features**
✅ **User Management** - Create, edit, delete admin, faculty, and student accounts  
✅ **Student Management** - Add/edit students, bulk CSV upload  
✅ **Faculty Management** - Manage faculty details and assign subjects  
✅ **Subject Management** - Create subjects, assign faculty and credits  
✅ **Attendance Control** - Review all attendance records, mark manually  
✅ **Marks Management** - Create and manage student marks  
✅ **Fee Management** - Track student fees, payment status, generate reports  
✅ **Library Control** - Manage books, issue tracking  
✅ **Materials Upload** - Upload study materials linked to subjects  
✅ **Notices** - Create and broadcast notices to different roles  
✅ **System Health** - Monitor API, database connections  
✅ **Bulk Operations** - CSV upload for students and attendance  

### **Faculty Features**
✅ **Mark Attendance** - Mark attendance for assigned classes  
✅ **Upload Marks** - Enter student marks with exam type (internal, mid, semester)  
✅ **View Classes** - See assigned classes and students  
✅ **View Notices** - Receive administrative notices  
✅ **Access Materials** - View and share study materials  
✅ **Attendance Reports** - View attendance patterns  
✅ **Student Performance** - Monitor student mark distributions  

### **Student Features**
✅ **View Attendance** - High-precision tracking with color-coded risk levels  
✅ **Check Marks** - View marks with percentage-based pass/fail logic  
✅ **Performance Analytics** - Dedicated dashboard with trends and subject-wise breakdown  
✅ **At-Risk Monitoring** - Real-time alerts for attendance shortages  
✅ **Track Fees** - Monitor fee status and payment history  
✅ **Access Materials** - Download study materials uploaded by faculty  
✅ **View Notices** - Receive important announcements  
✅ **Library Access** - View issued books and due dates  
✅ **Dashboard** - 30-second cached overview of academic status  

### **System-Wide Features**
✅ Real-time pagination  
✅ Data validation with Joi schemas  
✅ API error handling  
✅ Request logging with Morgan  
✅ CORS security  
✅ Helmet security headers  
✅ Responsive UI across all devices  

---

## 🏗️ 3. Project Architecture

### **Overall Flow**
```
User (Browser)
    ↓
Frontend (React + Vite)
    ↓
API Calls (Axios with JWT tokens)
    ↓
Backend (Node.js + Express)
    ↓
Middleware (Auth, Validation, Error Handling)
    ↓
Services (Business Logic)
    ↓
Controllers (Request/Response)
    ↓
MongoDB (Data Persistence)
```

### **Request-Response Lifecycle**

**1. Request Initiated**
- User interacts with frontend (login, button click, etc.)
- Frontend sends HTTP request with JWT token in headers

**2. Backend Processing**
- Request arrives at Express server
- Middleware checks: Auth → Validation → Routing
- Appropriate controller receives request
- Controller calls service layer
- Service executes business logic, queries database

**3. Response Returned**
- Service returns data to controller
- Controller formats response with success/error status
- Response sent to frontend as JSON
- Frontend updates UI and shows notifications

### **Authentication Flow**

```
User Credentials (Email + Password)
    ↓
Backend Validation (Email exists? Password matches?)
    ↓
Generate JWT Token (Contains: userID, role, email, studentId/facultyId)
    ↓
Return Token + User Object to Frontend
    ↓
Frontend Stores Token in localStorage
    ↓
Axios Interceptor Adds Token to All Requests
    ↓
Backend Security Middleware (filterSelf logic uses token IDs directly)
    ↓
Service Layer Enforcement (Secondary filter override for zero-bypass)
    ↓
If Valid: Allow Request | If Invalid: Return 401
```

---

## 📂 4. Folder Structure

The complete folder structure is organized as follows:

```
vignan/
├── backend/                          # Node.js Express API
│   ├── config/                       # Configuration files
│   ├── models/                       # MongoDB Schemas
│   ├── controllers/                  # Request handlers
│   ├── services/                     # Business logic
│   ├── routes/                       # API endpoints
│   ├── middleware/                   # Request processors
│   ├── validators/                   # Request schemas
│   ├── utils/                        # Utility functions
│   ├── app.js                        # Express app setup
│   ├── server.js                     # Server entry point
│   ├── package.json                  # Dependencies
│   └── .env                          # Environment variables
│
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable components
│   │   ├── context/                 # State management
│   │   ├── routes/                  # Route protection
│   │   ├── services/                # API calls
│   │   ├── utils/                   # Helper functions
│   │   ├── layouts/                 # Layout components
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS setup
│   ├── package.json                 # Dependencies
│   └── .env.example                 # Environment template
│
├── test-data/                        # Sample CSV files
├── scratch/                          # Temporary files
└── README.md                         # This file
```

---

## 🧠 5. Core Logic

### **Authentication & Authorization**

**Login Process:**
1. User enters email and password on LoginPage
2. Frontend sends POST request to `/api/v1/auth/login`
3. Backend queries User collection by email
4. Verifies password with bcrypt comparison
5. Generates JWT token (expires in 1 day)
6. Returns token + user object to frontend
7. Frontend stores token in localStorage (`campus_erp_token`)
8. Axios interceptor automatically adds token to all requests

**Role-Based Access Control:**
- Admin: Full system access
- Faculty: Mark attendance, upload marks, manage classes
- Student: View own data (attendance, marks, fees)

### **User Data Flow**

**CRUD Operations** follow this pattern:
```
User Action → Frontend Validation → API Request → Backend Service → MongoDB → Response → UI Update
```

### **Bulk Upload Logic**

**CSV Upload Process:**
1. Admin uploads CSV file via multer middleware
2. Backend reads CSV with `csv-parser`
3. Validates each row against schema
4. Creates documents in bulk
5. Returns summary (success count, failed count, errors)
6. Frontend shows success/failure details

---

## 🖥️ 6. Frontend Details

### **Technology Stack**
- **Framework**: React 18.3.1 with Hooks
- **Build Tool**: Vite 6.0.3
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS v3.4.17
- **UI Components**: Lucide React (icons), Recharts (charts), React Hot Toast (notifications)

### **Key Pages**

| Page | Purpose | Who Sees It |
|------|---------|-----------|
| **LoginPage** | Email/password authentication | Everyone |
| **RoleHome** | Personalized dashboard with quick stats | All authenticated users |
| **StudentsPage** | CRUD for students, bulk upload | Admin only |
| **FacultyPage** | CRUD for faculty members | Admin only |
| **AttendancePage** | View/mark attendance | All roles |
| **MarksPage** | View/upload marks | Faculty & Admin |
| **FeesPage** | Track fee status | All roles |
| **MaterialsPage** | Upload/download study materials | All roles |
| **NoticesPage** | View system announcements | All roles |
| **LibraryPage** | Manage books and issues | All roles |

### **State Management**

**AuthContext** manages:
- JWT token
- User object (id, name, email, role)
- Authentication status
- Login/Logout functions

---

## ⚙️ 7. Backend Details

### **Technology Stack**
- **Runtime**: Node.js with Express 4.21.2
- **Database**: MongoDB via Mongoose 9.6.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **Validation**: Joi 17.13.3
- **Security**: Helmet 8.0.0, CORS 2.8.5
- **Logging**: Morgan 1.10.0
- **File Upload**: Multer 2.1.1
- **Email**: Nodemailer 8.0.7

### **Architecture Pattern: MVC + Services**

```
Route → Middleware → Controller → Service → Model → Database
```

### **Middleware Stack**

1. **Security**: Helmet (headers), CORS
2. **Parsing**: JSON body parser
3. **Logging**: Morgan HTTP logger
4. **Authentication**: JWT verification
5. **Validation**: Joi schema validation
6. **Authorization**: Role-based access control
7. **Error Handling**: Custom error handler

### **API Response Format**

```javascript
{
  success: true/false,
  message: "...",
  data: {...}
}
```

---

## 🗄️ 8. Database Design

### **Database: MongoDB**

11 Collections with proper indexing and relationships:

1. **Users** - Authentication and role management
2. **Students** - Student details and admission info
3. **Faculty** - Faculty information and assignments
4. **Subjects** - Course/subject information
5. **Attendance** - Class attendance records
6. **Marks** - Student exam marks
7. **Fees** - Fee tracking and payment status
8. **Materials** - Study materials/resources
9. **Notices** - System announcements
10. **Books** - Library book inventory
11. **LibraryIssue** - Book issue/return tracking

### **Key Relationships**

- User (1) → (Many) Student/Faculty
- Faculty (1) → (Many) Subject/Attendance/Mark
- Subject (1) → (Many) Attendance/Mark/Material
- Student (1) → (Many) Attendance/Mark/Fee/LibraryIssue
- Book (1) → (Many) LibraryIssue

---

## 🔐 9. Authentication & Security

### **Security Measures**

✅ **JWT Tokens**
- 30-minute expiration (Production standard)
- Stateless Identity: Includes studentId/facultyId to eliminate DB lookups
- Stored in localStorage with global state cleaning on logout
- Bearer scheme validation

✅ **Double-Layer Privacy Enforcement**
- **Middleware**: `filterSelf` forces student/faculty filters at the route level.
- **Service Layer**: Redundant internal checks ensure data isolation even if middleware is bypassed.
- **Stateless Verification**: Uses IDs from the validated token payload for tamper-proof queries.

✅ **Password Security**
- Bcrypt hashing (10 salt rounds)
- Secure password reset
- Password change on first login

✅ **Role-Based Access Control**
- Frontend route guards
- Backend permission validation

✅ **HTTP Security**
- Helmet headers
- CORS protection
- Input validation with Joi

✅ **Error Handling**
- Sanitized error messages
- No sensitive data leaks

---

## 🔄 10. API Endpoints

### **Quick Reference**

```
Authentication:
POST   /api/v1/auth/login              - User login
POST   /api/v1/auth/change-password    - Change password
POST   /api/v1/auth/forgot-password    - Request password reset
POST   /api/v1/auth/reset-password/:token - Reset password

Students:
GET    /api/v1/students                - List students
POST   /api/v1/students                - Create student
PUT    /api/v1/students/:id            - Update student
DELETE /api/v1/students/:id            - Delete student
POST   /api/v1/students/bulk-upload    - Bulk upload from CSV

Attendance:
GET    /api/v1/attendance              - List attendance
POST   /api/v1/attendance              - Mark attendance
PUT    /api/v1/attendance/:id          - Update attendance

Marks:
GET    /api/v1/marks                   - List marks
POST   /api/v1/marks                   - Upload marks
PUT    /api/v1/marks/:id               - Update marks

Fees:
GET    /api/v1/fees                    - List fees
POST   /api/v1/fees                    - Create fee record
PUT    /api/v1/fees/:id                - Update fee status

And many more for Faculty, Subjects, Materials, Notices, Library...
```

All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

---

## 📊 11. Data Flow Explanation

### **Typical Flow: Student Login → View Dashboard → Check Attendance**

```
1. Student enters credentials on LoginPage
   ↓
2. Frontend: POST /api/v1/auth/login { email, password }
   ↓
3. Backend validates password with bcrypt
   ↓
4. JWT token generated and returned
   ↓
5. Frontend stores token in localStorage
   ↓
6. Student redirected to /app/dashboard
   ↓
7. Dashboard loads student-specific widgets
   ↓
8. Student clicks "View Attendance"
   ↓
9. Frontend: GET /api/v1/attendance
   (Axios interceptor adds: Authorization: Bearer <token>)
   ↓
10. Backend middleware verifies token
    ↓
11. attendanceService filters by student ID
    ↓
12. Records returned with pagination
    ↓
13. UI displays attendance table with percentage
```

---

## 🧪 12. Testing & Validation

### **Manual Testing Checklist**

✅ **Authentication**
- Login with valid/invalid credentials
- Auto-logout on expired token
- Protected routes require login

✅ **Role-Based Access**
- Admin sees all pages
- Faculty sees faculty pages
- Student sees student pages

✅ **CRUD Operations**
- Create records
- Read/List with pagination
- Update existing records
- Delete with confirmation

✅ **Bulk Upload**
- Upload valid CSV files
- Handle validation errors
- Display success summary

✅ **Error Handling**
- Network errors show toast
- Invalid data shows validation errors
- Unauthorized access redirects to login

---

## 📦 13. Installation & Setup

### **Prerequisites**
- Node.js v14+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### **Backend Setup**

```bash
cd backend
npm install

# Create .env file from .env.example
cp .env.example .env

# Configure environment variables:
# MONGO_URI, JWT_SECRET, etc.

# Start development server
npm run dev

# Expected: Backend runs on http://localhost:5000
```

### **Frontend Setup**

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env.local

# Start development server
npm run dev

# Expected: Frontend runs on http://localhost:5173
```

### **Database Setup**

Option 1: Local MongoDB
```bash
mongod  # Start MongoDB service
```

Option 2: MongoDB Atlas (Cloud)
- Create cluster at https://www.mongodb.com/cloud/atlas
- Get connection URI
- Add to MONGO_URI in backend/.env

### **Create Admin User**

```bash
cd backend
npm run create-admin
# Follow prompts to create admin account
```

### **Environment Variables**

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp_db
```

**Frontend (.env.local)**
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🛠️ 14. Technologies Used

### **Backend**
| Tech | Version | Purpose |
|------|---------|---------|
| Node.js | v14+ | Runtime |
| Express | 4.21.2 | Framework |
| MongoDB | - | Database |
| Mongoose | 9.6.0 | ODM |
| JWT | 9.0.2 | Authentication |
| bcrypt | 5.1.1 | Password hashing |
| Joi | 17.13.3 | Validation |
| Helmet | 8.0.0 | Security |
| Morgan | 1.10.0 | Logging |
| Multer | 2.1.1 | File upload |

### **Frontend**
| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 6.0.3 | Build tool |
| React Router | 6.28.0 | Routing |
| Axios | 1.7.9 | HTTP client |
| Tailwind CSS | 3.4.17 | Styling |
| React Hot Toast | 2.6.0 | Notifications |
| Lucide React | 1.14.0 | Icons |
| Recharts | 3.8.1 | Charts |

---

## ⚡ 16. Challenges & Solutions

### **Challenge: Bulk Data Upload**
**Solution**: Used Multer + csv-parser with error tracking and summary reporting

### **Challenge: Duplicate Attendance**
**Solution**: Created compound unique index on (student, subject, date)

### **Challenge: Role-Based Access**
**Solution**: Frontend RoleRoute + Backend restrictTo middleware + Service layer filtering

### **Challenge: Large Dataset Performance**
**Solution**: Implemented pagination, database indexes, and optimized queries

### **Challenge: Token Management**
**Solution**: JWT tokens with 24-hour expiry + Axios interceptor for 401 handling

---

## 🔮 17. Future Enhancements

- 📱 Mobile App (React Native/Flutter)
- 📧 Real-time Email Notifications
- 📊 Advanced Analytics Dashboard
- 🎥 Video Class Integration
- 📝 Online Assignment Submission
- 🧪 Online Exam Platform
- 🔒 Two-Factor Authentication
- 🌍 Multi-Language Support
- ☁️ Cloud Deployment
- 🐳 Docker Containerization

---

## 👨‍💻 18. Author / Team Info

**Project Name**: Campus ERP  
**Version**: 1.0.0  
**Status**: Production Ready  

**Created By**: Sid76  
**Contact**: your-email@example.com

---

## 📜 19. License

This project is licensed under the **MIT License**.

---

## 🎯 Quick Commands

```bash
# Backend
cd backend && npm run dev          # Development server
cd backend && npm run build        # Production build
cd backend && npm run create-admin # Create admin

# Frontend
cd frontend && npm run dev         # Development server
cd frontend && npm run build       # Production build
```

---

**Thank you for using Campus ERP! 🎓**
