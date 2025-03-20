import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MockTestStart = ({ 
  testId = "nset", 
  testName = "NSET Free Sample Test", 
  duration = 120, 
  questions = 21,
  testComponents = [
    {
      name: "Quantitative Aptitude",
      description: "Probability & statistics, permutation & combination, number theory, ratios & percentages, exponentials & logarithms, sets (venn diagrams).",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800"
    },
    {
      name: "Logical Reasoning",
      description: "Direction sense, coding-decoding, clocks & calendars, series, blood Relations, & family Tree, syllogism, simple and compound interest, puzzles, seating arrangements.",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-800"
    }
  ],
  fullScreenRequired = true,
  fullScreenTimeout = 45,
  redirectTo = '/test/' // Base path for the test
}) => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  
  const handleStartTest = () => {
    if (agreed) {
      // Navigate to the actual test page with the testId
      navigate(`${redirectTo}${testId}/questions`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with test name */}
        <div className="bg-white shadow-md rounded-t-lg p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{testName}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{duration} minutes</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{questions} questions</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Test instructions */}
        <div className="bg-white shadow-md p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">1</div>
              <p>The test consists of {questions} questions to be completed in {duration} minutes.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">2</div>
              <p>For each question, you need to type your answer in the provided text field. Make sure to format your answer correctly.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">3</div>
              <p><strong>Important:</strong> Make sure your answers don't have any extra spaces before or after the text. Answers with leading or trailing spaces may be marked as incorrect.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">4</div>
              <p>You can use the navigation panel to jump to any question. Unattempted questions will be marked in gray, attempted in green.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">5</div>
              <p>You can mark questions for review and come back to them later.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">6</div>
              <p>The test will automatically submit when the time is up. You can also submit manually before time expires.</p>
            </div>
            {fullScreenRequired && (
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">7</div>
                <p><strong>Important:</strong> The test must be taken in full-screen mode. The test will automatically end if you exit full-screen mode for more than {fullScreenTimeout} seconds. Right-clicking and copy-pasting are disabled during the test.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Test components and syllabus */}
        {testComponents && testComponents.length > 0 && (
          <div className="bg-white shadow-md p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testComponents.map((component, index) => (
                <div key={index} className={`border rounded-lg p-4 ${component.bgColor || 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-medium ${component.textColor || 'text-gray-800'} mb-2`}>{component.name}</h3>
                  <p className="text-gray-600">{component.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Checkpoint and start button */}
        <div className="bg-white shadow-md rounded-b-lg p-6">
          <div className="flex items-start mb-6">
            <div className="flex items-center h-5">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agree" className="font-medium text-gray-700">
                I have read and understood the instructions
              </label>
              <p className="text-gray-500">
                You must agree to start the test. Once started, the timer cannot be paused.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleStartTest}
              disabled={!agreed}
              className={`px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 flex items-center ${!agreed ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
            >
              Start Test
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTestStart; 