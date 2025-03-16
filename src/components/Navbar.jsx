import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import NameLogo from '../assets/images/NameLogo.png';

const Navbar = () => {
  const { theme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-white border-b border-gray-200 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img src={NameLogo} alt="Vector" className="h-22" />
              </Link>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <a href="#features" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600">
                Resources
              </a>
              <a href="#test-series" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600">
                Test Series
              </a>
              <a href="#testimonials" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600">
                Success Stories
              </a>
              <a href="#about-nset" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600">
                About NSET
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Dashboard
                </Link>
                <div className="ml-4 relative">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                    <span className="ml-2 text-gray-700">{currentUser.displayName || 'User'}</span>
                    <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Profile dropdown */}
                  {profileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="ml-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-label="Open mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              Resources
            </a>
            <a
              href="#test-series"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              Test Series
            </a>
            <a
              href="#testimonials"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              Success Stories
            </a>
            <a
              href="#about-nset"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              About NSET
            </a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5 space-y-2 flex-col">
              {currentUser ? (
                <>
                  <div className="flex items-center w-full">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{currentUser.displayName || 'User'}</div>
                      <div className="text-sm font-medium text-gray-500">{currentUser.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none text-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 