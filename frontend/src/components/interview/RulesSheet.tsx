import { useState } from 'react';

interface RulesSheetProps {
  onAccept: () => void;
}

const rules = [
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Stay in Fullscreen',
    description: 'Do not exit fullscreen mode during the interview. Exiting will be flagged.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    title: 'Keep Microphone Enabled',
    description: 'Your microphone must remain on throughout the interview for recording your responses.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Interview Duration',
    description: 'The interview is 30 minutes long. Complete all questions within this time.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: 'No External Help',
    description: 'Do not use any external resources, notes, or assistance during the interview.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: 'Quiet Environment',
    description: 'Ensure you are in a quiet environment with minimal background noise.'
  },
  {
    icon: (
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    title: 'Use Headphones',
    description: 'Headphones are required for the best audio experience and to avoid echo.'
  }
];

export default function RulesSheet({ onAccept }: RulesSheetProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Interview Rules</h2>
        <p className="text-white/60 text-sm md:text-base">Please read and acknowledge the following rules before proceeding</p>
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
            I have read and understood all the rules. I agree to follow them during the interview and understand that violations may affect my interview results.
          </span>
        </label>
      </div>

      <button
        onClick={onAccept}
        disabled={!accepted}
        className={`w-full mt-6 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
          accepted
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        Continue to Device Check
      </button>
    </div>
  );
}
