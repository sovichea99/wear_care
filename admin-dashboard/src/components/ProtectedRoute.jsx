import { Navigate, Outlet } from "react-router-dom";
import { getCurrentAdmin } from "../services/auth";

const ProtectedRoute = () => {
  const isAuthenticated = sessionStorage.getItem("authToken"); // Check for auth token
  const admin = getCurrentAdmin();

  return isAuthenticated && admin ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
