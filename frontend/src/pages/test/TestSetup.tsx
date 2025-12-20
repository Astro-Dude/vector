import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface TestInfo {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questionCount: number;
  totalQuestions: number;
}

interface TestSetupData {
  canStartTest: boolean;
  test?: TestInfo;
  attempts?: number; // Number of previous attempts (unlimited)
  error?: string;
  message?: string;
}

const rules = [
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Stay in Fullscreen',
    description: 'Do not exit fullscreen mode during the test. Exiting may affect your results.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Time Limit',
    description: 'Complete all questions within the time limit. The timer starts when you begin.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: 'No External Help',
    description: 'Do not use calculators, notes, or any external resources during the test.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Submit Before Time Ends',
    description: 'Make sure to submit all your answers before the timer runs out.'
  }
];

export default function TestSetup() {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const [setupData, setSetupData] = useState<TestSetupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTestSetup();
    }
  }, [testId]);

  const fetchTestSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test/setup/${testId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setSetupData({
          canStartTest: false,
          error: data.error || data.message
        });
      } else {
        setSetupData(data);
      }
    } catch (err) {
      setError('Failed to load test information');
      console.error('Error fetching test setup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!accepted || !setupData?.canStartTest) return;

    setStarting(true);
    try {
      // Enter fullscreen first
      await document.documentElement.requestFullscreen();

      // Navigate to test session
      navigate(`/test/session/${testId}`, { state: { fromSetup: true } });
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      // Still navigate even if fullscreen fails
      navigate(`/test/session/${testId}`, { state: { fromSetup: true } });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading test information...</p>
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

  // No credits or cannot start test
  if (setupData && !setupData.canStartTest) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Cannot Start Test</h3>
          <p className="text-white/60 mb-4">{setupData.error || 'You need to purchase this test to continue.'}</p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
            >
              Purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Attempts Banner */}
          {setupData?.attempts !== undefined && setupData.attempts > 0 && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Previous Attempts: {setupData.attempts}</p>
                <p className="text-white/60 text-sm">You can retake this test unlimited times</p>
              </div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm md:text-base">Back to Home</span>
          </button>

          {/* Test Info Header */}
          {setupData?.test && (
            <div className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{setupData.test.title}</h1>
              <p className="text-white/60 text-sm md:text-base mb-4">{setupData.test.description}</p>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/60">{setupData.test.timeLimit} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-white/60">{setupData.test.questionCount} questions</span>
                </div>
              </div>
            </div>
          )}

          {/* Rules Section */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Test Rules</h2>
              <p className="text-white/60 text-sm md:text-base">Please read and acknowledge the following rules before starting</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6">
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex gap-3 md:gap-4 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
                  >
                    <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-lg flex items-center justify-center text-white/80">
                      {rule.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm md:text-base mb-1">{rule.title}</h3>
                      <p className="text-white/60 text-xs md:text-sm leading-relaxed">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    accepted
                      ? 'bg-green-500 border-green-500'
                      : 'border-white/30 group-hover:border-white/50'
                  }`}>
                    {accepted && (
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-white/80 text-sm md:text-base leading-relaxed">
                  I have read and understood all the rules. I agree to follow them during the test and understand that violations may affect my results.
                </span>
              </label>
            </div>

            <button
              onClick={handleStartTest}
              disabled={!accepted || starting}
              className={`w-full mt-6 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                accepted && !starting
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {starting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Starting Test...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
