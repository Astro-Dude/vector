import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Check if device is mobile or tablet
function isMobileOrTablet(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile/tablet keywords in user agent
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry',
    'windows phone', 'opera mini', 'mobile', 'tablet'
  ];

  const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Also check screen size as a fallback (tablets and phones typically < 1024px width)
  const isSmallScreen = window.innerWidth < 1024;

  // Check for touch-only device (no mouse)
  const isTouchOnly = 'ontouchstart' in window && navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;

  return hasMobileKeyword || (isSmallScreen && isTouchOnly);
}

interface Question {
  index: number;
  questionId: string;
  question: string;
  type: 'mcq' | 'short';
  options: string[];
  note?: string;
  score: number;
}

interface TestSessionData {
  sessionId: string;
  testId: string;
  testTitle: string;
  totalQuestions: number;
  timeLimit: number;
  questions: Question[];
}

export default function TestSession() {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();

  // Session state
  const [sessionData, setSessionData] = useState<TestSessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number | string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [, setIsFullscreen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if user came from setup page and verify eligibility
  useEffect(() => {
    const fromSetup = location.state?.fromSetup === true;

    if (!fromSetup) {
      setUnauthorized(true);
      setIsLoading(false);
      return;
    }

    verifyAndStartTest();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [location.state]);

  const verifyAndStartTest = async () => {
    try {
      setIsLoading(true);
      // Call setup API to verify purchase/eligibility
      const setupResponse = await fetch(`${API_BASE_URL}/api/test/setup/${testId}`, {
        credentials: 'include'
      });
      const setupData = await setupResponse.json();

      if (!setupResponse.ok || !setupData.canStartTest) {
        setError(setupData.error || 'Cannot start test. Please purchase the test first.');
        return;
      }

      // If verified, proceed to start the test
      await startTest();
    } catch (err) {
      setError('Failed to verify test eligibility');
      setIsLoading(false);
    }
  };

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !showSubmitConfirm) {
        setShowExitWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showSubmitConfirm]);

  // Timer countdown
  useEffect(() => {
    if (sessionData && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmitTest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [sessionData]);

  const startTest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test/session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start test');
      }

      const data = await response.json();
      setSessionData(data);
      setTimeRemaining(data.timeLimit * 60); // Convert to seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = useCallback((questionId: string, answer: number | string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!sessionData) return;

    setIsSubmitting(true);
    setShowSubmitConfirm(false);

    try {
      // Convert answers map to object
      const answersObject: Record<string, number | string> = {};
      answers.forEach((value, key) => {
        answersObject[key] = value;
      });

      const response = await fetch(`${API_BASE_URL}/api/test/session/${sessionData.sessionId}/end`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersObject })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit test');
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      // Navigate to results
      navigate(`/test/result/${sessionData.sessionId}`, {
        state: { autoSubmit }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setIsSubmitting(false);
    }
  };

  const handleReenterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowExitWarning(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = (): number => {
    return answers.size;
  };

  // Block mobile and tablet devices
  if (isMobileOrTablet()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Desktop Required</h3>
          <p className="text-white/60 mb-6">
            Tests can only be taken on a laptop or desktop computer. Please switch to a larger device to continue.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Unauthorized access
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-white/60 mb-6">Please start the test from the setup page.</p>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Starting test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) return null;

  const currentQuestion = sessionData.questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion.questionId);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Bar */}
      <div className="bg-zinc-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeRemaining <= 300 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
          </div>

          {/* Question Counter */}
          <div className="text-white/60 text-sm">
            Question {currentIndex + 1} of {sessionData.totalQuestions}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="text-white/60 text-sm">
            {getAnsweredCount()} / {sessionData.totalQuestions} answered
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Test
          </button>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-zinc-900/50 border-b border-white/10 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {sessionData.questions.map((q, idx) => {
            const isAnswered = answers.has(q.questionId);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.questionId}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                  isCurrent
                    ? 'bg-white text-black'
                    : isAnswered
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-xs font-medium">
                {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
              </span>
              <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-xs font-medium">
                {currentQuestion.score} {currentQuestion.score === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
            {currentQuestion.note && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <span className="font-medium">Note:</span> {currentQuestion.note}
                </p>
              </div>
            )}
          </div>

          {/* Answer Input */}
          {currentQuestion.type === 'mcq' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerChange(currentQuestion.questionId, idx)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                    currentAnswer === idx
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    currentAnswer === idx
                      ? 'border-green-500 bg-green-500'
                      : 'border-white/30'
                  }`}>
                    {currentAnswer === idx ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-white/60 text-sm font-semibold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    )}
                  </div>
                  <span className="text-base">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={currentAnswer as string || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200"
              />
              <p className="mt-2 text-white/40 text-sm">
                Enter your answer exactly as required (numbers, text, etc.)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-zinc-900 border-t border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              currentIndex === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(sessionData.totalQuestions - 1, prev + 1))}
            disabled={currentIndex === sessionData.totalQuestions - 1}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              currentIndex === sessionData.totalQuestions - 1
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Submit Test?</h3>
            <p className="text-white/60 mb-4">
              You have answered {getAnsweredCount()} of {sessionData.totalQuestions} questions.
            </p>
            {getAnsweredCount() < sessionData.totalQuestions && (
              <p className="text-yellow-400/80 text-sm mb-4">
                Warning: You have {sessionData.totalQuestions - getAnsweredCount()} unanswered questions.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmitTest()}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Warning */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Fullscreen Required</h3>
            <p className="text-white/60 text-center mb-6">
              Please stay in fullscreen mode during the test. Exiting fullscreen may affect your results.
            </p>
            <button
              onClick={handleReenterFullscreen}
              className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
