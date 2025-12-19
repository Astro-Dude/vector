import { useState, useRef, useEffect, useCallback } from 'react';

interface DeviceCheckProps {
  onComplete: () => void;
}

type CheckStatus = 'pending' | 'testing' | 'success' | 'error';

export default function DeviceCheck({ onComplete }: DeviceCheckProps) {
  const [headphoneConfirmed, setHeadphoneConfirmed] = useState(false);
  const [speakerStatus, setSpeakerStatus] = useState<CheckStatus>('pending');
  const [micStatus, setMicStatus] = useState<CheckStatus>('pending');
  const [fullscreenStatus, setFullscreenStatus] = useState<CheckStatus>('pending');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakerHeard, setSpeakerHeard] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const allChecksPassed = headphoneConfirmed &&
                          speakerStatus === 'success' &&
                          micStatus === 'success' &&
                          fullscreenStatus === 'success' &&
                          isFullscreen;

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setFullscreenStatus('success');
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
        setFullscreenStatus('error');
      }
    };

    enterFullscreen();

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen) {
        setShowFullscreenWarning(true);
        setFullscreenStatus('error');
      } else {
        setShowFullscreenWarning(false);
        setFullscreenStatus('success');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowFullscreenWarning(false);
      setFullscreenStatus('success');
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  // Test speaker with a beep and ask for confirmation
  const testSpeaker = useCallback(async () => {
    setSpeakerStatus('testing');
    setIsPlayingSound(true);
    setSpeakerHeard(null);

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play a distinctive pattern: 3 beeps
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();

      // Beep pattern
      const playBeep = (time: number) => {
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + time);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + time + 0.15);
      };

      playBeep(0);
      playBeep(0.3);
      playBeep(0.6);

      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        setIsPlayingSound(false);
      }, 1000);
    } catch {
      setIsPlayingSound(false);
      setSpeakerStatus('error');
    }
  }, []);

  const handleSpeakerResponse = (heard: boolean) => {
    setSpeakerHeard(heard);
    setSpeakerStatus(heard ? 'success' : 'error');
  };

  // Test microphone with real recording
  const testMicrophone = useCallback(async () => {
    setMicStatus('testing');
    setMicError(null);
    setIsRecording(true);
    setRecordedAudio(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(blob);
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();

      // Visualize audio level
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 100, 1);
        setAudioLevel(normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      // Record for 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
      }, 5000);

    } catch (err) {
      setMicStatus('error');
      setIsRecording(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setMicError('Microphone access denied. Please allow microphone access in your browser settings. Note: Only Google Chrome is supported.');
        } else if (err.name === 'NotFoundError') {
          setMicError('No microphone found. Please connect a microphone and try again.');
        } else {
          setMicError('Failed to access microphone. This feature only works in Google Chrome. Please check your device settings.');
        }
      }
    }
  }, []);

  // Play back the recorded audio
  const playRecording = useCallback(() => {
    if (!recordedAudio) return;

    setIsPlayingRecording(true);
    const audioUrl = URL.createObjectURL(recordedAudio);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setIsPlayingRecording(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play();
  }, [recordedAudio]);

  const handleMicResponse = (heard: boolean) => {
    setMicStatus(heard ? 'success' : 'error');
    if (!heard) {
      setMicError('Recording playback not clear. Please try again.');
    }
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-white/30" />
        );
      case 'testing':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        );
      case 'success':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Device Check</h2>
        <p className="text-white/60 text-sm md:text-base">Complete all checks before starting the interview</p>
      </div>

      {/* Chrome Requirement Notice */}
      <div className="mb-4 md:mb-6 bg-red-500/15 border-2 border-red-500/40 rounded-xl p-4 flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-300 text-sm font-medium">
          This interview only works in Google Chrome. Other browsers are not supported.
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Fullscreen Status */}
        <div className={`bg-white/5 border rounded-xl p-4 md:p-6 ${isFullscreen ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${isFullscreen ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <svg className={`w-6 h-6 ${isFullscreen ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-base md:text-lg">Fullscreen Mode</h3>
                {getStatusIcon(fullscreenStatus)}
              </div>
              <p className={`text-sm ${isFullscreen ? 'text-green-400' : 'text-red-400'}`}>
                {isFullscreen ? 'You are in fullscreen mode. Stay in fullscreen throughout the interview.' : 'Please return to fullscreen mode to continue.'}
              </p>
            </div>
          </div>
        </div>

        {/* Headphone Confirmation */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-base md:text-lg">Headphones Required</h3>
                {headphoneConfirmed ? getStatusIcon('success') : getStatusIcon('pending')}
              </div>
              <p className="text-white/60 text-sm mb-4">
                Please connect and wear your headphones. This is required to avoid audio feedback and ensure clear recording.
              </p>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={headphoneConfirmed}
                    onChange={(e) => setHeadphoneConfirmed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    headphoneConfirmed
                      ? 'bg-green-500 border-green-500'
                      : 'border-white/30 group-hover:border-white/50'
                  }`}>
                    {headphoneConfirmed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-white/80 text-sm">I confirm that I am wearing headphones</span>
              </label>
            </div>
          </div>
        </div>

        {/* Speaker Test */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-base md:text-lg">Speaker Test</h3>
                {getStatusIcon(speakerStatus)}
              </div>
              <p className="text-white/60 text-sm mb-4">
                Click to play a test sound. You should hear 3 beeps through your headphones.
              </p>

              <button
                onClick={testSpeaker}
                disabled={isPlayingSound}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isPlayingSound
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : speakerStatus === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isPlayingSound ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Playing...
                  </span>
                ) : speakerStatus === 'success' ? 'Play Again' : 'Play Test Sound'}
              </button>

              {!isPlayingSound && speakerStatus === 'testing' && speakerHeard === null && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white text-sm mb-3">Did you hear 3 beeps in your headphones?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSpeakerResponse(true)}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all"
                    >
                      Yes, I heard them
                    </button>
                    <button
                      onClick={() => handleSpeakerResponse(false)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
                    >
                      No, I didn't
                    </button>
                  </div>
                </div>
              )}

              {speakerStatus === 'success' && (
                <p className="text-green-400 text-xs mt-2">Speaker working correctly!</p>
              )}
              {speakerStatus === 'error' && (
                <p className="text-red-400 text-xs mt-2">Please check your headphones are connected properly and try again.</p>
              )}
            </div>
          </div>
        </div>

        {/* Microphone Test */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-base md:text-lg">Microphone Test</h3>
                {getStatusIcon(micStatus)}
              </div>
              <p className="text-white/60 text-sm mb-4">
                Record a 5-second clip and play it back to verify your microphone is working.
              </p>

              {/* Audio Level Meter */}
              {isRecording && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-sm font-medium">Recording... Speak now!</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(audioLevel * 100, 5)}%` }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-2">Recording for 5 seconds...</p>
                </div>
              )}

              {micError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{micError}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testMicrophone}
                  disabled={isRecording}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                      : micStatus === 'success'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isRecording ? 'Recording...' : micStatus === 'success' ? 'Record Again' : 'Start Recording'}
                </button>

                {recordedAudio && !isRecording && (
                  <button
                    onClick={playRecording}
                    disabled={isPlayingRecording}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200"
                  >
                    {isPlayingRecording ? 'Playing...' : 'Play Recording'}
                  </button>
                )}
              </div>

              {recordedAudio && !isRecording && micStatus === 'testing' && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white text-sm mb-3">Could you hear yourself clearly in the playback?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMicResponse(true)}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all"
                    >
                      Yes, clearly
                    </button>
                    <button
                      onClick={() => handleMicResponse(false)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
                    >
                      No, try again
                    </button>
                  </div>
                </div>
              )}

              {micStatus === 'success' && (
                <p className="text-green-400 text-xs mt-2">Microphone working correctly!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onComplete}
        disabled={!allChecksPassed}
        className={`w-full mt-6 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
          allChecksPassed
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {allChecksPassed ? 'Start Interview' : 'Complete All Checks to Continue'}
      </button>

      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fullscreen Required</h3>
              <p className="text-white/60 mb-6">
                You must stay in fullscreen mode during the device check and interview. Please return to fullscreen to continue.
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
    </div>
  );
}
