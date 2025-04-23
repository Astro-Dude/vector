import { useState, useEffect } from 'react';
import { getTestHistory } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TEST_IDS } from '../data/testConfig';

const TestHistory = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchTestHistory();
  }, [currentUser]);

  const fetchTestHistory = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const history = await getTestHistory(currentUser.uid);
      setTestHistory(history);
      setError(null);
    } catch (err) {
      console.error("Error fetching test history:", err);
      setError("Failed to load test history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to format time from seconds
  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  // Function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to get status badge
  const getStatusBadge = (status) => {
    if (status === 'pass') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Pass</span>;
    } else if (status === 'fail') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Fail</span>;
    } else if (status === 'violation') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Violation</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
  };

  // Function to get the test name from TEST_IDS
  const getTestName = (testId) => {
    if (!testId) return 'Unknown Test';
    
    // Find the key in TEST_IDS that matches the testId value
    const testKey = Object.keys(TEST_IDS).find(key => TEST_IDS[key] === testId);
    
    // Return the key (which is more readable) or fallback to the testId
    return testKey || `Test ${testId}`;
  };

  // Function to get student name
  const getStudentName = (test) => {
    // First try to use the name stored with the test (from saveTestResult)
    if (test.studentName && test.studentName !== "Unknown Student") {
      return test.studentName;
    }
    
    // Then try user profile
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    
    // Then try current user
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    
    // Default fallback
    return "Unknown Student";
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} overflow-hidden shadow rounded-lg mb-6`}>
      <div className="px-4 py-5 sm:p-6">
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Test History</h2>
        
        <div className="overflow-y-auto max-h-[70vh] pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <svg className={`animate-spin h-8 w-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : testHistory.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>No test history found</p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>You haven't taken any tests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Test Name</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Student</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Contact</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Date</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Score</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Questions</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Time Spent</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                  {testHistory.map((test) => (
                    <tr key={test.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {test.testName || getTestName(test.testId)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {getStudentName(test)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {test.phoneNumber || userProfile?.phoneNumber || <span className={`italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Not provided</span>}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {formatDate(test.timestamp)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <span className="font-medium">{test.percentage?.toFixed(1) || 0}%</span> ({test.score || 0}/{test.questionsTotal || 0})
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {test.questionsAttempted || 0}/{test.questionsTotal || 0} attempted
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {formatTime(test.timeSpent)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {getStatusBadge(test.resultStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={fetchTestHistory}
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestHistory; 