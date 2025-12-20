import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Check if browser is Google Chrome only (not Edge, Brave, Opera, etc.)
function isGoogleChrome(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();

  // Must have "chrome" in user agent
  const hasChrome = userAgent.includes('chrome');
  if (!hasChrome) return false;

  // Detect other Chromium-based browsers
  const isEdge = userAgent.includes('edg');
  const isOpera = userAgent.includes('opr') || userAgent.includes('opera');
  const isVivaldi = userAgent.includes('vivaldi');
  const isSamsungBrowser = userAgent.includes('samsungbrowser');

  // Brave detection - Brave adds navigator.brave object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isBrave = !!(navigator as any).brave || userAgent.includes('brave');

  // Firefox and Safari don't have "chrome" in UA, so they're already excluded

  if (isEdge || isBrave || isOpera || isVivaldi || isSamsungBrowser) {
    return false;
  }

  return true;
}

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

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Question {
  index: number;
  question: string;
  questionForTTS?: string;
  category: string;
  difficulty: string;
  isFollowUp?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'submitting';

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setIsFullscreen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [, setTranscribedAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [interviewComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Introduction phase state
  const [phase, setPhase] = useState<'introduction' | 'introduction_followup' | 'technical'>('introduction');
  const [introductionMessage, setIntroductionMessage] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Refs for audio recording
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const browserTranscriptRef = useRef<string>('');

  // Check if user came from setup page and verify eligibility
  useEffect(() => {
    const fromSetup = location.state?.fromSetup === true;

    if (!fromSetup) {
      setUnauthorized(true);
      setIsLoading(false);
      return;
    }

    verifyAndStartInterview();
    return () => {
      cleanup();
    };
  }, [location.state]);

  const verifyAndStartInterview = async () => {
    try {
      setIsLoading(true);
      // Call setup API to verify credits/eligibility
      const setupResponse = await fetch(`${API_BASE_URL}/api/interview/setup`, {
        credentials: 'include'
      });
      const setupData = await setupResponse.json();

      if (!setupResponse.ok || !setupData.canStartInterview) {
        setError(setupData.error || 'Cannot start interview. Please purchase interview credits first.');
        return;
      }

      // If verified, proceed to start the interview
      await startInterview();
    } catch (err) {
      setError('Failed to verify interview eligibility');
      setIsLoading(false);
    }
  };

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
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !showEndConfirm && !interviewComplete) {
        setShowExitWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showEndConfirm, interviewComplete]);

  // NOTE: TTS is now handled directly in the response handlers (startInterview, submitAnswer)
  // to ensure proper sequencing and avoid double-speaking

  const startInterview = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/interview/session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start interview');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setTotalQuestions(data.totalQuestions);

      // Handle introduction phase
      if (data.phase === 'introduction') {
        setPhase('introduction');
        setIntroductionMessage(data.introductionMessage);
        setCurrentQuestion(null);
        // Speak the introduction message
        speakText(data.introductionMessage);
      } else if (data.currentQuestion) {
        // Fallback for technical phase (shouldn't happen on start)
        setPhase('technical');
        setCurrentQuestion(data.currentQuestion);
        if (data.questionIntro) {
          speakText(data.questionIntro + ' ' + (data.currentQuestion.questionForTTS || data.currentQuestion.question));
        }
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        setIsAiSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onend = () => {
          setIsAiSpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          setIsAiSpeaking(false);
          resolve();
        };

        // Chrome bug workaround: speech synthesis can pause indefinitely
        // Use a timeout based on text length as fallback
        const estimatedDuration = Math.max(text.length * 80, 3000); // ~80ms per char, min 3s
        const fallbackTimeout = setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          setIsAiSpeaking(false);
          resolve();
        }, estimatedDuration);

        utterance.onend = () => {
          clearTimeout(fallbackTimeout);
          setIsAiSpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          clearTimeout(fallbackTimeout);
          setIsAiSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      micStreamRef.current = stream;
      audioChunksRef.current = [];
      browserTranscriptRef.current = '';

      // Set up audio analysis for visual feedback
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
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Start browser speech recognition in parallel (as fallback)
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
          if (finalTranscript) {
            browserTranscriptRef.current += ' ' + finalTranscript;
          }
        };

        recognition.onerror = (event) => {
          // Get the error type from the event
          const errorEvent = event as unknown as { error?: string };
          const errorType = errorEvent.error || 'unknown';
          console.warn('Browser speech recognition error:', errorType);

          // Only show error for significant issues, not for 'no-speech' or 'aborted'
          // These errors are expected during normal use (e.g., when user pauses or stops)
          if (errorType === 'network' || errorType === 'audio-capture' || errorType === 'not-allowed') {
            setError('Microphone access issue. Please check your microphone permissions. Note: Only Google Chrome is supported.');
          }
          // For 'no-speech', 'aborted', 'service-not-allowed' - fail silently
          // The backend transcription will handle the audio
        };

        speechRecognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.warn('Could not start browser speech recognition:', e);
        }
      }

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setAudioLevel(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Stop browser speech recognition
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAndSubmit(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState('transcribing');
    }
  };

  const transcribeAndSubmit = async (audioBlob: Blob) => {
    try {
      setRecordingState('transcribing');

      // First, try to transcribe using the backend
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      let transcribedText = '';

      if (transcribeResponse.ok) {
        const transcribeData = await transcribeResponse.json();
        if (transcribeData.text && transcribeData.text.trim()) {
          transcribedText = transcribeData.text;
        } else if (transcribeData.useBrowserFallback) {
          // Use browser's speech recognition transcript captured during recording
          transcribedText = getBrowserTranscript();
        }
      } else {
        // Use browser fallback
        transcribedText = getBrowserTranscript();
      }

      if (!transcribedText.trim()) {
        setError('Could not transcribe your answer. Please try again and speak clearly.');
        setRecordingState('idle');
        return;
      }

      setTranscribedAnswer(transcribedText);

      // Now submit the answer
      await submitAnswer(transcribedText);
    } catch (err) {
      console.error('Error transcribing:', err);
      setError('Failed to process your answer. Please try again.');
      setRecordingState('idle');
    }
  };

  const getBrowserTranscript = (): string => {
    // Return the transcript captured by browser speech recognition during recording
    return browserTranscriptRef.current.trim();
  };

  const submitAnswer = async (answer: string) => {
    if (!sessionId || !answer.trim()) return;

    try {
      setRecordingState('submitting');
      setFeedback(null);

      const response = await fetch(`${API_BASE_URL}/api/interview/session/${sessionId}/answer`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answer })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setFeedback(data.feedback);

      // Speak brief spoken feedback and wait for it to complete before transitioning
      if (data.spokenFeedback) {
        await speakText(data.spokenFeedback);
      }

      // Small pause after feedback before next action
      await new Promise(resolve => setTimeout(resolve, 500));

      // Handle introduction phase responses
      if (data.phase === 'introduction_followup' && data.followUpQuestion) {
        // Got a follow-up question during introduction
        setPhase('introduction_followup');
        setFollowUpQuestion(data.followUpQuestion);
        setTranscribedAnswer('');
        setFeedback(null);
        setRecordingState('idle');
        await speakText(data.followUpQuestion);
        return;
      }

      if (data.phase === 'technical' && data.nextQuestion) {
        // Transitioning from introduction to technical questions
        // First speak the transition intro, then pause, then speak the question
        setPhase('technical');
        setIntroductionMessage(null);
        setFollowUpQuestion(null);

        // Speak transition message first
        if (data.questionIntro) {
          await speakText(data.questionIntro);
          // Brief pause between intro and question for smoother transition
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Now set and speak the question
        const questionWithFollowUp = {
          ...data.nextQuestion,
          isFollowUp: false
        };
        setCurrentQuestion(questionWithFollowUp);
        setTranscribedAnswer('');
        setFeedback(null);
        setRecordingState('idle');
        await speakText(data.nextQuestion.questionForTTS || data.nextQuestion.question);
        return;
      }

      if (data.status === 'completed') {
        // Redirect directly to history page with sessionId
        cleanup();
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        navigate('/interview/history', { state: { sessionId: sessionId } });
      } else if (data.nextQuestion) {
        // Mark if this is a follow-up question
        const questionWithFollowUp = {
          ...data.nextQuestion,
          isFollowUp: data.isFollowUp || false
        };
        setCurrentQuestion(questionWithFollowUp);
        setTranscribedAnswer('');
        setFeedback(null);
        setRecordingState('idle');

        // Speak question intro first, then pause, then speak the question
        if (data.questionIntro) {
          await speakText(data.questionIntro);
          // Brief pause between intro and question
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        await speakText(data.nextQuestion.questionForTTS || data.nextQuestion.question);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
      setRecordingState('idle');
    }
  };

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
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {
        // Ignore errors when aborting
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const handleMicClick = useCallback(() => {
    if (isAiSpeaking) return;

    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  }, [recordingState, isAiSpeaking]);

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

    // Call backend to generate partial results if we have a session
    if (sessionId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/interview/session/${sessionId}/end`, {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();

        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }

        // Navigate to history if there are results, otherwise home
        if (data.hasReport) {
          navigate('/interview/history', { state: { sessionId: sessionId } });
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Error ending interview:', error);
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        navigate('/home');
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      navigate('/home');
    }
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
            AI Interviews can only be taken on a laptop or desktop computer. Please switch to a larger device to continue.
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

  // Chrome browser check - only Google Chrome is supported
  if (!isGoogleChrome()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Google Chrome Required</h3>
          <p className="text-white/60 mb-6">
            The AI Interview requires Google Chrome for proper microphone and speech recognition functionality. Other browsers (including Edge, Brave, Firefox, Safari) are not supported.
          </p>
          <p className="text-white/40 text-sm mb-6">
            Please download and open this page in Google Chrome to continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200"
            >
              Back to Home
            </button>
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              Download Chrome
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized state - user didn't come from setup
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Setup Required</h3>
          <p className="text-white/60 mb-6">
            Please complete the interview setup before starting your session.
          </p>
          <button
            onClick={() => navigate('/interview/setup')}
            className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Go to Setup
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
          <div className="w-16 h-16 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Starting your interview...</p>
          <p className="text-white/60 text-sm mt-2">Preparing questions</p>
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
          <h3 className="text-xl font-bold text-white mb-2">Interview Error</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                setRecordingState('idle');
              }}
              className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/home')}
              className="flex-1 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-white/5 border-b border-white/10">
        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${recordingState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-white/40'}`} />
            <span className="text-white font-mono text-sm md:text-base">{formatTime(elapsedTime)}</span>
          </div>
          {/* Question Progress */}
          {currentQuestion && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <span className="text-white/60 text-sm">Question</span>
              <span className="text-white font-medium text-sm">{currentQuestion.index + 1} / {totalQuestions}</span>
            </div>
          )}
        </div>

        {/* Center - Interview Title */}
        <div className="hidden md:block">
          <h1 className="text-white font-semibold">AI Interview</h1>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {/* Introduction Phase Display */}
        {phase === 'introduction' && introductionMessage && (
          <div className="w-full max-w-2xl mb-8">
            <div className="bg-white/5 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                  Introduction
                </span>
              </div>
              <p className="text-white text-lg md:text-xl leading-relaxed">{introductionMessage}</p>
            </div>
          </div>
        )}

        {/* Introduction Follow-up Display */}
        {phase === 'introduction_followup' && followUpQuestion && (
          <div className="w-full max-w-2xl mb-8">
            <div className="bg-white/5 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                  Introduction
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                  Follow-up
                </span>
              </div>
              <p className="text-white text-lg md:text-xl leading-relaxed">{followUpQuestion}</p>
            </div>
          </div>
        )}

        {/* Technical Question Display */}
        {phase === 'technical' && currentQuestion && (
          <div className="w-full max-w-2xl mb-8">
            <div className={`bg-white/5 border rounded-2xl p-6 ${
              currentQuestion.isFollowUp ? 'border-orange-500/30' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                {currentQuestion.isFollowUp && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                    Follow-up
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentQuestion.category === 'maths' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {currentQuestion.category}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <p className="text-white text-lg md:text-xl leading-relaxed">{currentQuestion.question}</p>
            </div>
          </div>
        )}



        {/* Feedback Display */}
        {feedback && (
          <div className="w-full max-w-2xl mb-6 animate-fadeIn">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 font-medium mb-1">Feedback</p>
              <p className="text-white/80 text-sm">{feedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="px-4 md:px-6 py-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          {/* Mic Button */}
          <div className="relative">
            {recordingState === 'recording' && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-red-500/30 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.8})`,
                    opacity: audioLevel > 0.05 ? 0.4 : 0
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-red-400/20 transition-transform duration-100"
                  style={{
                    transform: `scale(${1 + audioLevel * 1.2})`,
                    opacity: audioLevel > 0.1 ? 0.3 : 0
                  }}
                />
              </>
            )}

            <button
              onClick={handleMicClick}
              disabled={isAiSpeaking || recordingState === 'transcribing' || recordingState === 'submitting' || !!feedback}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                recordingState === 'recording'
                  ? 'bg-red-500 hover:bg-red-600'
                  : recordingState === 'transcribing' || recordingState === 'submitting'
                  ? 'bg-yellow-500'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              style={{
                boxShadow: recordingState === 'recording' && audioLevel > 0.1
                  ? `0 0 ${20 + audioLevel * 30}px rgba(239, 68, 68, ${0.3 + audioLevel * 0.4})`
                  : 'none'
              }}
            >
              {recordingState === 'transcribing' || recordingState === 'submitting' ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : recordingState === 'recording' ? (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
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
          <span className={`text-xs ${
            recordingState === 'recording' ? 'text-red-400' :
            recordingState === 'transcribing' || recordingState === 'submitting' ? 'text-yellow-400' :
            'text-white/40'
          }`}>
            {recordingState === 'recording' ? 'Recording... tap to stop' :
             recordingState === 'transcribing' ? 'Processing speech...' :
             recordingState === 'submitting' ? 'Evaluating answer...' :
             feedback ? 'Wait for next question...' :
             'Tap to start answering'}
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
                Are you sure you want to end the interview? Your progress will be lost.
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
