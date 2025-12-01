import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesSheet from '../../components/interview/RulesSheet';
import DeviceCheck from '../../components/interview/DeviceCheck';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type Step = 'rules' | 'device-check';

interface InterviewBalance {
  canStartInterview: boolean;
  interviewsPurchased: number;
  interviewsUsed: number;
  interviewsRemaining: number;
  message?: string;
  error?: string;
}

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('rules');
  const [balance, setBalance] = useState<InterviewBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check interview balance on mount
  useEffect(() => {
    checkInterviewBalance();
  }, []);

  const checkInterviewBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/interview/setup`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setBalance({
          canStartInterview: false,
          interviewsPurchased: data.interviewsPurchased || 0,
          interviewsUsed: data.interviewsUsed || 0,
          interviewsRemaining: data.interviewsRemaining || 0,
          error: data.error || data.message
        });
      } else {
        setBalance(data);
      }
    } catch (err) {
      setError('Failed to check interview availability');
      console.error('Error checking interview balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRulesAccepted = () => {
    setCurrentStep('device-check');
  };

  const handleDeviceCheckComplete = () => {
    // Navigate to the actual interview session with state to indicate coming from setup
    navigate('/interview/session', { state: { fromSetup: true } });
  };

  const handleBack = () => {
    if (currentStep === 'device-check') {
      setCurrentStep('rules');
    } else {
      navigate('/home');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking interview availability...</p>
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

  // No credits available
  if (balance && !balance.canStartInterview) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Interview Credits</h3>
          <p className="text-white/60 mb-4">{balance.error || 'You need to purchase an AI Interview to continue.'}</p>

          {balance.interviewsPurchased > 0 && (
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Purchased</span>
                <span className="text-white">{balance.interviewsPurchased}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Used</span>
                <span className="text-white">{balance.interviewsUsed}</span>
              </div>
            </div>
          )}

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
          {/* Credits Banner */}
          {balance && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Interview Credits Available</p>
                  <p className="text-white/60 text-sm">{balance.interviewsRemaining} of {balance.interviewsPurchased} remaining</p>
                </div>
              </div>
            </div>
          )}

          {/* Back Button - only show on rules step */}
          {currentStep === 'rules' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm md:text-base">Back to Home</span>
            </button>
          )}

          {/* Progress Indicator */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base transition-all duration-300 ${
                  currentStep === 'rules'
                    ? 'bg-white text-black'
                    : 'bg-green-500 text-white'
                }`}>
                  {currentStep === 'rules' ? '1' : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${
                  currentStep === 'rules' ? 'text-white' : 'text-green-400'
                }`}>
                  Rules
                </span>
              </div>

              {/* Connector */}
              <div className={`w-12 md:w-24 h-0.5 transition-colors duration-300 ${
                currentStep === 'device-check' ? 'bg-green-500' : 'bg-white/20'
              }`} />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base transition-all duration-300 ${
                  currentStep === 'device-check'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/40'
                }`}>
                  2
                </div>
                <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${
                  currentStep === 'device-check' ? 'text-white' : 'text-white/40'
                }`}>
                  Device Check
                </span>
              </div>

              {/* Connector */}
              <div className="w-12 md:w-24 h-0.5 bg-white/20" />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center font-semibold text-sm md:text-base text-white/40">
                  3
                </div>
                <span className="text-sm md:text-base font-medium text-white/40">
                  Interview
                </span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="animate-fadeIn">
            {currentStep === 'rules' && (
              <RulesSheet onAccept={handleRulesAccepted} />
            )}
            {currentStep === 'device-check' && (
              <DeviceCheck onComplete={handleDeviceCheckComplete} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
