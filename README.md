# 📌 Campus ERP - Enterprise Resource Planning System

A comprehensive, production-ready Enterprise Resource Planning (ERP) system designed for educational institutions. The system digitalizes and automates student registries, faculty assignments, class attendance, grade cards, library books, notices, study materials, and billing/fee collections into a unified, secure platform.

---

## 📖 1. Project Overview

### **What is Campus ERP?**
Campus ERP is a multi-role web application that streamlines academic operations by replacing manual paperwork with automated, role-based workflows accessible to Administrators, Faculty members, and Students.

### **Problems It Solves**
* 🎯 **Manual Attendance Tracking** -> High-precision attendance marking with real-time risk alerts for low attendance.
* 📚 **Paper-Based Grade Sheets** -> Multi-type marks upload (Internal, Midterm, Semester) with instant student performance analytics.
* 💰 **Manual Fee Management** -> Term-based fee tracking with payment statuses (`paid`, `partial`, `pending`) and bulk template uploads.
* 📖 **Library Logbooks** -> Book lending registry tracking copies, availability, issue dates, and return statuses.
* 📢 **Communication Gaps** -> Targeted notices broadcasted directly to specific user roles.
* 🔐 **Data Isolation** -> Enforces robust data security policies so students and faculty can only access their authorized records.

---

## 🚀 2. Features (Comprehensive List)

### 🔑 **Authentication & Security**
* **Role-Based Access Control (RBAC)**: Strict permission boundaries for `admin`, `faculty`, and `student`.
* **State Verification**: Stateless JWT tokens (embedded with studentId/facultyId) to eliminate redundant database lookups.
* **Double-Layer Data Privacy**: 
  * *Router Layer*: `filterSelf` middleware intercepts requests and injects the authenticated user’s ID directly into the query parameters.
  * *Service Layer*: Secondary verification checks query parameters against the validated token payload for zero-bypass isolation.
* **Password Security**: Safe credentials storage hashed with `bcrypt` (10 salt rounds).
* **Automatic Expiry Logout**: Axios interceptor automatically detects expired sessions (401 errors) and clears local storage safely.

### 👑 **Admin Features**
* **User Management**: Create, update, or deactivate system login credentials for all roles.
* **Academic Control**: CRUD operations on Students, Faculty, and Course Subjects.
* **Faculty Assignment**: Map specific subjects, departments, and course structures to faculty records.
* **Financial Ledger**: Track billing, record partial or full payments, and download status sheets.
* **Library Inventory**: Registry of books, copies available, and borrowing records.
* **Broadcast Hub**: Send announcements targeting all users or filtered by specific roles.

### 👨‍🏫 **Faculty Features**
* **My Classes Dashboard**: View current teaching assignments and allocated subjects.
* **Digital Attendance Ledger**: Mark student attendance by class and date. Includes unique compound indexes to prevent duplicates.
* **Performance Entry**: Upload grades for internal tests, mid-semesters, or final examinations.
* **Resources Upload**: Post lectures, slide decks, and reading resources associated with assigned subjects.

### 🎓 **Student Features**
* **Overview Dashboard**: Capped cached view of attendance percentages, issued books, pending fees, and announcements.
* **Performance Analytics**: Subject-wise grade charts powered by `recharts` to identify performance trends.
* **Attendance Risk Monitoring**: Color-coded risk indicators highlighting courses with attendance below the required 75% threshold.
* **Materials Locker**: Browse and download study materials posted by subject faculty.
* **Financial Ledger**: View current fee bills, transaction records, and payment statuses.

---

## 🏗️ 3. Project Architecture & Lifecycle

### **System Data Flow**
```
User (Browser Interface)
       ↓
Frontend (React 18 + Vite 6 + Tailwind CSS)
       ↓  (Axios HTTP Client with JWT Interceptors)
Backend Gateway (Node.js + Express 4)
       ↓  (Security Headers / Morgan Logger / Body Parser)
Middleware Pipeline (Auth Guard → Joi Schema Validation → filterSelf Privacy)
       ↓  (Route Mapping)
Controllers Layer (Extracts request inputs, executes generic or custom CRUDs)
       ↓
Services Layer (Core business logic, aggregation pipelines, CSV bulk parsing)
       ↓
Models / ODM (Mongoose schemas, compound indexes, constraints)
       ↓
Database (MongoDB Atlas)
```

---

## 📂 4. Detailed Codebase Map

