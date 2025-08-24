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
import RegistrationManagement from './pages/RegistrationManagement'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard - accessible by both admin and clerk */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
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

          {/* Manage Visitors - for both admin and clerk users */}
          <Route 
            path="/manage-visitors" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <ManageVisitors />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/registrations" 
            element={
              <ProtectedRoute requiredRole="clerk">
                <RegistrationManagement />
              </ProtectedRoute>
            } 
          />
		  
		  
          
          {/* Public exhibitions - visitors can access (this should come AFTER admin routes) */}
          <Route 
            path="/gallery" 
              element={<ViewExhibitions />}
          />
          
          <Route 
            path="/my-registrations" 
              element={<VisitorRegistrations />}
          />
          
          {/* Default redirect to dashboard if logged in, otherwise login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Unauthorized access page */}
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Go to Dashboard</a>
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