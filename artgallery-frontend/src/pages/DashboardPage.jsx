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
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      <h1>Welcome, {user.username}!</h1>
      <p>Role: {user.role}</p>

      {/* Show stats only for clerk and admin */}
      {stats && (user.role === 'admin' || user.role === 'clerk') && (
        <div className="stats" style={{ marginBottom: '2rem' }}>
          <h2>Quick Stats</h2>
          <ul>
            <li>Total Artists: {stats.total_artists}</li>
            <li>Total Exhibitions: {stats.total_exhibitions}</li>
            <li>Total Visitors: {stats.total_visitors}</li>
          </ul>
        </div>
      )}

      {/* Visitor sees limited dashboard */}
      {user.role === 'visitor' && (
        <div className="visitor-welcome" style={{ marginBottom: '2rem' }}>
          <h2>Welcome to the Art Gallery!</h2>
          <p>Explore our exhibitions and register for events.</p>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="admin-section">
          <h2>Admin Controls</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/artists"
              style={{
                display: 'inline-block',
                backgroundColor: '#7b7c7bff',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              Manage Artists
            </Link>
            <Link 
              to="/exhibitions"
              style={{
                display: 'inline-block',
                backgroundColor: '#2196F3',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              Manage Exhibitions
            </Link>
            <Link 
              to="/artpieces"
              style={{
                display: 'inline-block',
                backgroundColor: '#FF9800',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              Manage Art Pieces
            </Link>
          </div>
        </div>
      )}

      {user.role === 'clerk' && (
        <div className="clerk-section">
          <h2>Clerk Controls</h2>
          <button>Manage Visitors</button>
          <button>Handle Registrations</button>
        </div>
      )}

      {user.role === 'visitor' && (
        <div className="visitor-section">
          <h2>Visitor Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/gallery"
              style={{
                display: 'inline-block',
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              View Exhibitions
            </Link>
            <Link 
              to="/my-registrations"
              style={{
                display: 'inline-block',
                backgroundColor: '#2196F3',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600'
              }}
            >
              My Registrations
            </Link>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button onClick={logout} style={{ backgroundColor: '#c00', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;