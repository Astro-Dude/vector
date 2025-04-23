import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      
      // Sign in with Google
      await signInWithGoogle();
      
      // Force navigation to dashboard - this ensures redirection happens
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Sign in to your account
        </h2>
        <p className={`mt-2 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Access all NSET preparation resources and track your progress
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} py-8 px-4 shadow sm:rounded-lg sm:px-10`}>
          {error && (
            <div className={`mb-4 ${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4`}>
              <p>{error}</p>
            </div>
          )}
          
          {/* Google Sign-in Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className={`w-full flex justify-center py-3 px-4 ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } border rounded-md shadow-sm text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {googleLoading ? (
                <span className="flex items-center">
                  <svg className={`animate-spin -ml-1 mr-2 h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M21.35 11.1h-9.17v2.17h5.3c-.22 1.16-.87 2.15-1.86 2.81v2.34h3.03c1.77-1.63 2.79-4.02 2.79-6.86 0-.66-.06-1.3-.17-1.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.18 21c2.52 0 4.65-.83 6.2-2.25l-3.03-2.34c-.84.56-1.92.89-3.17.89-2.44 0-4.5-1.64-5.24-3.85h-3.12v2.42C5.25 18.77 8.4 21 12.18 21z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.94 13.45c-.19-.57-.3-1.18-.3-1.8 0-.62.11-1.22.3-1.79V7.44H3.82a8.79 8.79 0 0 0 0 8.42l3.12-2.41z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12.18 7.8c1.37 0 2.6.47 3.56 1.4l2.69-2.68A8.86 8.86 0 0 0 12.18 4c-3.78 0-6.93 2.23-8.36 5.44l3.12 2.41c.74-2.21 2.8-3.85 5.24-3.85z"
                    />
                  </svg>
                  Sign in with Google
                </span>
              )}
            </button>
          </div>
          
          <div className="mt-6">
            <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              By signing in, you agree to our <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Terms</a> and <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</a>.
            </p>
          </div>
          
          <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-center">
              <Link
                to="/"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Return to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 