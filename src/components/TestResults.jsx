import { useLocation, useNavigate } from 'react-router-dom';

const TestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract data from location state (should be passed from test page)
  const { answers = {}, questions = [], timeSpent = 0, endedDueToFullScreenViolation = false } = location.state || {};
  
  // Calculate results
  const totalQuestions = questions.length;
  const attemptedQuestions = Object.keys(answers).length;
  
  // Check correct answers based on question type
  const correctAnswers = questions.filter(question => {
    const userAnswer = answers[question.id];
    
    if (!userAnswer) return false;
    
    if (question.type === 'mcq') {
      return userAnswer === question.correctOptionId;
    } else {
      // For text answers, do a case-insensitive comparison
      const correctAnswer = question.correctAnswer || '';
      if (!correctAnswer) return false;
      
      return userAnswer.toString().toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
  }).length;
  
  // Calculate score as percentage
  const scorePercentage = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
    
  // Format time spent
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };
  
  // Performance feedback based on score
  const getFeedback = () => {
    if (endedDueToFullScreenViolation) {
      return {
        title: "Test Terminated",
        message: "Your test was automatically terminated because you exited full-screen mode for more than 45 seconds. Full-screen mode is required for test integrity.",
        color: "text-red-600"
      };
    }
    
    if (scorePercentage >= 80) {
      return {
        title: "Excellent Performance!",
        message: "You're well-prepared for the NSET exam. Keep up the great work!",
        color: "text-green-600"
      };
    } else if (scorePercentage >= 60) {
      return {
        title: "Good Performance!",
        message: "You have a solid foundation. Some targeted practice will make you fully ready for NSET.",
        color: "text-blue-600"
      };
    } else if (scorePercentage >= 40) {
      return {
        title: "Average Performance",
        message: "You're on the right track, but need more practice in key areas to excel in NSET.",
        color: "text-yellow-600"
      };
    } else {
      return {
        title: "Needs Improvement",
        message: "Don't worry! With structured practice and our resources, you can significantly improve your NSET readiness.",
        color: "text-red-600"
      };
    }
  };
  
  // Calculate performance by category
  const getCategoryPerformance = () => {
    const categories = [...new Set(questions.map(q => q.category))];
    
    return categories.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const categoryCorrect = categoryQuestions.filter(question => {
        const userAnswer = answers[question.id];
        if (!userAnswer) return false;
        
        if (question.type === 'mcq') {
          return userAnswer === question.correctOptionId;
        } else {
          const correctAnswer = question.correctAnswer || '';
          if (!correctAnswer) return false;
          
          return userAnswer.toString().toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        }
      }).length;
      
      const percentage = categoryQuestions.length > 0 
        ? Math.round((categoryCorrect / categoryQuestions.length) * 100) 
        : 0;
      
      return {
        name: category,
        percentage
      };
    });
  };
  
  const feedback = getFeedback();
  const categoryPerformance = getCategoryPerformance();
  
  const handleRetakeTest = () => {
    // Navigate back to test start page
    navigate('/test/sample/start');
  };
  
  const handleViewSolutions = () => {
    // Navigate to solutions page
    navigate('/test/sample/solutions', { state: { answers, questions } });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header with score */}
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Results</h1>
            <p className="text-gray-600">NSET Free Sample Test</p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between">
              <div className="relative w-48 h-48 mb-6 sm:mb-0">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={scorePercentage >= 80 ? "#10B981" : scorePercentage >= 60 ? "#3B82F6" : scorePercentage >= 40 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="3"
                    strokeDasharray={`${scorePercentage}, 100`}
                  />
                  <text x="18" y="20.5" className="text-5xl font-bold" textAnchor="middle" fill="#374151">
                    {scorePercentage}%
                  </text>
                </svg>
              </div>
              
              <div className="text-center sm:text-left">
                <h2 className={`text-2xl font-bold ${feedback.color} mb-2`}>{feedback.title}</h2>
                <p className="text-gray-600 max-w-md">{feedback.message}</p>
              </div>
            </div>
          </div>
          
          {/* Test statistics */}
          <div className="p-6 sm:p-8 bg-gray-50 overflow-y-auto max-h-[calc(100vh-400px)]">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Statistics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Attempted</p>
                <p className="text-2xl font-bold text-gray-900">{attemptedQuestions}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(timeSpent)}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Performance by Topic</h3>
                
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {categoryPerformance.map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm font-medium text-gray-700">{category.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-3">Recommendations</h3>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Focus on improving your {getCategoryWithLowestScore()} with our targeted practice questions.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Review the questions you got wrong to understand your weak areas.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Schedule a mentorship session to get personalized guidance on your preparation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-6 sm:p-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleRetakeTest}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              Retake Test
            </button>
            <button
              onClick={handleViewSolutions}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 border border-transparent rounded-md text-white font-medium hover:bg-blue-700"
            >
              View Solutions
            </button>
            <a
              href="#register"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 border border-transparent rounded-md text-white font-medium hover:from-indigo-700 hover:to-blue-700"
            >
              Explore Full Test Series
            </a>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper function to get the category with the lowest score
  function getCategoryWithLowestScore() {
    if (categoryPerformance.length === 0) return "skills";
    
    let lowestCategory = categoryPerformance[0];
    
    for (const category of categoryPerformance) {
      if (category.percentage < lowestCategory.percentage) {
        lowestCategory = category;
      }
    }
    
    return lowestCategory.name;
  }
};

export default TestResults; 