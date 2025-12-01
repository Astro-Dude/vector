import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesSheet from '../../components/interview/RulesSheet';
import DeviceCheck from '../../components/interview/DeviceCheck';

type Step = 'rules' | 'device-check';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('rules');

  const handleRulesAccepted = () => {
    setCurrentStep('device-check');
  };

  const handleDeviceCheckComplete = () => {
    // Navigate to the actual interview session
    navigate('/interview/session');
  };

  const handleBack = () => {
    if (currentStep === 'device-check') {
      setCurrentStep('rules');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
