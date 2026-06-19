import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleHome from './pages/RoleHome';
import ModulePage from './pages/ModulePage';
import RoleRoute from './routes/RoleRoute';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import SubjectsPage from './pages/SubjectsPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import MaterialsPage from './pages/MaterialsPage';
import NoticesPage from './pages/NoticesPage';
import FeesPage from './pages/FeesPage';
import LibraryPage from './pages/LibraryPage';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';
import MyClasses from './pages/faculty/MyClasses';
import PerformancePage from './pages/PerformancePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerificationPage from './pages/VerificationPage';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify/:token" element={<VerificationPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route
          path="students"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <StudentsPage />
            </RoleRoute>
          }
        />
        <Route path="faculty" element={<RoleRoute allowedRoles={["admin"]}><FacultyPage /></RoleRoute>} />
        <Route path="attendance" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><AttendancePage /></RoleRoute>} />
        <Route path="marks" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><MarksPage /></RoleRoute>} />
        <Route path="faculty/classes" element={<RoleRoute allowedRoles={["faculty"]}><MyClasses /></RoleRoute>} />
        <Route path="faculty/attendance" element={<RoleRoute allowedRoles={["faculty"]}><FacultyAttendance /></RoleRoute>} />
        <Route path="faculty/marks" element={<RoleRoute allowedRoles={["faculty"]}><FacultyMarks /></RoleRoute>} />
        <Route path="materials" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><MaterialsPage /></RoleRoute>} />
        <Route path="notices" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><NoticesPage /></RoleRoute>} />
        <Route path="subjects" element={<RoleRoute allowedRoles={["admin","faculty"]}><SubjectsPage /></RoleRoute>} />
        <Route path="fees" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><FeesPage /></RoleRoute>} />
        <Route path="library" element={<RoleRoute allowedRoles={["admin","faculty","student"]}><LibraryPage /></RoleRoute>} />
        <Route path="performance" element={<RoleRoute allowedRoles={["student"]}><PerformancePage /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;