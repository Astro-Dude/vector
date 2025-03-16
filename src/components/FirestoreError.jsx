import React from 'react';
import { Link } from 'react-router-dom';

const FirestoreError = ({ onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4 flex justify-center">
          <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
        
        <div className="mb-6 text-gray-600">
          <p className="mb-3">
            We're having trouble connecting to our database service. This could be due to:
          </p>
          <ul className="text-left list-disc pl-5 mb-4">
            <li>A temporary connectivity issue</li>
            <li>Your network connection</li>
            <li>Our server maintenance</li>
          </ul>
          <p>
            Basic authentication features are still available, but some functionality may be limited.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          
          <Link
            to="/"
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>If this problem persists, please contact our support team.</p>
      </div>
    </div>
  );
};

export default FirestoreError; 