### 🖥️ **Frontend (`frontend/`)**
* `src/App.jsx`: Global router configuring protected routes and custom role-based view permissions.
* `src/context/AuthContext.jsx`: Manages global login states, user metadata, and persistent tokens.
* `src/services/api.js`: Centrally configures Axios with request token headers and global 401 interceptors.
* `src/pages/`:
  * `LoginPage.jsx`: Multi-role login panel with custom password visibility toggles.
  * `RoleHome.jsx`: Adaptive dashboard displaying custom widgets based on the logged-in role.
  * `PerformancePage.jsx`: Renders analytics dashboards showing subject averages and trends using Recharts.
  * `StudentsPage.jsx` / `FacultyPage.jsx` / `SubjectsPage.jsx`: Dynamic tables for administrators to perform CRUD operations, filter data, and process bulk CSV files.
  * `AttendancePage.jsx` / `MarksPage.jsx` / `LibraryPage.jsx` / `FeesPage.jsx`: Core application features adjusting UI fields depending on whether the viewer is an Admin, Faculty, or Student.
  * `faculty/MyClasses.jsx` / `faculty/FacultyAttendance.jsx` / `faculty/FacultyMarks.jsx`: Dedicated interfaces for faculty class assignments, attendance logging, and grade uploads.

### ⚙️ **Backend (`backend/`)**
* `server.js`: Connects to MongoDB, synchronizes all schema indexes on startup, and launches the Express server.
* `app.js`: Configures the middleware stack (Helmet, CORS, body parsers, Morgan, API router, 404 handler, and global error middleware).
* `config/`:
  * `db.js`: Establishes connections using the environment `MONGO_URI`.
  * `index.js`: Standardizes configuration loading and maps environment variables.
  * `init.js`: Automatically triggers `syncIndexes()` for all database schemas on startup.
  * `seed.js`: Database script to populate mock entities for development.
* `models/`:
  * `User.js`: User accounts with credential hashing and role definitions.
  * `Student.js`: Links students to users, details departments, semesters, and admission numbers.
  * `Faculty.js`: Stores academic department details, emails, and assigned subjects.
  * `Subject.js`: Catalog of courses including credits and subject codes.
  * `Attendance.js`: Logs dates, statuses (`present`, `absent`, etc.), and student/subject/faculty relationships. Confirms unique records via compound index `{ student: 1, subject: 1, date: 1 }`.
  * `Mark.js`: Stores student scores mapped to exam types (`internal`, `mid`, `semester`).
  * `Fee.js`: Financial ledger containing details about term fees, payments, types (`tuition`, `hostel`, `exam`), and due dates.
  * `Book.js` / `LibraryIssue.js`: Library catalogs and loan transaction records.
  * `Material.js` / `Notice.js`: Documents study resource locations and targeted notices.
* `middleware/`:
  * `auth.js`: Implements the `protect` middleware to verify Bearer JWTs and the `restrictTo` controller guard.
  * `filterSelf.js`: Injects security scopes into query criteria for student and faculty calls.
  * `validate.js`: Validates request bodies against Joi definitions before they hit the controller.
  * `errorHandler.js`: Returns clean, sanitized JSON errors.
* `services/`:
  * `attendance.service.js`: Handles complex attendance reporting, student streaks, and low-attendance risk alerts.
  * `fee.service.js`: Implements transaction records, payment status evaluations, and bulk fee ledger updates.
  * `library.service.js`: Tracks inventories, checks out books (safely decrementing availability), and manages check-ins.
  * `auth.service.js` / `student.service.js` / `faculty.service.js`: Core services for user onboarding, profile updates, and authentication pipelines.
* `utils/`:
  * `queryHelper.js`: Standardizes request sanitation, clamps pagination limits (default 10, max 100, custom 10000 limit for bulk calls), and escapes query searches.

---

## 🗄️ 5. Database Schema Design (11 Collections)

| Collection | Primary Keys / Indexes | Relations | Purpose |
|---|---|---|---|
| **users** | `email` (Unique) | - | Authenticates logins |
| **students** | `admissionNo` (Unique) | `user` -> users | Core student records |
| **faculties** | `email` (Unique) | `user` -> users | Core faculty records |
| **subjects** | `code` (Unique) | `faculty` -> faculties | Syllabus courses |
| **attendances** | `{ student, subject, date }` (Unique Compound) | `student`, `subject`, `faculty` | Daily attendance ledger |
| **marks** | `{ student, subject, examType }` (Unique Compound) | `student`, `subject` | Academic grades ledger |
| **fees** | `{ student, term, feeType }` (Unique Compound) | `student` | Tuition and ledger bills |
| **books** | `isbn` (Unique) | - | Library catalog |
| **libraryissues**| `_id` | `student`, `book` | Book lending records |
| **materials** | `_id` | `subject` | Lecture resources |
| **notices** | `_id` | - | Broadcasted announcements |

