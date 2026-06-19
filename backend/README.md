# 🎓 Campus ERP - Full Stack Production System

A fully functional, stable, and production-ready Campus ERP system built with a modern stack. This system handles role-based access for Admins, Faculty, and Students with deep relationship mapping and persistent storage.

## 🚀 Key Improvements (A to Z)

### 1. 🗄️ Database & Persistence
- **MongoDB Integration:** Migrated from volatile in-memory storage to **Mongoose** for persistent, scalable data management.
-- **Database:** Uses MongoDB (configure `MONGO_URI` in `.env`) - supports MongoDB Atlas for production and local MongoDB for development.
- **Strict Schemas:** Implemented robust Mongoose models for all entities (Users, Students, Faculty, Attendance, Marks, Subjects, etc.).
- **Automatic Seeding:** The system now automatically seeds basic demo accounts (Admin, Faculty, Student) and related data on every fresh startup.

### 2. 🔗 Precise Data Relationships
We have mapped the data flow to ensure academic integrity:
- **Attendance Mapping:** Attendance is strictly linked to a `Student`, `Subject`, and the `Faculty` member who marked it.
- **Marks Mapping:** Student scores are tied to specific `Subject` and `Exam Type` (Mid/Final/Quiz).
- **Faculty Ownership:** Faculty records now contain arrays of `subjects` and `assignedClasses` they manage.
- **Library Tracking:** Track issued books directly to the borrowing `Student` with automated status updates (Issued/Returned/Overdue).

### 3. 🔐 Authentication & Role-Based Access
- **JWT Security:** Tokens are signed with secret keys and include user roles for secure access control.
- **Fixed Validation:** Resolved the "invalid email" errors by relaxing Joi verification to support `.local` development domains.
- **Secure Sessions:** Fixed a critical middleware bug where users were being kicked out after login. The system now maintains stable user sessions until logout.
- **Role Enforcement:** Admins, Faculty, and Students see only what they are authorized to access.

### 4. 🎨 Frontend & UI Improvements
- **Stable Routing:** Implemented `ProtectedRoute` and `RoleRoute` components to prevent unauthorized URL access.
- **Global Error Handling:** Added Axios interceptors to handle session expiry (401 errors) by automatically redirecting to the login page.
- **Improved UX:** Added Loading states, Empty states, and enhanced the `CrudPage` component for smoother data interaction.
- **Syntax Fixes:** Repaired many UI rendering bugs (specifically in Library and Marks pages) to prevent Vite build failures.

---

## 📂 Project Structure

### Backend (`/backend`)
- **`config/`**: Database connection (`db.js`) and seeding logic (`seed.js`).
- **`middleware/`**: JWT protection, Role verification, and Error handlers.
- **`models/`**: Mongoose schemas (e.g., `User.js`, `Student.js`, `Attendance.js`).
- **`services/`**: Business logic where complex data relationships are checked.
- **`controllers/`**: API handlers that receive requests and send standard JSON responses.

### Frontend (`/frontend`)
- **`src/context/`**: Auth and Toast state management.
- **`src/pages/`**: Module-specific pages (Students, Marks, Library).
- **`src/layouts/`**: `AppLayout` for consistent sidebar and navigation.
- **`src/services/`**: API configuration with specialized security interceptors.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, Mongoose, JWT, Bcrypt.
- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router 6.
- **Database:** MongoDB (via Mongoose).

---

## 🔑 Demo Access
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@campus.local` | `Admin@123` |
| **Faculty** | `meera.rao@campus.local` | `Faculty@123` |
| **Student** | `arjun.kumar@campus.local` | `Student@123` |

## 🚦 Data Flow
1. **Login:** User provides email/pass -> Backend verifies via Bcrypt -> Returns JWT.
2. **Requests:** Frontend attaches JWT in Header -> `auth.js` middleware verifies JWT + MongoDB User status.
3. **Operations:** Services handle relationships (e.g., checking if a book is available before issuing) -> Success response returned.


### Library

GET /api/v1/library/books
POST /api/v1/library/books
GET /api/v1/library/books/:id
PUT /api/v1/library/books/:id
DELETE /api/v1/library/books/:id
GET /api/v1/library/issues
POST /api/v1/library/issue
POST /api/v1/library/return
GET /api/v1/library/issues/:id
DELETE /api/v1/library/issues/:id

## Example Response

{
  "success": true,
  "message": "Students fetched successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}

## Example Request

POST /api/v1/students

{
  "userId": "7b3c1fd2-8a6f-45b8-8f10-5f1a0c8e2b9f",
  "admissionNo": "ADM-2026-010",
  "name": "Ananya R",
  "email": "ananya.r@example.com",
  "department": "CSE",
  "year": 2,
  "section": "B"
}

## Notes

This backend now connects to a real MongoDB instance via `MONGO_URI` (recommended: MongoDB Atlas). Seeding runs only when the database is empty to preserve existing data.