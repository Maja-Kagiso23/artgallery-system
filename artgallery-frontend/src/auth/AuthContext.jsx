import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Navigate } from 'react-router-dom';  // <-- Moved to top
import ApiService from '../api/apiService';

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = ApiService.getAuthToken();
    const user = ApiService.getCurrentUser();
    
    if (token && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user },
      });
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await ApiService.login(credentials);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user },
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await ApiService.register(userData);
      // Auto-login after registration
      if (response.user) {
        const loginResponse = await ApiService.login({
          username: userData.username,
          password: userData.password,
        });
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: loginResponse.user },
        });
      }
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check if user has specific role permission
  const hasPermission = (requiredRole) => {
    return ApiService.hasPermission(requiredRole);
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole = 'visitor' }) => {
  const { isAuthenticated, user, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based component renderer
export const RoleBasedComponent = ({ 
  children, 
  allowedRoles = [], 
  fallback = null 
}) => {
  const { user, hasPermission } = useAuth();
  
  if (!user) return fallback;
  
  const hasAccess = allowedRoles.some(role => hasPermission(role));
  
  return hasAccess ? children : fallback;
};

// Higher-order component for role protection
export const withRoleProtection = (WrappedComponent, requiredRole) => {
  return (props) => {
    const { hasPermission } = useAuth();
    
    if (!hasPermission(requiredRole)) {
      return (
        <div className="unauthorized">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this resource.</p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};


export default AuthContext;