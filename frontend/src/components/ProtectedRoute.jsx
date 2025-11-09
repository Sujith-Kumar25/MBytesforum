import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Redirect to appropriate login page based on required role
    return <Navigate to={`/${role}/login`} replace />;
  }

  // Check if user has the correct role
  if (user.role !== role) {
    // If user has a different role, redirect to their dashboard
    // But if they're trying to access admin routes as student, redirect to admin login
    if (role === 'admin' && user.role === 'student') {
      // Clear student session and redirect to admin login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;

