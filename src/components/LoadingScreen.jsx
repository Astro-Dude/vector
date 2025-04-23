import React from 'react';
import { useTheme } from '../context/ThemeContext';

const LoadingScreen = ({ message = "Loading..." }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gray-900 bg-opacity-90' : 'bg-white bg-opacity-90'} z-50 flex flex-col items-center justify-center`}>
      <div className="relative">
        {/* Vector Logo Animation */}
        <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>V</div>
      </div>
      
      <p className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{message}</p>
      
      <div className={`mt-6 w-48 h-1.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
        <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingScreen; 