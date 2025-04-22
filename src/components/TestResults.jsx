import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { saveTestResult } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Generic test results component that can be used with any question set
 * and displays a summary of the test results
 */
const TestResults = ({ 
  resultsTitle = "Test Results",
  allowRetake = true,
  returnPath = '/dashboard',
  customFeedback = null,
  passScore = 35 // Percentage to pass
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testId } = useParams();
  const { currentUser } = useAuth();
  
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [resultStatus, setResultStatus] = useState('');
  const [endedDueToViolation, setEndedDueToViolation] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  
  // Use a ref to track whether we've attempted to save this test result
  const saveAttemptedRef = useRef(false);
  
  // Process test results from location state
  useEffect(() => {
    // Only process if we have location state and haven't already saved
    if (location.state && !saveAttemptedRef.current) {
      const { answers, questions, timeSpent, endedDueToFullScreenViolation, passScore: testPassScore, testName } = location.state;
      
      setAnswers(answers || {});
      setQuestions(questions || []);
      setTimeSpent(timeSpent || 0);
      setEndedDueToViolation(!!endedDueToFullScreenViolation);
      
      // Use the passScore from state if provided, otherwise use the prop
      const effectivePassScore = testPassScore !== undefined ? testPassScore : passScore;
      
      // Calculate score and percentage
      if (questions && questions.length > 0 && answers) {
        let correctCount = 0;
        
        // Count correct answers
        questions.forEach(question => {
          if (
            question.correctAnswer && 
            answers[question.id] 
          ) {
            // Convert both answers to strings, lower case, and trim whitespace
            const userAnswer = answers[question.id].toString().toLowerCase().trim();
            const correctAnswer = question.correctAnswer.toString().toLowerCase().trim();
            
            // Compare the trimmed strings
            if (userAnswer === correctAnswer) {
              correctCount++;
            }
          }
        });
        
        const finalScore = correctCount;
        const finalPercentage = (correctCount / questions.length) * 100;
        
        setScore(finalScore);
        setPercentage(parseFloat(finalPercentage.toFixed(2)));
        
        // Determine result status
        if (endedDueToFullScreenViolation) {
          setResultStatus('violation');
        } else if (finalPercentage >= effectivePassScore) {
          setResultStatus('pass');
        } else {
          setResultStatus('fail');
        }
        
        // Save results to Firebase if user is logged in
        if (currentUser) {
          // Mark that we've attempted a save
          saveAttemptedRef.current = true;
          
          const testData = {
            testId,
            testName: testName || resultsTitle,
            score: finalScore,
            percentage: parseFloat(finalPercentage.toFixed(2)),
            questionsTotal: questions.length,
            questionsAttempted: Object.keys(answers).length,
            timeSpent,
            resultStatus: endedDueToFullScreenViolation ? 'violation' : (finalPercentage >= effectivePassScore ? 'pass' : 'fail')
          };
          
          saveTestResult(currentUser.uid, testData)
            .then(() => {
              console.log("Test result saved successfully");
              setResultSaved(true);
            })
            .catch(error => {
              console.error("Error saving test result:", error);
              // Allow another save attempt if needed
              saveAttemptedRef.current = false;
            });
        }
      }
    }
  }, [location.state, passScore, testId, currentUser, resultsTitle]);
  
  // Function to format time from seconds
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };
  
  // Handle retake test
  const handleRetakeTest = () => {
    navigate(`/test/${testId}`);
  };
  
  // Handle return to dashboard
  const handleReturnHome = () => {
    navigate(returnPath);
  };
  
  // Function to handle viewing solutions
  const handleViewSolutions = () => {
    navigate(`/test/${testId}/solutions`, { 
      state: { questions, answers }
    });
  };
  
  // Get appropriate status message and color classes
  const getStatusInfo = () => {
    if (endedDueToViolation) {
      return {
        title: 'Test Terminated',
        message: 'Your test was terminated due to a full-screen violation.',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        iconColor: 'text-red-500',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    } else if (resultStatus === 'pass') {
      return {
        title: 'Congratulations!',
        message: 'You have passed the test.',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        iconColor: 'text-green-500',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    } else {
      return {
        title: 'Better Luck Next Time',
        message: 'You did not meet the passing criteria for this test.',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-500',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // Render custom feedback if provided
  const renderFeedback = () => {
    if (customFeedback) {
      return typeof customFeedback === 'function' 
        ? customFeedback({ score, percentage, questions, answers, resultStatus, endedDueToViolation }) 
        : customFeedback;
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{resultsTitle}</h1>
          </div>
          
          {/* Result summary */}
          <div className={`px-6 py-8 ${statusInfo.bgColor} border-b border-gray-200`}>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className={`flex-shrink-0 mr-4 ${statusInfo.iconColor}`}>
                  {statusInfo.icon}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${statusInfo.color} mb-1`}>{statusInfo.title}</h2>
                  <p className="text-gray-600">{statusInfo.message}</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{percentage}%</div>
                <p className="text-gray-600">Final Score</p>
              </div>
            </div>
          </div>
          
          {/* Score breakdown */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Score Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xl font-semibold text-gray-900">{score} / {questions.length}</div>
                <p className="text-gray-600 text-sm">Questions Answered Correctly</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {Object.keys(answers).length} / {questions.length}
                </div>
                <p className="text-gray-600 text-sm">Questions Attempted</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xl font-semibold text-gray-900">{formatTime(timeSpent)}</div>
                <p className="text-gray-600 text-sm">Time Spent</p>
              </div>
            </div>
          </div>
          
          {/* Custom feedback section */}
          {renderFeedback()}
          
          {/* Actions */}
          <div className="px-6 py-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleReturnHome}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
            
            <button
              onClick={handleViewSolutions}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View Solutions
            </button>
            
            {allowRetake && !endedDueToViolation && (
              <button
                onClick={handleRetakeTest}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retake Test
              </button>
            )}
          </div>
        </div>
        
        {/* Additional resources section (optional) */}
        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h2 className="text-xl font-medium text-blue-800">Improve Your Skills</h2>
          </div>
          
          <div className="px-6 py-6">
            <p className="text-gray-600 mb-4">
              Want to improve your performance? Check out these resources:
            </p>
            
            <ul className="space-y-2 text-blue-600">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a href="#" className="hover:underline">Download practice questions</a>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <a href="#" className="hover:underline">Watch tutorial videos</a>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <a href="#" className="hover:underline">Study guides and resources</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults; 