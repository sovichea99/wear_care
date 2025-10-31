// components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { isAdminLoggedIn } from '../services/auth';

export default function ProtectedRoute() {
  const isAuthenticated = isAdminLoggedIn();
  

  
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}