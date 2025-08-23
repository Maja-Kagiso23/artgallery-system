import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext'; // Import useAuth

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
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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
      const data = await apiService.login({
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
      padding: '2rem', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          color: '#333', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Login
        </h1>
        
        {/* Registration Success Message */}
        {showRegistrationSuccess && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            border: '1px solid #C8E6C9',
            textAlign: 'center'
          }}>
            {location.state?.message || 'Registration successful! Please login.'}
          </div>
        )}

        {/* API Response Message Box */}
        {apiResponse.status && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: apiResponse.status === 'success' ? '#E8F5E9' : '#FFEBEE',
            color: apiResponse.status === 'success' ? '#2E7D32' : '#C62828',
            border: `1px solid ${apiResponse.status === 'success' ? '#C8E6C9' : '#FFCDD2'}`,
            textAlign: 'center'
          }}>
            {apiResponse.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Username:
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${fieldErrors.username ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              required
              disabled={loading}
            />
            {fieldErrors.username && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {fieldErrors.username}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${fieldErrors.password ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              required
              disabled={loading}
            />
            {fieldErrors.password && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#cccccc' : '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: '1rem',
              position: 'relative',
              ':hover': {
                backgroundColor: loading ? '#cccccc' : '#3367d6',
                transform: loading ? 'none' : 'translateY(-1px)',
                boxShadow: loading ? 'none' : '0 2px 4px rgba(0,0,0,0.2)'
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
                    width: '1rem',
                    height: '1rem',
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

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>Don't have an account?</p>
            <Link 
              to="/register" 
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#f0f0f0',
                color: '#4285f4',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: '#e0e0e0'
                }
              }}
            >
              Register Now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;