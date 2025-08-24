import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import ApiService from '../api/apiService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 Dashboard useEffect triggered');
    console.log('User exists:', !!user);
    console.log('User details:', user);
    
    const fetchStats = async () => {
      try {
        console.log('📊 Starting fetchStats...');
        setLoading(true);
        
        // Debug logging
        console.log('🔍 Dashboard Debug:');
        console.log('User:', user);
        console.log('Token:', ApiService.getAuthToken());
        console.log('Headers:', ApiService.getHeaders());
        
        console.log('🌐 About to call dashboard stats...');
        // Use the existing request method that includes auth headers
        const data = await ApiService.request('/dashboard/stats/');
        console.log('✅ Stats received:', data);
        setStats(data);
      } catch (error) {
        console.error('❌ Failed to load dashboard stats:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          response: error.response
        });
        setError(`Failed to load dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      console.log('✅ User exists, calling fetchStats');
      fetchStats();
    } else {
      console.log('❌ No user, skipping fetchStats');
      setLoading(false);
    }
  }, [user]);

  // Add some debug logging
  useEffect(() => {
    console.log('Dashboard - User:', user);
    console.log('Dashboard - Token:', ApiService.getAuthToken());
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Dashboard Error</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      padding: '2rem 1rem' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: '700', 
            marginBottom: '1rem',
            letterSpacing: '-0.025em'
          }}>
            Welcome, {user.username}!
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
            opacity: '0.9',
            fontWeight: '500'
          }}>
            {user.role === 'admin' && 'Gallery Administrator Dashboard'}
            {user.role === 'clerk' && 'Gallery Clerk Dashboard'}
            {user.role === 'visitor' && 'Art Gallery Visitor Portal'}
          </p>
        </div>

        {/* Stats Section - Show for admin and clerk */}
        {stats && (user.role === 'admin' || user.role === 'clerk') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              textAlign: 'center',
              border: '2px solid #3b82f6',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <h3 style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {stats.total_artists || 0}
              </h3>
              <p style={{ 
                fontSize: '1.2rem', 
                color: '#64748b', 
                fontWeight: '600'
              }}>
                Total Artists
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              textAlign: 'center',
              border: '2px solid #10b981',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <h3 style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#10b981',
                marginBottom: '0.5rem'
              }}>
                {stats.total_exhibitions || 0}
              </h3>
              <p style={{ 
                fontSize: '1.2rem', 
                color: '#64748b', 
                fontWeight: '600'
              }}>
                Total Exhibitions
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              textAlign: 'center',
              border: '2px solid #f59e0b',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <h3 style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#f59e0b',
                marginBottom: '0.5rem'
              }}>
                {stats.total_visitors || 0}
              </h3>
              <p style={{ 
                fontSize: '1.2rem', 
                color: '#64748b', 
                fontWeight: '600'
              }}>
                Total Visitors
              </p>
            </div>
            
            {/* Add a new stat for pending registrations if available */}
            {stats.pending_registrations !== undefined && (
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                textAlign: 'center',
                border: '2px solid #8b5cf6',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <h3 style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: '#8b5cf6',
                  marginBottom: '0.5rem'
                }}>
                  {stats.pending_registrations || 0}
                </h3>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: '#64748b', 
                  fontWeight: '600'
                }}>
                  Pending Registrations
                </p>
              </div>
            )}
          </div>
        )}

        {/* Visitor Welcome Section */}
        {user.role === 'visitor' && (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem 2rem',
            borderRadius: '16px',
            marginBottom: '3rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Welcome to the Art Gallery!
            </h2>
            <p style={{ 
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Explore our curated exhibitions, register for upcoming events, and immerse yourself in the world of fine art.
            </p>
          </div>
        )}

        {/* Admin Controls */}
        {user.role === 'admin' && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            marginBottom: '3rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              Gallery Management
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              <Link 
                to="/artists"
                style={{
                  display: 'block',
                  backgroundColor: '#7b7c7bff',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#6b6c6b';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#7b7c7bff';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                👨‍🎨 Manage Artists
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Add, update, and manage artist profiles
                </div>
              </Link>

              <Link 
                to="/exhibitions"
                style={{
                  display: 'block',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#1976D2';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#2196F3';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                🖼️ Manage Exhibitions
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Create and manage exhibition schedules
                </div>
              </Link>

              <Link 
                to="/artpieces"
                style={{
                  display: 'block',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#F57C00';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#FF9800';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                🎨 Manage Art Pieces
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Add art pieces and manage availability
                </div>
              </Link>

              <Link 
                to="/registrations"
                style={{
                  display: 'block',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#7B1FA2';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#9C27B0';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📋 Manage Registrations
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  View and manage exhibition registrations
                </div>
              </Link>

              <Link 
                to="/reports"
                style={{
                  display: 'block',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📊 Analytics & Reports
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  View popularity and availability reports
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Clerk Controls */}
        {user.role === 'clerk' && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            marginBottom: '3rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              Gallery Operations
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              <Link 
                to="/manage-visitors"
                style={{
                  display: 'block',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#7c3aed';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#8b5cf6';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                👥 Manage Visitors
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Handle visitor registrations and confirmations
                </div>
              </Link>

              <Link 
                to="/registrations"
                style={{
                  display: 'block',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#7B1FA2';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#9C27B0';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📋 Manage Registrations
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  View and manage exhibition registrations
                </div>
              </Link>

              <Link 
                to="/exhibition-setup"
                style={{
                  display: 'block',
                  backgroundColor: '#06b6d4',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#0891b2';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#06b6d4';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                🔧 Exhibition Setup
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Oversee exhibition setup and teardown
                </div>
              </Link>

              <Link 
                to="/reports"
                style={{
                  display: 'block',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📈 View Reports
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: '0.9', 
                  marginTop: '0.5rem',
                  fontWeight: '400'
                }}>
                  Access gallery analytics and reports
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Visitor Actions */}
        {user.role === 'visitor' && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            marginBottom: '3rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              Explore the Gallery
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <Link 
                to="/gallery"
                style={{
                  display: 'block',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '2rem',
                  textDecoration: 'none',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.backgroundColor = '#388E3C';
                  e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#4CAF50';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                🎨 View Exhibitions
                <div style={{ 
                  fontSize: '1rem', 
                  opacity: '0.9', 
                  marginTop: '1rem',
                  fontWeight: '400',
                  lineHeight: '1.4'
                }}>
                  Discover our current and upcoming art exhibitions
                </div>
              </Link>

              <Link 
                to="/my-registrations"
                style={{
                  display: 'block',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '2rem',
                  textDecoration: 'none',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.backgroundColor = '#1976D2';
                  e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = '#2196F3';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                📅 My Registrations
                <div style={{ 
                  fontSize: '1rem', 
                  opacity: '0.9', 
                  marginTop: '1rem',
                  fontWeight: '400',
                  lineHeight: '1.4'
                }}>
                  Manage your exhibition bookings and reservations
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', 
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '1.5rem'
          }}>
            Quick Actions
          </h3>
          <button 
            onClick={logout} 
            style={{ 
              backgroundColor: '#dc2626', 
              color: '#fff', 
              padding: '0.875rem 2rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Sign Out
          </button>
        </div>
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

export default Dashboard;