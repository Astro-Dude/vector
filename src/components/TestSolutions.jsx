import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TestSolutions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { answers = {}, questions = [] } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  const handleReturnToResults = () => {
    navigate(-1);
  };

  // If no questions are provided, show a message
  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No questions to display</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = answers[currentQuestion.id];
  const isCorrect = currentQuestion.type === 'mcq' 
    ? userAnswer === currentQuestion.correctOptionId 
    : userAnswer?.toString().toLowerCase().trim() === (currentQuestion.correctAnswer || '').toLowerCase().trim();

  // Find the selected option text for MCQ questions
  const selectedOptionText = currentQuestion.type === 'mcq' && userAnswer
    ? currentQuestion.options.find(option => option.id === userAnswer)?.text
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Solutions</h1>
              <button
                onClick={handleReturnToResults}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Return to Results
              </button>
            </div>
            <p className="text-gray-600">
              NSET Free Sample Test - Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{currentQuestion.questionText}</h2>
              
              {currentQuestion.type === 'mcq' && currentQuestion.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 border rounded-lg ${
                        option.id === currentQuestion.correctOptionId
                          ? 'bg-green-50 border-green-200'
                          : option.id === userAnswer && option.id !== currentQuestion.correctOptionId
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        {option.id === currentQuestion.correctOptionId && (
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {option.id === userAnswer && option.id !== currentQuestion.correctOptionId && (
                          <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={`block ${
                          option.id === currentQuestion.correctOptionId
                            ? 'text-green-800 font-medium'
                            : option.id === userAnswer && option.id !== currentQuestion.correctOptionId
                            ? 'text-red-800 font-medium'
                            : 'text-gray-700'
                        }`}>
                          {option.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 border rounded-lg ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                    <div className="flex items-start">
                      {isCorrect ? (
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`block ${isCorrect ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}`}>
                        {userAnswer || '(No answer provided)'}
                      </span>
                    </div>
                  </div>
                  
                  {!isCorrect && currentQuestion.correctAnswer && (
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</p>
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="block text-green-800 font-medium">
                          {currentQuestion.correctAnswer}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {currentQuestion.explanation && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Explanation</h3>
                <div className="text-blue-700 prose prose-sm max-w-none">
                  {currentQuestion.explanation.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between">
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
              
              <div className="max-h-36 overflow-y-auto">
                <div className="flex py-2 flex-wrap gap-2 justify-center">
                  {questions.map((question, index) => {
                    const userAns = answers[question.id];
                    const isCorrectAns = question.type === 'mcq' 
                      ? userAns === question.correctOptionId 
                      : userAns?.toString().toLowerCase().trim() === (question.correctAnswer || '').toLowerCase().trim();
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => handleJumpToQuestion(index)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium 
                          ${index === currentQuestionIndex ? 'ring-2 ring-offset-2 ring-blue-600 ' : ''}
                          ${
                            !userAns
                              ? 'bg-gray-100 text-gray-800'
                              : isCorrectAns
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSolutions; 