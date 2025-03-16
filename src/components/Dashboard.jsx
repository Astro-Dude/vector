import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FirestoreError from './FirestoreError';
import NameLogo from '../assets/images/NameLogo.png';
import { testConfigs } from '../data/testConfig';

const Dashboard = () => {
  const { currentUser, userProfile, logout, firestoreConnected, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  
  // Sample purchased tests - use userProfile data if available
  const purchasedTests = userProfile?.purchasedTests || [];
  
  // Sample upcoming events
  const upcomingEvents = [
    // { id: 'event-1', title: 'NSET Preparation Webinar', date: 'June 15, 2024', time: '6:00 PM IST', status: 'upcoming' },
    // { id: 'event-2', title: 'Mock Interview Session', date: 'June 20, 2024', time: '5:00 PM IST', status: 'upcoming' },
    // { id: 'event-3', title: 'Q&A with NSET Toppers', date: 'June 25, 2024', time: '7:00 PM IST', status: 'upcoming' },
  ];
  
  // Handle retry when Firestore connection fails
  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      if (currentUser) {
        await getUserProfile(currentUser.uid);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSyllabus = () => {
    setShowSyllabus(!showSyllabus);
    setMenuOpen(false); // Close the menu when selecting syllabus
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `₹${price}` : price;
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}/start`);
  };
  
  const handlePurchase = (testId) => {
    // You can implement purchase logic here
    console.log(`Purchase initiated for ${testId}`);
    alert("Purchase flow not yet implemented. This will be connected to your payment gateway.");
  };

  // Show Firestore error component only if connection fails completely and it's not retrying
  if (!firestoreConnected && !isRetrying && !userProfile) {
    return <FirestoreError onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side with menu icon and logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo moved next to menu icon */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img src={NameLogo} alt="Vector" className="h-22" />
              </Link>
            </div>
            
            {/* Empty div to maintain flex spacing */}
            <div className="flex-1"></div>
            
            {/* Profile on right */}
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {currentUser?.displayName?.charAt(0) || 'U'}
                </div>
                <span className="ml-2 text-gray-700 hidden sm:inline">{currentUser?.displayName || 'User'}</span>
                <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu - appears when menu icon is clicked */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Completely transparent overlay - just for click handling */}
          <div 
            className="fixed inset-0 bg-transparent" 
            onClick={toggleMenu}
            aria-hidden="true"
          ></div>
          
          {/* Menu panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-4 flex items-center justify-between">
              <span className="text-xl font-bold text-blue-600">Menu</span>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="py-4">
                <div className="px-2 space-y-1">
                  <Link 
                    to="/" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Home
                  </Link>
                  <button 
                    onClick={toggleSyllabus}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Syllabus
                  </button>
                  {/* Additional menu items can be added here later */}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome section - only visible on home page */}
          {!showSyllabus && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser?.displayName || 'Student'}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Your one-stop platform for NSET preparation. Access mock tests, study resources, and more.
                </p>
              </div>
            </div>
          )}

          {/* Syllabus section - only visible when toggled */}
          {showSyllabus ? (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">NSET Exam Syllabus</h2>
                
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  {/* Logical Reasoning section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">Logical Reasoning</h3>
                    <p className="text-gray-700 mb-4">
                      The Logical Reasoning section has questions that will test your ability to read
                      and analyse visual representations of data. It will also test your ability to think
                      logically. You may also need to structure data that appears unstructured. This
                      section requires the candidate to have sound skills in logical reasoning and
                      data representation.
                    </p>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Topics covered:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Series, Blood Relations, & Family Tree</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Simple & Compound Interest</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Direction Sense</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Puzzles</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Seating Arrangement</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Venn Diagram</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Data Sufficiency</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pie Charts</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Bar and Line Graphs</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Coding-Decoding</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Sets and Caselets</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Clocks and Calendars</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Syllogism</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Percentages</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Profit and Loss</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Speed, Time and Distance</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Work and Time</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mathematics section */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">Mathematics</h3>
                    <p className="text-gray-700 mb-4">
                      The mathematics section evaluates the candidate's knowledge and
                      problem-solving skills. It gauges their quantitative aptitude and ability to
                      apply mathematical concepts to solve problems.
                    </p>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Topics covered:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Number Theory</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Exponentials and Logarithms</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Probability and Statistics</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Permutation and Combinations</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Ratio and Proportion</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Sets (Venn Diagrams)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard grid - only visible when syllabus is not shown */
            <>
              {/* Mock Interview Section - Separate from other content */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Interview Preparation</h2>
                  
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-800">1:1 Mock Interview Session</h3>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">Practice with real SST students who have successfully cleared the NSET exam</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">Get personalized feedback on your interview performance</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">Improve your interview skills and confidence</span>
                        </li>
                      </ul>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          30 min
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          With SST Students
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-gray-900 mb-2">₹599</span>
                      <button 
                        onClick={() => handlePurchase('mock-interview')}
                        className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Resources/Test Series section */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Test Series & Resources</h2>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {/* Test Series */}
                      {Object.keys(testConfigs).map((testId) => {
                        const test = testConfigs[testId];
                        return (
                          <div key={testId} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <h3 className="text-md font-medium text-gray-900">{test.testName}</h3>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  {test.testDuration} min
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {test.totalQuestions} Questions
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-md font-medium text-gray-900">{formatPrice(test.price)}</span>
                              {test.isFree ? (
                                <button 
                                  onClick={() => handleStartTest(testId)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Start Test
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handlePurchase(testId)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Purchase
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Purchased/Events section */}
                <div className="space-y-6">
                  {/* Purchased Tests */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Your Purchased Tests</h2>
                      
                      <div className="max-h-[30vh] overflow-y-auto pr-2">
                        {purchasedTests.length > 0 ? (
                          <div className="space-y-4">
                            {purchasedTests.map((test) => (
                              <div key={test.id} className="border rounded-lg p-4 flex justify-between items-center">
                                <div>
                                  <h3 className="text-md font-medium text-gray-900">{test.title}</h3>
                                  <p className="mt-1 text-sm text-gray-500">Purchased on {test.purchaseDate}</p>
                                </div>
                                <Link
                                  to={`/test/${test.id}/start`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Start Test
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">You haven't purchased any tests yet.</p>
                            <p className="mt-2 text-sm text-gray-500">
                              Check out our test series and purchase one to start your preparation.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Events */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h2>
                      
                      <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                        {upcomingEvents.length > 0 ? (
                          upcomingEvents.map((event) => (
                            <div key={event.id} className="border rounded-lg p-4">
                              <h3 className="text-md font-medium text-gray-900">{event.title}</h3>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                  <p>{event.date} at {event.time}</p>
                                </div>
                                <button
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Register
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No upcoming events at the moment.</p>
                            <p className="mt-2 text-sm text-gray-500">
                              Check back later for new events.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* No footer as requested */}
    </div>
  );
};

export default Dashboard; 