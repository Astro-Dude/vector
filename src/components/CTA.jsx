import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CTA = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
              </div>
              <p className="text-blue-100 mt-2">
                View your purchased tests, track your progress, and access study resources.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link 
                  to="/login"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                >
                  Login to Access
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