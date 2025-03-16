import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { theme } = useTheme();

  return (
    <section id="hero" className="relative bg-white transition-colors duration-300 pt-24 pb-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-50 opacity-50 rounded-bl-full transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tr from-indigo-50 opacity-50 rounded-tr-full transform -translate-x-1/4 translate-y-1/4"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
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
                Start Preparing
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
          
          {/* Stats - removed success rate */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-3xl font-bold text-blue-600">20+</p>
              <p className="text-sm text-gray-500">Practice Tests</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-3xl font-bold text-blue-600">15+</p>
              <p className="text-sm text-gray-500">Expert Mentors</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 