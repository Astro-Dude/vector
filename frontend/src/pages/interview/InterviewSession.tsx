import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  category: string;
  difficulty: string;
  isFollowUp?: boolean;
}

interface InterviewReport {
  finalScore: number;
  questions: Array<{
    question: string;
    answer: string;
    total: number;
    scores: {
      correctness: number;
      reasoning: number;
      clarity: number;
      problemSolving: number;
    };
    scoreReasons?: {
      correctness: string;
      reasoning: string;
      clarity: string;
      problemSolving: string;
    };
    feedback: {
      whatWentRight: string[];
      needsImprovement: string[];
    };
  }>;
  overallFeedback: {
    strengths: string[];
    improvementAreas: string[];
    suggestedNextSteps: string[];
  };
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
  const [transcribedAnswer, setTranscribedAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

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

  // Check if user came from setup page and start interview
  useEffect(() => {
    const fromSetup = location.state?.fromSetup === true;

    if (!fromSetup) {
      setUnauthorized(true);
      setIsLoading(false);
      return;
    }

    startInterview();
    return () => {
      cleanup();
    };
  }, [location.state]);

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

  // Speak question using browser TTS
  useEffect(() => {
    if (currentQuestion && !isLoading && recordingState === 'idle' && !feedback) {
      speakText(currentQuestion.question);
    }
  }, [currentQuestion, isLoading]);

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
      setCurrentQuestion(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);

      // Speak the intro and then the question
      if (data.questionIntro) {
        speakText(data.questionIntro + ' ' + data.currentQuestion.question);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      setIsAiSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => {
        setIsAiSpeaking(false);
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
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
          console.warn('Browser speech recognition error:', event);
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

      // Speak brief spoken feedback (4-5 words) instead of full feedback
      if (data.spokenFeedback) {
        speakText(data.spokenFeedback);
      }

      if (data.status === 'completed') {
        setInterviewComplete(true);
        setReport(data.report);
      } else if (data.nextQuestion) {
        // Wait for spoken feedback, then speak intro and next question
        setTimeout(() => {
          // Mark if this is a follow-up question
          const questionWithFollowUp = {
            ...data.nextQuestion,
            isFollowUp: data.isFollowUp || false
          };
          setCurrentQuestion(questionWithFollowUp);
          setTranscribedAnswer('');
          setFeedback(null);
          setRecordingState('idle');
          // Speak the question intro and question
          if (data.questionIntro) {
            speakText(data.questionIntro + ' ' + data.nextQuestion.question);
          }
        }, 2000);
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
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    navigate('/home');
  };

  const cancelEndInterview = () => {
    setShowEndConfirm(false);
  };

  const viewResults = async () => {
    cleanup();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    navigate('/home');
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

  // Interview complete - show results
  if (interviewComplete && report) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Score Card */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Interview Complete!</h2>
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                <circle
                  cx="64" cy="64" r="56"
                  stroke={report.finalScore >= 70 ? '#22c55e' : report.finalScore >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(report.finalScore / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{report.finalScore}</span>
              </div>
            </div>
            <p className="text-white/60">Your Score out of 100</p>
          </div>

          {/* Overall Feedback */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Overall Feedback</h3>

            {report.overallFeedback.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {report.overallFeedback.strengths.map((s, i) => (
                    <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.overallFeedback.improvementAreas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-yellow-400 font-medium mb-2">Areas to Improve</h4>
                <ul className="space-y-1">
                  {report.overallFeedback.improvementAreas.map((a, i) => (
                    <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">-</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.overallFeedback.suggestedNextSteps.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-medium mb-2">Next Steps</h4>
                <ul className="space-y-1">
                  {report.overallFeedback.suggestedNextSteps.map((s, i) => (
                    <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-1">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Question Details */}
          <div className="space-y-4 mb-6">
            {report.questions.map((q, i) => (
              <div key={i} className="bg-zinc-900 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">Question {i + 1}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    q.total >= 7 ? 'bg-green-500/20 text-green-400' :
                    q.total >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {q.total}/10
                  </span>
                </div>
                <p className="text-white font-medium mb-2">{q.question}</p>
                <p className="text-white/60 text-sm mb-3">Your answer: {q.answer}</p>

                {/* Score breakdown with reasons */}
                {q.scores && (
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className={`rounded p-2 text-center ${q.scores.correctness >= 4 ? 'bg-green-500/10' : q.scores.correctness >= 3 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <div className="text-white/40">Correctness</div>
                        <div className="text-white font-medium">{q.scores.correctness}/5</div>
                      </div>
                      <div className={`rounded p-2 text-center ${q.scores.reasoning >= 4 ? 'bg-green-500/10' : q.scores.reasoning >= 3 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <div className="text-white/40">Reasoning</div>
                        <div className="text-white font-medium">{q.scores.reasoning}/5</div>
                      </div>
                      <div className={`rounded p-2 text-center ${q.scores.clarity >= 4 ? 'bg-green-500/10' : q.scores.clarity >= 3 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <div className="text-white/40">Clarity</div>
                        <div className="text-white font-medium">{q.scores.clarity}/5</div>
                      </div>
                      <div className={`rounded p-2 text-center ${q.scores.problemSolving >= 4 ? 'bg-green-500/10' : q.scores.problemSolving >= 3 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <div className="text-white/40">Problem Solving</div>
                        <div className="text-white font-medium">{q.scores.problemSolving}/5</div>
                      </div>
                    </div>
                    {/* Score reasons */}
                    {q.scoreReasons && (
                      <div className="bg-white/5 rounded-lg p-3 text-xs space-y-1">
                        {q.scoreReasons.correctness && (
                          <p className="text-white/60"><span className="text-white/80">Correctness:</span> {q.scoreReasons.correctness}</p>
                        )}
                        {q.scoreReasons.reasoning && (
                          <p className="text-white/60"><span className="text-white/80">Reasoning:</span> {q.scoreReasons.reasoning}</p>
                        )}
                        {q.scoreReasons.clarity && (
                          <p className="text-white/60"><span className="text-white/80">Clarity:</span> {q.scoreReasons.clarity}</p>
                        )}
                        {q.scoreReasons.problemSolving && (
                          <p className="text-white/60"><span className="text-white/80">Problem Solving:</span> {q.scoreReasons.problemSolving}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {q.feedback.whatWentRight.length > 0 && (
                  <div className="text-green-400/80 text-sm">
                    + {q.feedback.whatWentRight.join(', ')}
                  </div>
                )}
                {q.feedback.needsImprovement.length > 0 && (
                  <div className="text-yellow-400/80 text-sm mt-1">
                    - {q.feedback.needsImprovement.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Done Button */}
          <button
            onClick={viewResults}
            className="w-full py-4 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Done
          </button>
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
        {/* Question Display */}
        {currentQuestion && (
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


        {/* Transcribed Answer Display */}
        {transcribedAnswer && recordingState !== 'idle' && (
          <div className="w-full max-w-2xl mb-6 animate-fadeIn">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-sm mb-1">Your answer:</p>
              <p className="text-white">{transcribedAnswer}</p>
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
