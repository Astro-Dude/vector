import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FirestoreError from './FirestoreError';
import NameLogo from '../assets/images/NameLogo.png';

const Dashboard = () => {
  const { currentUser, userProfile, logout, firestoreConnected, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Sample test offerings
  const sampleTests = [
    { id: 'nset-2024-1', title: 'NSET 2024 Mock Test 1', duration: 60, questions: 50, price: 499, status: 'purchase' },
    { id: 'nset-2024-2', title: 'NSET 2024 Mock Test 2', duration: 60, questions: 50, price: 499, status: 'purchase' },
    { id: 'nset-2024-full', title: 'NSET 2024 Full Test Series', duration: 'Varies', questions: '250+', price: 1999, status: 'purchase' },
    { id: 'sample', title: 'NSET Free Sample Test', duration: 60, questions: 21, price: 'Free', status: 'free' },
  ];
  
  // Sample purchased tests - use userProfile data if available
  const purchasedTests = userProfile?.purchasedTests || [];
  
  // Sample upcoming events
  const upcomingEvents = [
    { id: 'event-1', title: 'NSET Preparation Webinar', date: 'June 15, 2024', time: '6:00 PM IST', status: 'upcoming' },
    { id: 'event-2', title: 'Mock Interview Session', date: 'June 20, 2024', time: '5:00 PM IST', status: 'upcoming' },
    { id: 'event-3', title: 'Q&A with NSET Toppers', date: 'June 25, 2024', time: '7:00 PM IST', status: 'upcoming' },
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

  const formatPrice = (price) => {
    return typeof price === 'number' ? `₹${price}` : price;
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
          {/* Welcome section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser?.displayName || 'Student'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your one-stop platform for NSET preparation. Access mock tests, study resources, and more.
              </p>
            </div>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Resources/Test Series section */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Test Series & Resources</h2>
                
                <div className="space-y-4">
                  {sampleTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">{test.title}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            {test.duration} min
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {test.questions} Questions
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-md font-medium text-gray-900">{formatPrice(test.price)}</span>
                        {test.status === 'free' ? (
                          <Link
                            to={`/test/${test.id}/start`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Start Test
                          </Link>
                        ) : test.status === 'purchased' ? (
                          <Link
                            to={`/test/${test.id}/start`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Take Test
                          </Link>
                        ) : (
                          <button
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Purchase
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-5">
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all resources &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Purchased/Events section */}
            <div className="space-y-6">
              {/* Purchased Tests */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Your Purchased Tests</h2>
                  
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
              
              {/* Upcoming Events */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h2>
                  
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
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
                    ))}
                  </div>
                  
                  <div className="mt-5">
                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View all events &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* No footer as requested */}
    </div>
  );
};

export default Dashboard; 