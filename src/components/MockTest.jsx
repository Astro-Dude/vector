import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// NSET sample questions
const nsetQuestions = [
  {
    id: "q1",
    questionText: "(direction sense) A circular dial of an analog clock is placed in such a way that the minute hand points towards South at 12 noon. At what time between 9 and 10 am the minute hand will point towards South East?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "09:52:30",
    options: []
  },
  {
    id: "q2",
    questionText: "(coding-decoding) In a coded language if TIGER is written as 25799 and LION is written as 3569, what will be CRICKET?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q3",
    questionText: "(clocks) At what time between 5:30 and 6:00 p.m. does the hour and minute make 90 degrees?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "05:43:38",
    options: []
  },
  {
    id: "q4",
    questionText: "(PnC) The number of 4 digit numbers such that the first two digits and the last two digits are prime number and their sum is 102 and their is no 0 in the number",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q5",
    questionText: "(math) If n represent a positive number such that n²+10n is a perfect square, then number of values of n the satisfy this is?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q6",
    questionText: "(probability) There are 7 Red and 5 Blue in a bag, if 2 balls are picked from the bag without replacement, what is the probability of both balls being Red?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "7C2/12C2",
    options: []
  },
  {
    id: "q7",
    questionText: "(math) There is a 3*3 matrix that can be filled with numbers from 0-9 in such a way that their sum horizontally it vertically is a prime number then at most how many summations result can be a prime number",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q8",
    questionText: "(probability) A box has 2 Black, 3 Red, 5 White balls. If 5 balls are picked with replacement what is the probability that white ball is picked exactly twice",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q9",
    questionText: "(PnC) Number of ways to put 10 books in two identical boxes with exactly 5 in each box",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "10C5/2",
    options: []
  },
  {
    id: "q10",
    questionText: "(PnC) Also see the highest power of 2 in the 200! or 200C100",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q11",
    questionText: "(log) if log 25 to base 3 / log 5 to base 7 = log n to base 3 / log 2 root 2 to base 7 then value of n is?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q12",
    questionText: "(syllogism) similar to syllogism in which the give around 5 statement name as A,B,C,D,E and conclusion like if A+C is correct than d is correct or not. like that",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q13",
    questionText: "(Investing) P invests ₹30,000 for 6 months, A invests ₹40,000 for 12 months, and R invests ₹50,000 from the 4th month to the 12th month. After an overall profit of ₹125,000, ₹20,000 is set aside for an emergency fund. What will be the profit of P?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q14",
    questionText: "(ratio) Milkman has 2 cans of milk. 1st can milk and water ratio 3 : 2 and 2nd can 4 : 1. He mixes 15 litres from 1st can with 20 litres from second in large container. What's volume of milk in litres in the resulting mixture?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q15",
    questionText: "(PnC) How many 4 digits of ATM pin are there in which 2 first are ab second 2 are cd, ab and cd are prime numbers and ab+cd=102",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q16",
    questionText: "(percentage) Question from interest in which there are 3 friend who invested in parts 2 start than 1 friend joined after 3 month than 2nd friend leave investment after 9 month and in the end of a year they earn some profit take 20,000 for reinvest and remaining divide",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q17",
    questionText: "(number theory) A 3 digit number which is divisible by 7 but when divided with 23 leaves a remainder of 3",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q18",
    questionText: "(sets) Out of 50 each required to choose one language and sport. 20 choose French, 20 cricket, 12 German and cricket. How many choose French and football?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "12",
    options: []
  },
  {
    id: "q19",
    questionText: "(IQ) 100 spectators. 55 watched on 1st day, 65 on 2nd, 75 on 3rd. What is the maximum number of spectators who watched all the matches in all three days?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "45",
    options: []
  },
  {
    id: "q20",
    questionText: "(series) Complete sequence: 11, 13, 23, 53, 121, 251, ?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q21",
    questionText: "(PnC) What is the rank of the word 'ELBOW'?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  }
];

const MockTest = ({ questions = nsetQuestions }) => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const fullScreenRef = useRef(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes in seconds
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [testStarted, setTestStarted] = useState(false); // Add this state to track if test has started
  
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
        console.error("Error attempting to enable full-screen mode:", err);
        // If fullscreen fails, still allow the test to start
        setTestStarted(true);
        setIsFullScreen(true);
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
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableCopyPaste);
    
    // Watch for fullscreen change
    const fullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement;
      
      setIsFullScreen(!!fullscreenElement);
      
      // If fullscreen is exited but test has started, we want to keep showing the test
      if (!fullscreenElement && testStarted) {
        // Optional: You could add a warning here that fullscreen was exited
        console.log("Fullscreen exited, but test continues");
      }
    };
    
    document.addEventListener('fullscreenchange', fullscreenChange);
    document.addEventListener('mozfullscreenchange', fullscreenChange);
    document.addEventListener('webkitfullscreenchange', fullscreenChange);
    document.addEventListener('msfullscreenchange', fullscreenChange);
    
    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableCopyPaste);
      document.removeEventListener('fullscreenchange', fullscreenChange);
      document.removeEventListener('mozfullscreenchange', fullscreenChange);
      document.removeEventListener('webkitfullscreenchange', fullscreenChange);
      document.removeEventListener('msfullscreenchange', fullscreenChange);
      
      // Ensure fullscreen is exited when component unmounts
      if (isFullScreen) {
        exitFullScreen();
      }
    };
  }, [isFullScreen, testStarted]);

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
    
    // Navigate to results or show results modal
    navigate(`/test/${testId}/results`, { 
      state: { 
        answers: allAnswers,
        questions,
        timeSpent: 3600 - timeRemaining
      }
    });
    
    // Exit fullscreen when submitting
    if (isFullScreen) {
      exitFullScreen();
    }
  };
  
  // Force test to start even if fullscreen fails or is not supported
  const startTestAnyway = () => {
    setTestStarted(true);
    setIsFullScreen(true); // Pretend we're in fullscreen mode even if we're not
  };
  
  // If no questions are provided, show appropriate message
  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading questions...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div ref={fullScreenRef} className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fullscreen prompt if test not started */}
      {!testStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Start Test</h2>
            <p className="mb-6">This test must be taken in full-screen mode. Click the button below to start.</p>
            <div className="flex flex-col space-y-4">
              <button 
                onClick={enterFullScreen}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Enter Full Screen & Start Test
              </button>
              <button 
                onClick={startTestAnyway}
                className="px-6 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Start Without Full Screen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Test content shown when test has started */}
      {testStarted && (
        <>
          {/* Header with timer and submit button */}
          <header className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">NSET Free Sample Test</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={handleSubmitTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Test
              </button>
            </div>
          </header>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Question panel */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h2>
                    <button
                      onClick={() => handleMarkForReview(currentQuestion.id)}
                      className={`flex items-center text-sm font-medium ${
                        markedForReview.includes(currentQuestion.id)
                          ? 'text-yellow-600'
                          : 'text-gray-500 hover:text-yellow-600'
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
                    <p className="text-gray-900">{currentQuestion.questionText}</p>
                  </div>
                  
                  {currentQuestion.type === 'mcq' && currentQuestion.options.length > 0 ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[currentQuestion.id] === option.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'border-gray-200 hover:bg-gray-50'
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
                            <span className="block text-gray-900">{option.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Answer:
                        </label>
                        <input
                          type="text"
                          value={textAnswers[currentQuestion.id] || ''}
                          onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your answer here"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 flex items-center text-sm font-medium rounded-md ${
                      currentQuestionIndex === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
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
                        : 'text-gray-700 hover:bg-gray-200'
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
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Question Navigation</h3>
                
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium 
                        ${index === currentQuestionIndex ? 'ring-2 ring-offset-2 ring-blue-600 ' : ''}
                        ${
                          markedForReview.includes(question.id)
                            ? 'bg-yellow-100 text-yellow-800'
                            : answers[question.id] || textAnswers[question.id]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                    <span className="text-gray-600">Not Attempted</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                    <span className="text-gray-600">Attempted</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
                    <span className="text-gray-600">Marked for Review</span>
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
                    onClick={handleSubmitTest}
                    className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MockTest; 