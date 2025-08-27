import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ArtistManagement from './pages/ArtistManagement';
import ExhibitionManagement from './pages/ExhibitionManagement';
import ArtPieceManagement from './pages/ArtPieceManagement'; 
import ViewExhibitions from './pages/ViewExhibitions';
import VisitorRegistrations from './pages/VisitorRegistrations';
import ManageVisitors from './pages/ManageVisitors';
import RegistrationManagement from './pages/RegistrationManagement';
import ExhibitionSetupManagement from './pages/ExhibitionSetupManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard - accessible by all authenticated users */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ADMIN ONLY ROUTES */}
          {/* Artist Management - only for admin users */}
          <Route 
            path="/artists" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ArtistManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Exhibition Management - only for admin users */}
          <Route 
            path="/exhibitions" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ExhibitionManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Art Piece Management - only for admin users */}
          <Route 
            path="/artpieces" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ArtPieceManagement />
              </ProtectedRoute>
            } 
          />

          {/* CLERK AND ADMIN ROUTES */}
          {/* Registration Management - for both admin and clerk users */}
          <Route 
            path="/registrations" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <RegistrationManagement />
              </ProtectedRoute>
            } 
          />

          {/* Exhibition Setup Management - for both admin and clerk users */}
          <Route 
            path="/exhibition-setup" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <ExhibitionSetupManagement />
              </ProtectedRoute>
            } 
          />

          {/* Manage Visitors - for both admin and clerk users */}
          <Route 
            path="/manage-visitors" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <ManageVisitors />
              </ProtectedRoute>
            } 
          />

          {/* Reports - for both admin and clerk users */}
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Reports & Analytics</h2>
                  <p>Reports functionality coming soon...</p>
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* VISITOR/PUBLIC ROUTES */}
          {/* Public exhibitions - visitors can access */}
          <Route 
            path="/gallery" 
            element={<ViewExhibitions />}
          />
          
          {/* User's own registrations */}
          <Route 
            path="/my-registrations" 
            element={
              <ProtectedRoute>
                <VisitorRegistrations />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect to dashboard if logged in, otherwise login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Unauthorized access page */}
          <Route 
            path="/unauthorized" 
            element={
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                  <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: '#dc2626', 
                    marginBottom: '1rem' 
                  }}>
                    Unauthorized Access
                  </h1>
                  <p style={{ 
                    color: '#64748b', 
                    marginBottom: '2rem',
                    fontSize: '1.1rem'
                  }}>
                    You don't have permission to access this page.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <a 
                      href="/dashboard" 
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        fontWeight: '600',
                        border: '1px solid #3b82f6'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#3b82f6';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#eff6ff';
                        e.target.style.color = '#3b82f6';
                      }}
                    >
                      Go to Dashboard
                    </a>
                    <a 
                      href="/login" 
                      style={{
                        color: '#64748b',
                        textDecoration: 'none',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        fontWeight: '600',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      Login Again
                    </a>
                  </div>
                </div>
              </div>
            } 
          />

          {/* 404 Not Found - catch all unmatched routes */}
          <Route 
            path="*" 
            element={
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                  <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: '#374151', 
                    marginBottom: '1rem' 
                  }}>
                    Page Not Found
                  </h1>
                  <p style={{ 
                    color: '#64748b', 
                    marginBottom: '2rem',
                    fontSize: '1.1rem'
                  }}>
                    The page you're looking for doesn't exist.
                  </p>
                  <a 
                    href="/dashboard" 
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      border: '1px solid #3b82f6'
                    }}
                  >
                    Return to Dashboard
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;