---

## 🔑 6. Core Logic Implementation

### **Bulk CSV Parsing & Ingestion**
Admin panels support importing data using CSV uploads. The pipeline is processed as follows:
1. **File Ingestion**: Multer processes incoming multi-part files and stores them temporarily.
2. **Parsing**: `csv-parser` reads rows sequentially.
3. **Data Normalization**: Cleans, trims, and formats attributes (e.g. converting text identifiers to lowercase enums).
4. **Relational Lookup**: Maps plain CSV codes (like `admissionNo` or `subjectcode`) to corresponding database ObjectId values.
5. **Atomic Updates**: Uses MongoDB upserts (`findOneAndUpdate`) where possible to synchronize inputs and prevent duplicates.
6. **Detailed Reporting**: Returns a detailed summary of successful inserts, skipped duplicates, and structural validation errors (referencing the exact spreadsheet row number).

---

## ⚙️ 7. Installation & Setup

### **Prerequisites**
* Node.js v14 or higher
* npm or yarn
* A running MongoDB instance (local server or Atlas cluster URI)

### **1. Configure the Backend**
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```
Open the newly created `.env` file and configure your parameters:
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secure-jwt-key
JWT_EXPIRES_IN=24h
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/campus_erp
```
Run the development server:
```bash
# Runs nodemon server.js
npm run dev
```

### **2. Configure the Frontend**
```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Create your local environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env.local
```
Run the development server:
```bash
# Launches Vite
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### **3. Seeding Initial Admin User**
To log in for the first time, seed an administrator account using the CLI script:
```bash
cd ../backend
npm run create-admin
```
This utility reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your [backend/.env](file:///c:/3rdyear/anti_gravity/vignan/backend/.env) file to configure the root administrator.

---

## 🛠️ 8. Tech Stack & Developer Tools

The following tools and libraries form the foundation of this Campus ERP:

### **Frontend Technologies**
* **React 18.3**: Declarative UI components and custom Context Hooks (`AuthContext.jsx`).
* **Vite 6.0**: Fast build tool and hot-reloading development server.
* **Tailwind CSS v3.4**: Utility-first CSS styling framework.
* **Framer Motion v12.3**: Used for smooth route transitions and micro-animations.
* **Recharts v3.8**: Responsive, clean charts for rendering grade/performance trends.
* **Axios v1.7**: HTTP client handles API request authorizations and token expiry redirects.
* **Lucide React v1.14**: Vector icon catalog for clean, responsive designs.
* **React Hot Toast v2.6**: Instant notification alerts and upload progress prompts.

### **Backend Technologies**
* **Node.js**: Asynchronous JavaScript runtime environment.
* **Express.js v4.21**: Fast, minimal web application framework.
* **Mongoose ODM v9.6**: Data modeling and query builder for MongoDB.
* **JSON Web Tokens (JWT) v9.0**: Stateless, encrypted user authorization payloads.
* **Bcrypt v5.1**: Secure salted password hashing (10 iterations).
* **Joi v17.13**: Object schema validation middleware for API requests.
* **Helmet v8.0**: Secure HTTP response headers configuration.
* **Multer v2.1**: Multi-part parser handling file uploads (CSV streams).
* **CSV Parser v3.2**: Stream processor to read spreadsheet lines efficiently.
* **Morgan v1.10**: HTTP logging output in the console.

### **Development & Deployment Tools**
* **Git**: System version tracking and source code management.
* **Render**: Live cloud hosting platform for the Node.js Express server.
* **Vercel**: Static hosting platform optimized for Vite + React client deployments.
* **Nodemon**: Auto-restarting development loop.
* **MongoDB Atlas**: Managed multi-region cloud database cluster.

---

## 🚀 9. Production Deployment

### **Backend (Render)**
1. Create a **Web Service** on Render.
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to `npm install`.
4. Set the **Start Command** to `node server.js`.
5. In **Environment Variables**, define your custom variables (e.g. `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`).

### **Frontend (Vercel)**
1. Import the repository into Vercel.
2. Select `Vite` as the framework preset.
3. Set the **Root Directory** to `frontend`.
4. Define the **Environment Variable** `VITE_API_BASE_URL` pointing to your Render backend API endpoint (e.g. `https://api.vignanerp.com/api/v1`).
5. Click **Deploy**.

