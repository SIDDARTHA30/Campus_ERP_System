import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("campus_erp_token");

  // Handle missing, null string, or undefined string edge cases
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;