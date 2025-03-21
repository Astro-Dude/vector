// import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Hero = () => {
  // Remove theme references
  // const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText('SHAUE061');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="hero" className="relative bg-white pt-24 pb-16 overflow-hidden">
      {/* Referral Banner - Fixed position below header */}
      <div className="fixed top-16 left-0 right-0 z-40 w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <div 
                className="bg-white p-1 rounded-md mr-3 cursor-pointer flex items-center" 
                onClick={copyCode}
                title="Click to copy"
              >
                <span className="font-mono text-base font-bold text-blue-600 px-2">SHAUE061</span>
                {copied ? (
                  <span className="text-green-600 text-xs px-1">Copied!</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <p className="text-white text-sm mr-3">Use this code for 50% OFF on NSET registration (₹500 instead of ₹1000)</p>
              <a 
                href="https://www.scaler.com/school-of-technology/application/?rce=4dd65cf3cf67&rcy=1&utm_source=SST_student_referral " 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-3 py-1 bg-white text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors"
              >
                Apply Now
              </a>
    
            </div>
          </div>
        </div>
      </div>

      {/* Add some top padding to accommodate the fixed banner */}
      <div className="h-16 sm:h-12"></div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-50 opacity-50 rounded-bl-full transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tr from-indigo-50 opacity-50 rounded-tr-full transform -translate-x-1/4 translate-y-1/4"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center py-10">
        <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0 lg:pr-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            <span className="block">Ace the</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Scaler NSET Exam
            </span>
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
            Comprehensive preparation resources to help you secure admission to Scaler School of Technology. Our specialized NSET test series and expert mentorship set you up for success.
          </p>
          <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
            <div className="rounded-md shadow">
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
              >
                Free Sample Test
              </Link>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-all duration-300"
              >
                Explore Test Series
              </Link>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl transform transition-all duration-500 hover:scale-105">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative text-center p-6">
                <h2 className="text-4xl font-bold text-white mb-2">Vector</h2>
                <p className="text-xl text-blue-100 italic">Direction to success</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 