import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';

/**
 * A reusable test component that can be used with any set of questions
 */
const MockTest = ({ 
  questions = [], 
  testDuration = 120, // Default 120 minutes
  fullScreenRequired = true,
  fullScreenExitTimeout = 45, // In seconds
  resultsPath = '/test/:testId/results',
  testName = "Exam",
  passScore = 70, // Assuming a default passScore
  testId: propTestId // Accept testId as a prop
}) => {
  const { testId: paramTestId } = useParams();
  const navigate = useNavigate();
  const fullScreenRef = useRef(null);
  const { theme } = useTheme();
  
  // Use the prop testId if provided, otherwise fall back to the URL param
  const testId = propTestId || paramTestId;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(testDuration * 60); // Convert minutes to seconds
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [fullScreenExitTime, setFullScreenExitTime] = useState(null);
  const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Function to disable right-click
  const disableRightClick = (e) => {
    e.preventDefault();
  };

  // Function to disable copy paste
  const disableCopyPaste = (e) => {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v')) {
      e.preventDefault();
    }
  };

  // Enter full screen mode
  const enterFullScreen = () => {
    if (fullScreenRef.current) {
      try {
        if (fullScreenRef.current.requestFullscreen) {
          fullScreenRef.current.requestFullscreen();
        } else if (fullScreenRef.current.mozRequestFullScreen) {
          fullScreenRef.current.mozRequestFullScreen();
        } else if (fullScreenRef.current.webkitRequestFullscreen) {
          fullScreenRef.current.webkitRequestFullscreen();
        } else if (fullScreenRef.current.msRequestFullscreen) {
          fullScreenRef.current.msRequestFullscreen();
        }
        
        // Set test started to true when entering fullscreen
        setTestStarted(true);
        setIsFullScreen(true);
      } catch (err) {
        // If fullscreen fails but fullscreen is not required, still allow the test to start
        if (!fullScreenRequired) {
          setTestStarted(true);
          setIsFullScreen(true);
        }
      }
    }
  };

  // Exit full screen
  const exitFullScreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      
      // Don't set isFullScreen to false here - let the event handler handle it
    } catch (err) {
      console.error("Error attempting to exit full-screen mode:", err);
    }
  };

  // Setup event listeners
  useEffect(() => {
    if (fullScreenRequired) {
      document.addEventListener('contextmenu', disableRightClick);
      document.addEventListener('keydown', disableCopyPaste);
    }
    
    // Watch for fullscreen change
    const fullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement;
      
      setIsFullScreen(!!fullscreenElement);
      
      // If fullscreen is exited but test has started, start the warning timer
      if (!fullscreenElement && testStarted && fullScreenRequired) {
        setFullScreenExitTime(Date.now());
        setShowFullScreenWarning(true);
      } else if (fullscreenElement && testStarted) {
        // Reset if user returns to full screen
        setFullScreenExitTime(null);
        setShowFullScreenWarning(false);
      }
    };
    
    document.addEventListener('fullscreenchange', fullscreenChange);
    document.addEventListener('mozfullscreenchange', fullscreenChange);
    document.addEventListener('webkitfullscreenchange', fullscreenChange);
    document.addEventListener('msfullscreenchange', fullscreenChange);
    
    return () => {
      if (fullScreenRequired) {
        document.removeEventListener('contextmenu', disableRightClick);
        document.removeEventListener('keydown', disableCopyPaste);
      }
      
      document.removeEventListener('fullscreenchange', fullscreenChange);
      document.removeEventListener('mozfullscreenchange', fullscreenChange);
      document.removeEventListener('webkitfullscreenchange', fullscreenChange);
      document.removeEventListener('msfullscreenchange', fullscreenChange);
      
      // Ensure fullscreen is exited when component unmounts
      if (isFullScreen) {
        exitFullScreen();
      }
    };
  }, [isFullScreen, testStarted, fullScreenRequired]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !testSubmitted && testStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !testSubmitted && testStarted) {
      handleSubmitTest();
    }
  }, [timeRemaining, testSubmitted, testStarted]);
  
  // Add full screen exit monitor
  useEffect(() => {
    if (fullScreenExitTime && testStarted && !testSubmitted && fullScreenRequired) {
      const interval = setInterval(() => {
        const timeOutOfFullScreen = Math.floor((Date.now() - fullScreenExitTime) / 1000);
        
        // If user has been out of full screen for more than specified timeout, end the test
        if (timeOutOfFullScreen >= fullScreenExitTimeout) {
          clearInterval(interval);
          setTestSubmitted(true);
          
          // Check if testId exists
          if (!testId) {
  
            navigate('/dashboard');
            return;
          }
          
          // Navigate to results page with violation flag
          const resultPath = resultsPath.replace(':testId', testId);
          navigate(resultPath, {
            state: {
              answers: {...answers, ...textAnswers},
              questions: questions,
              timeSpent: testDuration * 60 - timeRemaining,
              endedDueToFullScreenViolation: true
            }
          });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [fullScreenExitTime, testStarted, testSubmitted, answers, textAnswers, questions, timeRemaining, navigate, testId, fullScreenRequired, fullScreenExitTimeout, testDuration, resultsPath]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
  };

  const handleTextAnswer = (questionId, value) => {
    setTextAnswers({
      ...textAnswers,
      [questionId]: value
    });
  };
  
  const handleMarkForReview = (questionId) => {
    if (markedForReview.includes(questionId)) {
      setMarkedForReview(markedForReview.filter(id => id !== questionId));
    } else {
      setMarkedForReview([...markedForReview, questionId]);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  const handleSubmitTest = () => {
    setTestSubmitted(true);
    
    // Combine multiple choice and text answers
    const allAnswers = {
      ...answers,
      ...Object.keys(textAnswers).reduce((acc, key) => {
        acc[key] = textAnswers[key];
        return acc;
      }, {})
    };
    
    // Check if testId exists
    if (!testId) {
      alert('An error occurred while submitting your test. Please try again or contact support.');
      return;
    }
    
    // Navigate to results using the template path
    const resultPath = resultsPath.replace(':testId', testId);
    
    navigate(resultPath, { 
      state: { 
        answers: allAnswers,
        questions,
        timeSpent: testDuration * 60 - timeRemaining,
        passScore: passScore,
        testName: testName,
        testId: testId
      }
    });
    
    // Exit fullscreen when submitting
    if (isFullScreen) {
      exitFullScreen();
    }
  };
  
  // If no questions are provided, show appropriate message
  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No questions available for this test.</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Helper function to parse **bold** syntax 
  const parseBoldText = (text) => {
    const parts = [];
    let lastIndex = 0;
    const boldPattern = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add the bold text
      parts.push({
        type: 'bold',
        content: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts;
  };
  
  return (
    <div ref={fullScreenRef} className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
      {/* Fullscreen prompt if test not started */}
      {!testStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md text-center`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Start {testName}</h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {fullScreenRequired 
                ? `This test must be taken in full-screen mode. The test will automatically end if you exit full-screen mode for more than ${fullScreenExitTimeout} seconds.` 
                : "Click the button below to start the test."}
            </p>
            <div className="flex flex-col space-y-4">
              <button 
                onClick={enterFullScreen}
                className={`px-6 py-3 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md`}
              >
                {fullScreenRequired ? "Enter Full Screen & Start Test" : "Start Test"}
              </button>
              {fullScreenRequired && !isFullScreen && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Full-screen mode is required for this test.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Add full screen warning */}
      {showFullScreenWarning && fullScreenRequired && (
        <div className="fixed inset-0 bg-red-500 bg-opacity-90 z-50 flex items-center justify-center">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md text-center`}>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Warning: Full Screen Exited!</h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your test will automatically be submitted in <span className="font-bold">{fullScreenExitTimeout - Math.floor((Date.now() - fullScreenExitTime) / 1000)} seconds</span> if you don't return to full screen mode.</p>
            <button 
              onClick={enterFullScreen}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Return to Full Screen
            </button>
          </div>
        </div>
      )}
      
      {/* Test content shown when test has started */}
      {testStarted && (
        <>
          {/* Header with timer and submit button */}
          <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md py-4 px-6 flex items-center justify-between`}>
            <div className="flex items-center">
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{testName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} px-4 py-2 rounded-md flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={() => setShowConfirmation(true)}
                className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md`}
              >
                Submit Test
              </button>
            </div>
          </header>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Question panel */}
            <div className={`flex-1 overflow-y-auto p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h2>
                    <button
                      onClick={() => handleMarkForReview(currentQuestion.id)}
                      className={`flex items-center text-sm font-medium ${
                        markedForReview.includes(currentQuestion.id)
                          ? 'text-yellow-600'
                          : theme === 'dark' ? 'text-gray-400 hover:text-yellow-600' : 'text-gray-500 hover:text-yellow-600'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mr-1 ${
                          markedForReview.includes(currentQuestion.id) ? 'fill-yellow-400' : 'fill-none'
                        }`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      {markedForReview.includes(currentQuestion.id)
                        ? 'Marked for review'
                        : 'Mark for review'}
                    </button>
                  </div>
                  
                  <div className="prose max-w-none mb-6">
                    {currentQuestion.questionText.split('\n').map((paragraph, index) => (
                      <p key={index} className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {parseBoldText(paragraph).map((part, i) => (
                          part.type === 'bold' 
                            ? <strong key={i}>{part.content}</strong> 
                            : <span key={i}>{part.content}</span>
                        ))}
                      </p>
                    ))}
                  </div>
                  
                  {currentQuestion.type === 'mcq' && currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                            answers[currentQuestion.id] === option.id
                              ? theme === 'dark' ? 'bg-blue-900/30 border-blue-900' : 'bg-blue-50 border-blue-200'
                              : theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={answers[currentQuestion.id] === option.id}
                            onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                          />
                          <div className="ml-3">
                            <span className={`block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{option.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Your Answer:
                        </label>
                        <input
                          type="text"
                          value={textAnswers[currentQuestion.id] || ''}
                          onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                          className={`w-full p-2 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:border-blue-600' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md`}
                          placeholder="Enter your answer here"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`px-6 py-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t flex justify-between`}>
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 flex items-center text-sm font-medium rounded-md ${
                      currentQuestionIndex === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`px-4 py-2 flex items-center text-sm font-medium rounded-md ${
                      currentQuestionIndex === questions.length - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Question navigation panel */}
            <div className={`w-80 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l overflow-y-auto`}>
              <div className="p-6">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Question Navigation</h3>
                
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium 
                        ${index === currentQuestionIndex ? 'ring-2 ring-offset-2 ring-blue-600 ' : ''}
                        ${
                          markedForReview.includes(question.id)
                            ? theme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                            : answers[question.id] || textAnswers[question.id]
                            ? theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded mr-2`}></div>
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Not Attempted</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'} rounded mr-2`}></div>
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Attempted</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${theme === 'dark' ? 'bg-yellow-900' : 'bg-yellow-100'} rounded mr-2`}></div>
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Marked for Review</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Total Questions</span>
                      <span>{questions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Attempted</span>
                      <span>{Object.keys(answers).length + Object.keys(textAnswers).length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Marked for Review</span>
                      <span>{markedForReview.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Not Attempted</span>
                      <span>{questions.length - (Object.keys(answers).length + Object.keys(textAnswers).length)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className={`inline-block align-bottom ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6`}
            >
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Confirm Test Submission
                  </h3>
                  <div className="mt-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      You have answered {Object.keys(answers).length + Object.keys(textAnswers).length} out of {questions.length} questions.
                      Are you sure you want to submit your test?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                  onClick={handleSubmitTest}
                >
                  Submit Test
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm`}
                  onClick={() => setShowConfirmation(false)}
                >
                  Continue Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MockTest.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      questionText: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      category: PropTypes.string,
      correctAnswer: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          text: PropTypes.string
        })
      )
    })
  ),
  testDuration: PropTypes.number,
  fullScreenRequired: PropTypes.bool,
  fullScreenExitTimeout: PropTypes.number,
  resultsPath: PropTypes.string,
  testName: PropTypes.string,
  passScore: PropTypes.number,
  testId: PropTypes.string
};

export default MockTest; 