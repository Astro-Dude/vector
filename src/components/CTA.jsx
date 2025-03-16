import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CTA = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <section id="cta" className="relative py-16 bg-blue-600 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 transform -translate-x-1/4 -translate-y-1/4">
          <div className="w-64 h-64 rounded-full bg-white opacity-5"></div>
        </div>
        <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
          <div className="w-96 h-96 rounded-full bg-white opacity-5"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            {currentUser ? 'Continue Your NSET Journey' : 'Start Your NSET Preparation Today'}
          </h2>
          <p className="max-w-xl mx-auto text-xl text-blue-100 mb-10">
            {currentUser 
              ? 'Access your personalized dashboard to track your progress and continue your NSET preparation.'
              : 'Join hundreds of students who are preparing for Scaler School of Technology\'s entrance exam with Vector.'}
          </p>
          
          {currentUser ? (
            <div className="flex flex-col items-center">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link 
                  to="/dashboard"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  to="/test/sample/start"
                  className="px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  Take Free Sample Test
                </Link>
              </div>
              <p className="text-blue-100 mt-2">
                View your purchased tests, track your progress, and access study resources.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-center">
                <p className="text-blue-100 mb-6">Sign in with Google to access all resources and take tests</p>
                
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                  {googleLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24">
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

                <Link 
                  to="/test/sample/start"
                  className="px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  Try Free Sample Test
                </Link>
              </div>
            </div>
          )}
          
          {!currentUser && (
            <p className="mt-6 text-sm text-blue-100">
              By signing in, you agree to our <a href="#" className="underline hover:text-white">Terms</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
            </p>
          )}
        </div>
        
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center p-4 bg-blue-700 rounded-lg">
            <span className="text-3xl font-bold text-white mb-1">20+</span>
            <span className="text-blue-100">NSET Practice Tests</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-blue-700 rounded-lg">
            <span className="text-3xl font-bold text-white mb-1">500+</span>
            <span className="text-blue-100">Practice Questions</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-blue-700 rounded-lg">
            <span className="text-3xl font-bold text-white mb-1">15+</span>
            <span className="text-blue-100">Expert Mentors</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-blue-700 rounded-lg">
            <span className="text-3xl font-bold text-white mb-1">90%</span>
            <span className="text-blue-100">Success Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA; 