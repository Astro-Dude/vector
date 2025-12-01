import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InterviewSession() {
  const navigate = useNavigate();
  const [, setIsFullscreen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Use ref to track muted state in animation frame callback (avoids stale closure)
  const isMicMutedRef = useRef(isMicMuted);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false); // Control this state to trigger AI speaking animation

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    };

    enterFullscreen();
    startTimer();

    return () => {
      cleanup();
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !showEndConfirm) {
        setShowExitWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showEndConfirm]);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;
      setIsMicOn(true);

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 100, 1);
        // Use ref to get current muted state (avoids stale closure)
        setAudioLevel(isMicMutedRef.current ? 0 : normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (err) {
      console.error('Failed to access microphone:', err);
      setIsMicOn(false);
    }
  };

  const toggleMute = useCallback(async () => {
    // If mic is not started yet, start it first
    if (!micStreamRef.current) {
      await startMicrophone();
      setIsMicMuted(false);
      return;
    }

    // Toggle existing mic
    const audioTrack = micStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = isMicMuted;
      setIsMicMuted(!isMicMuted);
    }
  }, [isMicMuted]);

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowExitWarning(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  const handleEndInterview = () => {
    setShowEndConfirm(true);
  };

  const confirmEndInterview = async () => {
    cleanup();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    navigate('/home');
  };

  const cancelEndInterview = () => {
    setShowEndConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-white/5 border-b border-white/10">
        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isMicOn && !isMicMuted ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`} />
            <span className="text-white font-mono text-sm md:text-base">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Center - Interview Title */}
        <div className="hidden md:block">
          <h1 className="text-white font-semibold">Mock Interview</h1>
        </div>

        {/* End Call Button */}
        <button
          onClick={handleEndInterview}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          <span className="hidden sm:inline">End</span>
        </button>
      </div>

      {/* Main Content Area - AI Speaking Visualization */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="relative flex items-center justify-center">
          {/* Outer glow rings - animate when AI is speaking */}
          <div className={`absolute w-80 h-80 md:w-96 md:h-96 rounded-full transition-all duration-1000 ${
            isAiSpeaking
              ? 'bg-blue-500/5 animate-pulse'
              : 'bg-white/5'
          }`} />

          <div className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full transition-all duration-700 ${
            isAiSpeaking
              ? 'bg-blue-500/10'
              : 'bg-white/5'
          }`} style={{
            animation: isAiSpeaking ? 'pulse-ring 2s ease-in-out infinite' : 'none'
          }} />

          <div className={`absolute w-48 h-48 md:w-64 md:h-64 rounded-full transition-all duration-500 ${
            isAiSpeaking
              ? 'bg-blue-500/15'
              : 'bg-white/5'
          }`} style={{
            animation: isAiSpeaking ? 'pulse-ring 2s ease-in-out infinite 0.3s' : 'none'
          }} />

          {/* Middle animated ring */}
          <div className={`absolute w-40 h-40 md:w-52 md:h-52 rounded-full border-2 transition-all duration-300 ${
            isAiSpeaking
              ? 'border-blue-400/50'
              : 'border-white/10'
          }`} style={{
            animation: isAiSpeaking ? 'spin-slow 8s linear infinite' : 'none'
          }}>
            {/* Orbiting dot */}
            <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-300 ${
              isAiSpeaking ? 'bg-blue-400' : 'bg-white/20'
            }`} />
          </div>

          {/* Inner core circle */}
          <div className={`relative w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center transition-all duration-300 ${
            isAiSpeaking
              ? 'bg-linear-to-br from-blue-600 to-blue-800 shadow-[0_0_60px_rgba(59,130,246,0.5)]'
              : 'bg-linear-to-br from-zinc-700 to-zinc-900 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
          }`}>
            {/* Inner glow */}
            <div className={`absolute inset-2 rounded-full transition-all duration-300 ${
              isAiSpeaking
                ? 'bg-linear-to-br from-blue-400/20 to-transparent'
                : 'bg-linear-to-br from-white/10 to-transparent'
            }`} />

            {/* AI Icon or waveform */}
            <div className="relative z-10">
              {isAiSpeaking ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 md:w-1.5 bg-white rounded-full"
                      style={{
                        height: `${20 + Math.random() * 20}px`,
                        animation: `sound-wave 0.5s ease-in-out infinite ${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <svg className="w-12 h-12 md:w-16 md:h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="absolute -bottom-16 md:-bottom-20 left-1/2 -translate-x-1/2 text-center">
            <p className={`text-lg md:text-xl font-medium transition-colors duration-300 ${
              isAiSpeaking ? 'text-blue-400' : 'text-white/60'
            }`}>
              {isAiSpeaking ? 'AI is speaking...' : 'Listening...'}
            </p>
            <p className="text-white/40 text-sm mt-1">
              {isAiSpeaking ? 'Please wait for the question' : 'Your turn to respond'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="px-4 md:px-6 py-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          {/* Mic Button with Audio Reactive Animation */}
          <div className="relative">
            {/* Outer pulse rings - react to audio level */}
            {!isMicMuted && isMicOn && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-blue-500/30 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.8})`,
                    opacity: audioLevel > 0.05 ? 0.4 : 0
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-blue-400/20 transition-transform duration-100"
                  style={{
                    transform: `scale(${1 + audioLevel * 1.2})`,
                    opacity: audioLevel > 0.1 ? 0.3 : 0
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-blue-300/10 transition-transform duration-150"
                  style={{
                    transform: `scale(${1 + audioLevel * 1.6})`,
                    opacity: audioLevel > 0.15 ? 0.2 : 0
                  }}
                />
              </>
            )}

            <button
              onClick={toggleMute}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isMicMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              style={{
                boxShadow: !isMicMuted && audioLevel > 0.1
                  ? `0 0 ${20 + audioLevel * 30}px rgba(59, 130, 246, ${0.3 + audioLevel * 0.4})`
                  : 'none'
              }}
            >
              {isMicMuted ? (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mic status text */}
        <div className="text-center mt-2">
          <span className={`text-xs ${isMicMuted ? 'text-red-400' : 'text-white/40'}`}>
            {isMicMuted ? 'Microphone muted' : 'Microphone active'}
          </span>
        </div>
      </div>

      {/* Fullscreen Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fullscreen Required</h3>
              <p className="text-white/60 mb-6">
                You've exited fullscreen mode. The interview must be conducted in fullscreen for integrity purposes.
              </p>
              <button
                onClick={returnToFullscreen}
                className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Interview Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">End Interview?</h3>
              <p className="text-white/60 mb-6">
                Are you sure you want to end the interview? Your progress will be saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelEndInterview}
                  className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndInterview}
                  className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-semibold transition-all duration-200"
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sound-wave {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}
