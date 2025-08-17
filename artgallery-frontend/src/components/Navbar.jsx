
// components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, RoleBasedComponent } from '../auth/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AG</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Art Gallery</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Public Links */}
            <Link
              to="/"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActiveLink('/') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/artists"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActiveLink('/artists') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Artists
            </Link>
            <Link
              to="/artpieces"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActiveLink('/artpieces') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Art Pieces
            </Link>
            <Link
              to="/exhibitions"
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActiveLink('/exhibitions') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Exhibitions
            </Link>

            {/* Authenticated User Links */}
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-gray-700 hover:text-blue-600 transition-colors ${
                    isActiveLink('/dashboard') ? 'text-blue-600 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </Link>

                {/* Clerk/Admin Links */}
                <RoleBasedComponent allowedRoles={['clerk', 'admin']}>
                  <Link
                    to="/admin"
                    className={`text-gray-700 hover:text-blue-600 transition-colors ${
                      location.pathname.startsWith('/admin') ? 'text-blue-600 font-semibold' : ''
                    }`}
                  >
                    Admin Panel
                  </Link>
                </RoleBasedComponent>
              </>
            )}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Welcome, </span>
                    <Link
                      to="/profile"
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {user?.username}
                    </Link>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActiveLink('/') ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                Home
              </Link>
              <Link
                to="/artists"
                onClick={() => setIsMenuOpen(false)}
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActiveLink('/artists') ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                Artists
              </Link>
              <Link
                to="/artpieces"
                onClick={() => setIsMenuOpen(false)}
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActiveLink('/artpieces') ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                Art Pieces
              </Link>
              <Link
                to="/exhibitions"
                onClick={() => setIsMenuOpen(false)}
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  isActiveLink('/exhibitions') ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                Exhibitions
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-gray-700 hover:text-blue-600 transition-colors ${
                      isActiveLink('/dashboard') ? 'text-blue-600 font-semibold' : ''
                    }`}
                  >
                    Dashboard
                  </Link>
                  <RoleBasedComponent allowedRoles={['clerk', 'admin']}>
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-gray-700 hover:text-blue-600 transition-colors ${
                        location.pathname.startsWith('/admin') ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      Admin Panel
                    </Link>
                  </RoleBasedComponent>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Profile ({user?.username})
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-left text-red-600 hover:text-red-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;