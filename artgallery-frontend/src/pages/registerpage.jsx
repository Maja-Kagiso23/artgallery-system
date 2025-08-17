import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Username validation
    if (!userData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (userData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    // Email validation
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!userData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (userData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/[A-Z]/.test(userData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(userData.password)) {
      newErrors.password = 'Password must contain at least one number';
      isValid = false;
    } else if (!/[^A-Za-z0-9]/.test(userData.password)) {
      newErrors.password = 'Password must contain at least one special character';
      isValid = false;
    }

    // Confirm password validation
    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: ''
    });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone
      });

      // Registration successful
      navigate('/login', {
        state: {
          registrationSuccess: true,
          message: 'Registration successful! Please login.'
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle API validation errors
      if (error.message.includes('username')) {
        setErrors(prev => ({
          ...prev,
          username: 'Username already exists'
        }));
      } else if (error.message.includes('email')) {
        setErrors(prev => ({
          ...prev,
          email: 'Email already registered'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: error.message || 'Registration failed. Please try again.'
        }));
      }
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
          Register
        </h1>
        
        {/* General error message */}
        {errors.general && (
          <div style={{
            color: '#F44336',
            backgroundColor: '#FFEBEE',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Username*
            </label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${errors.username ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              disabled={loading}
            />
            {errors.username && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {errors.username}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email*
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${errors.email ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              disabled={loading}
            />
            {errors.email && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Password*
            </label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${errors.password ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              disabled={loading}
            />
            {errors.password && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {errors.password}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Confirm Password*
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={userData.confirmPassword}
              onChange={handleChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${errors.confirmPassword ? '#F44336' : '#ddd'}`,
                borderRadius: '4px'
              }}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span style={{ color: '#F44336', fontSize: '0.8rem' }}>
                {errors.confirmPassword}
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
                <span style={{ opacity: 0 }}>Register</span>
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
                  Registering...
                </div>
              </>
            ) : 'Register'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>Already have an account?</p>
            <Link 
              to="/login" 
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
              Login Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;