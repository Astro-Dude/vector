import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 20; // Update every 20ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              onLoadingComplete();
            }, 1000); // Wait for fade animation to complete
          }, 300);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div className={`fixed inset-0 z-9999 bg-black flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-80 space-y-4">
        {/* Loading Bar Container */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          {/* Progress Bar with Glow Effect */}
          <div
            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-200 ease-out shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.4)]"
            style={{ width: `${progress}%` }}
          >
            {/* Moving Light Effect */}
            <div className="absolute right-0 top-0 h-full w-20 bg-linear-to-r from-transparent via-white to-transparent opacity-50 blur-sm animate-pulse" />
          </div>
        </div>
        
        {/* Optional: Progress Percentage */}
        <div className="text-center text-white/60 text-sm font-light">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
