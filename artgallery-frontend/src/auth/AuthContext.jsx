import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import apiService from '../api/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = apiService.getAuthToken();
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user_data');
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginResponse) => {
    setIsAuthenticated(true);
    setUser(loginResponse.user);
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasPermission = (requiredRole) => {
    return apiService.hasPermission(requiredRole);
  };

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    hasPermission,
    loading
  }), [isAuthenticated, user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook with a consistent pattern
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };