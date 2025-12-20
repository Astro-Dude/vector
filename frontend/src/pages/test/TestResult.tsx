import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface QuestionResult {
  questionId: string;
  question: string;
  type: 'mcq' | 'short';
  options: string[];
  selectedAnswer: number | string;
  correctAnswer: number | string;
  isCorrect: boolean;
  maxScore: number;
  scoreAwarded: number;
}

interface TestResultData {
  _id: string;
  sessionId: string;
  candidateName: string;
  testId: {
    _id: string;
    title: string;
    description: string;
  };
  questions: QuestionResult[];
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  timeTaken: number;
  createdAt: string;
}

export default function TestResult() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test/result/${sessionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch test result');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getGrade = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading result...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !result) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Error</h3>
            <p className="text-white/60 mb-6">{error || 'Result not found'}</p>
            <button
              onClick={() => navigate('/test/history')}
              className="w-full py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 md:pt-36 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Score Card */}
        <div className={`rounded-2xl border p-6 md:p-8 mb-8 ${getScoreBgColor(result.percentageScore)}`}>
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
              {result.testId?.title || 'Test Result'}
            </h1>
            <p className="text-white/60">{getGrade(result.percentageScore)}</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl md:text-5xl font-bold ${getScoreColor(result.percentageScore)}`}>
                  {result.percentageScore}
                </span>
                <span className="text-white/60 text-xl">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-white/40 text-sm mb-1">Correct</p>
              <p className="text-white font-bold text-lg">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Score</p>
              <p className="text-white font-bold text-lg">
                {result.totalScore}/{result.maxPossibleScore}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Time</p>
              <p className="text-white font-bold text-lg">{formatTime(result.timeTaken)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className={`w-5 h-5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          <button
            onClick={() => navigate('/test/history')}
            className="flex-1 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
          >
            Back to History
          </button>
        </div>

        {/* Question Details */}
        {showDetails && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">Question Breakdown</h2>
            {result.questions.map((q, index) => (
              <div
                key={q.questionId}
                className={`border rounded-xl p-4 md:p-6 ${
                  q.isCorrect
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/40 text-sm">Q{index + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        q.isCorrect
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs">
                        {q.type === 'mcq' ? 'MCQ' : 'Short Answer'}
                      </span>
                    </div>
                    <p className="text-white font-medium">{q.question}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${q.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {q.scoreAwarded}/{q.maxScore}
                    </span>
                  </div>
                </div>

                {q.type === 'mcq' ? (
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => {
                      const isSelected = q.selectedAnswer === optIdx;
                      const isCorrectOption = q.correctAnswer === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border flex items-center gap-3 ${
                            isCorrectOption
                              ? 'bg-green-500/10 border-green-500/30'
                              : isSelected
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isCorrectOption
                              ? 'border-green-500 bg-green-500'
                              : isSelected
                              ? 'border-red-500 bg-red-500'
                              : 'border-white/30'
                          }`}>
                            {isCorrectOption ? (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : isSelected ? (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <span className="text-white/40 text-xs">{String.fromCharCode(65 + optIdx)}</span>
                            )}
                          </div>
                          <span className={`${
                            isCorrectOption
                              ? 'text-green-400'
                              : isSelected
                              ? 'text-red-400'
                              : 'text-white/60'
                          }`}>
                            {option}
                          </span>
                          {isSelected && !isCorrectOption && (
                            <span className="ml-auto text-red-400 text-xs">Your answer</span>
                          )}
                          {isCorrectOption && (
                            <span className="ml-auto text-green-400 text-xs">Correct answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg border ${
                      q.isCorrect
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <p className="text-white/40 text-xs mb-1">Your Answer</p>
                      <p className={q.isCorrect ? 'text-green-400' : 'text-red-400'}>
                        {q.selectedAnswer === -1 ? '(Not answered)' : String(q.selectedAnswer)}
                      </p>
                    </div>
                    {!q.isCorrect && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-white/40 text-xs mb-1">Correct Answer</p>
                        <p className="text-green-400">{String(q.correctAnswer)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
