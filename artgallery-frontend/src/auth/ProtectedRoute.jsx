import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * ProtectedRoute component that checks for authentication and role permissions
 * before allowing access to the child components.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if authorized
 * @param {string} [props.requiredRole] - Minimum required role to access the route
 * @param {string} [props.redirectPath] - Path to redirect if unauthorized (default: '/login')
 * @returns {ReactNode} Either the children components or a redirect
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = 'visitor', 
  redirectPath = '/login' 
}) => {
  const { isAuthenticated, user, hasPermission } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login with return location
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has the required role permission
  const hasRequiredRole = hasPermission(requiredRole);

  // If doesn't have required role, redirect to unauthorized page
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has required role - render children
  return children;
};

export default ProtectedRoute;