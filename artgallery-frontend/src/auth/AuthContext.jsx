import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../api/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = apiService.getAuthToken(); // Use apiService method
    const userData = localStorage.getItem('user_data'); // Match apiService key
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (loginResponse) => {
    // apiService.login() already handles token storage
    // Just update the auth state
    setIsAuthenticated(true);
    setUser(loginResponse.user);
  };

  const logout = () => {
    apiService.logout(); // This handles token removal
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasPermission = (requiredRole) => {
    // Use apiService method
    return apiService.hasPermission(requiredRole);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    hasPermission,
    loading
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};