import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import ApiService from '../api/apiService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await ApiService.request('/dashboard/stats/');
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
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

      {stats && (
        <div className="stats" style={{ marginBottom: '2rem' }}>
          <h2>Quick Stats</h2>
          <ul>
            <li>Total Artists: {stats.total_artists}</li>
            <li>Total Exhibitions: {stats.total_exhibitions}</li>
            <li>Total Visitors: {stats.total_visitors}</li>
          </ul>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="admin-section">
          <h2>Admin Controls</h2>
          <button>Manage Artists</button>
          <button>Manage Exhibitions</button>
          <button>Manage Clerks</button>
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
          <button>View Exhibitions</button>
          <button>Register for Event</button>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button onClick={logout} style={{ backgroundColor: '#c00', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px' }}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;
