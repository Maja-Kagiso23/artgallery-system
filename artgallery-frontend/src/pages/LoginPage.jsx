import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState({
    status: '', // 'success' or 'error'
    message: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    password: ''
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  
  // Get auth context
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setShowRegistrationSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validateFields = () => {
    const errors = {
      username: '',
      password: ''
    };
    let isValid = true;

    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setApiResponse({ status: '', message: '' });
    setFieldErrors({ username: '', password: '' });

    if (!validateFields()) {
      setLoading(false);
      return;
    }

    try {
      const data = await ApiService.login({
        username: credentials.username,
        password: credentials.password
      });

      // Update auth context with login data
      await login(data);

      setApiResponse({
        status: 'success',
        message: 'Logged in successfully! Redirecting...'
      });

      // Navigate to dashboard or return location
      const returnTo = location.state?.from?.pathname || '/dashboard';
      setTimeout(() => {
        navigate(returnTo);
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      setApiResponse({
        status: 'error',
        message: error.message || 'Invalid username or password'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      padding: '2rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
            fontWeight: '700', 
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.1rem'
          }}>
            Sign in to your account
          </p>
        </div>
        
        {/* Registration Success Message */}
        {showRegistrationSuccess && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            textAlign: 'center',
            fontSize: '0.95rem'
          }}>
            {location.state?.message || 'Registration successful! Please login.'}
          </div>
        )}

        {/* API Response Message Box */}
        {apiResponse.status && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            backgroundColor: apiResponse.status === 'success' ? '#f0fdf4' : '#fef2f2',
            color: apiResponse.status === 'success' ? '#166534' : '#dc2626',
            border: `1px solid ${apiResponse.status === 'success' ? '#bbf7d0' : '#fecaca'}`,
            textAlign: 'center',
            fontSize: '0.95rem'
          }}>
            {apiResponse.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${fieldErrors.username ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                backgroundColor: loading ? '#f8fafc' : 'white'
              }}
              disabled={loading}
              onFocus={(e) => {
                if (!fieldErrors.username) {
                  e.target.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => {
                if (!fieldErrors.username) {
                  e.target.style.borderColor = '#e2e8f0';
                }
              }}
            />
            {fieldErrors.username && (
              <span style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'block'
              }}>
                {fieldErrors.username}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${fieldErrors.password ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                backgroundColor: loading ? '#f8fafc' : 'white'
              }}
              disabled={loading}
              onFocus={(e) => {
                if (!fieldErrors.password) {
                  e.target.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => {
                if (!fieldErrors.password) {
                  e.target.style.borderColor = '#e2e8f0';
                }
              }}
            />
            {fieldErrors.password && (
              <span style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'block'
              }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
              }
            }}
          >
            {loading ? (
              <>
                <span style={{ opacity: 0 }}>Sign In</span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }}></div>
                  Signing In...
                </div>
              </>
            ) : 'Sign In'}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Link 
              to="/register" 
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#2563eb';
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#3b82f6';
                e.target.style.textDecoration = 'none';
              }}
            >
              Don't have an account?
            </Link>
          </div>
        </form>
      </div>

      {/* Add CSS animation for the loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;