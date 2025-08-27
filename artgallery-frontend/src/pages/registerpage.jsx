import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ApiService from '../api/apiService';

const RegisterPage = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState({
    status: '', // 'success' or 'error'
    message: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  
  // Get auth context
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const validateFields = () => {
    const errors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    // Username validation
    if (!userData.username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    } else if (userData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    // Email validation
    if (!userData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!userData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (userData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/[A-Z]/.test(userData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(userData.password)) {
      errors.password = 'Password must contain at least one number';
      isValid = false;
    } else if (!/[^A-Za-z0-9]/.test(userData.password)) {
      errors.password = 'Password must contain at least one special character';
      isValid = false;
    }

    // Confirm password validation
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
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
    setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' });

    if (!validateFields()) {
      setLoading(false);
      return;
    }

    try {
      const response = await ApiService.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone
      });

      setApiResponse({
        status: 'success',
        message: 'Registration successful! Redirecting to login...'
      });

      // Navigate to login page with success message
      setTimeout(() => {
        navigate('/login', {
          state: {
            registrationSuccess: true,
            message: 'Registration successful! Please login.'
          }
        });
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle API validation errors
      if (error.message.includes('username')) {
        setFieldErrors(prev => ({
          ...prev,
          username: 'Username already exists'
        }));
      } else if (error.message.includes('email')) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'Email already registered'
        }));
      } else {
        setApiResponse({
          status: 'error',
          message: error.message || 'Registration failed. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (fieldName) => ({
    display: 'block',
    width: '100%',
    padding: '0.875rem 1rem',
    border: `2px solid ${fieldErrors[fieldName] ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    backgroundColor: loading ? '#f8fafc' : 'white'
  });

  const handleInputFocus = (e, fieldName) => {
    if (!fieldErrors[fieldName]) {
      e.target.style.borderColor = '#3b82f6';
    }
  };

  const handleInputBlur = (e, fieldName) => {
    if (!fieldErrors[fieldName]) {
      e.target.style.borderColor = '#e2e8f0';
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
        maxWidth: '500px'
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
            Create Account
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.1rem'
          }}>
            Join us today
          </p>
        </div>

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
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              style={inputStyle('username')}
              disabled={loading}
              onFocus={(e) => handleInputFocus(e, 'username')}
              onBlur={(e) => handleInputBlur(e, 'username')}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              style={inputStyle('email')}
              disabled={loading}
              onFocus={(e) => handleInputFocus(e, 'email')}
              onBlur={(e) => handleInputBlur(e, 'email')}
            />
            {fieldErrors.email && (
              <span style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'block'
              }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={userData.first_name}
                onChange={handleChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: loading ? '#f8fafc' : 'white'
                }}
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={userData.last_name}
                onChange={handleChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: loading ? '#f8fafc' : 'white'
                }}
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                backgroundColor: loading ? '#f8fafc' : 'white'
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              style={inputStyle('password')}
              disabled={loading}
              onFocus={(e) => handleInputFocus(e, 'password')}
              onBlur={(e) => handleInputBlur(e, 'password')}
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

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={userData.confirmPassword}
              onChange={handleChange}
              style={inputStyle('confirmPassword')}
              disabled={loading}
              onFocus={(e) => handleInputFocus(e, 'confirmPassword')}
              onBlur={(e) => handleInputBlur(e, 'confirmPassword')}
            />
            {fieldErrors.confirmPassword && (
              <span style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'block'
              }}>
                {fieldErrors.confirmPassword}
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
                <span style={{ opacity: 0 }}>Create Account</span>
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
                  Creating Account...
                </div>
              </>
            ) : 'Create Account'}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Link 
              to="/login" 
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
              Already have an account?
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

export default RegisterPage;