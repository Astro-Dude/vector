import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  
  return (
    <footer className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Vector</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Comprehensive preparation resources to help you crack the Scaler School of Technology NSET entrance exam.
            </p>
            <div className="flex space-x-4">
              <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}>
                <span className="sr-only">YouTube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}>
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}>
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/vector-ed/" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'}`}>
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Preparation</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Test Series
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Topic-Wise Practice
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Mock Interviews
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Live Sessions
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Performance Analysis
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  About NSET Exam
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Syllabus
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-blue-500' : 'text-gray-600 hover:text-blue-600'}`}>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`mt-12 pt-8 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-center text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            &copy; {currentYear} Vector. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 