import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import Name from '../assets/images/Name.png';
import Logo from '../assets/images/Logo.png';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
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
    <nav className={`fixed w-full z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <div className={`${theme === 'dark' ? 'logo-dark-filter' : ''}`}>
                  <img src={Logo} alt="Logo" className="h-10" />
                </div>
              </Link>
              <Link to="/">
                <div className={`${theme === 'dark' ? 'logo-name-dark-filter' : ''}`}>
                  <img src={Name} alt="Vector" className="h-20" />
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <ThemeToggle className={theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-blue-600'} />
            
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className={`ml-4 px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none`}
                >
                  Dashboard
                </Link>
                <div className="ml-4 relative">
                  <button
                    onClick={handleLogout}
                    className={`ml-4 px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none`}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`ml-4 px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none`}
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
            <ThemeToggle className={theme === 'dark' ? 'text-gray-200 mr-2' : 'text-gray-700 mr-2'} />
            <button
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-blue-600'} focus:outline-none`}
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
          <div className={`pt-4 pb-3 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center px-5 space-y-2 flex-col">
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`block w-full px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none text-center mb-2`}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`block w-full px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none`}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`block w-full px-4 py-2 border ${theme === 'dark' ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none text-center`}
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

      {/* CSS for logo filters in dark mode */}
      <style jsx="true">{`
        .logo-dark-filter {
          filter: invert(0.8) sepia(0.5) hue-rotate(5deg) saturate(5) brightness(1.2);
          /* Creates a warm sunlight effect by inverting, adding sepia, slight hue-rotation to orange */
        }
        
        .logo-name-dark-filter {
          filter: invert(0.8) sepia(0.6) hue-rotate(325deg) saturate(4) brightness(1.4) drop-shadow(0 0 5px rgba(255, 165, 0, 0.7));
          /* Creates golden sun glow effect with orange drop shadow */
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 