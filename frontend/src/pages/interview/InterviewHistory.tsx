import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

interface QuestionResult {
  question: string;
  answer: string;
  scores: {
    correctness: number;
    reasoning: number;
    clarity: number;
    problemSolving: number;
  };
  total: number;
  feedback: {
    whatWentRight: string[];
    needsImprovement: string[];
  };
  scoreReasons?: {
    correctness?: string;
    reasoning?: string;
    clarity?: string;
    problemSolving?: string;
  };
}

interface OverallFeedback {
  strengths: string[];
  improvementAreas: string[];
  suggestedNextSteps: string[];
}

interface InterviewResult {
  _id: string;
  sessionId: string;
  candidateName: string;
  questions: QuestionResult[];
  finalScore: number;
  overallFeedback: OverallFeedback;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

interface HistoryResponse {
  results: InterviewResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/interview/history?page=${page}&limit=10`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interview history');
      }

      const data: HistoryResponse = await response.json();
      setResults(data.results);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetail = async (sessionId: string) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`${API_URL}/api/interview/result/${sessionId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interview details');
      }

      const data = await response.json();
      setSelectedResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/20';
    if (score >= 50) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  // Detail View for selected result
  if (selectedResult) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-28 md:pt-36 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setSelectedResult(null)}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to History
            </button>

            {/* Score Card */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Interview Result</h2>
              <p className="text-white/40 text-sm mb-4">{selectedResult.completedAt ? formatDate(selectedResult.completedAt) : 'Date not available'}</p>
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke={(selectedResult.finalScore ?? 0) >= 70 ? '#22c55e' : (selectedResult.finalScore ?? 0) >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${((selectedResult.finalScore ?? 0) / 100) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{selectedResult.finalScore ?? 0}</span>
                </div>
              </div>
              <p className="text-white/60">Your Score out of 100</p>
            </div>

            {/* Overall Feedback */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Overall Feedback</h3>

              {selectedResult.overallFeedback?.strengths?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {selectedResult.overallFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-1">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedResult.overallFeedback?.improvementAreas?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-yellow-400 font-medium mb-2">Areas to Improve</h4>
                  <ul className="space-y-1">
                    {selectedResult.overallFeedback.improvementAreas.map((a, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">-</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedResult.overallFeedback?.suggestedNextSteps?.length > 0 && (
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">Next Steps</h4>
                  <ul className="space-y-1">
                    {selectedResult.overallFeedback.suggestedNextSteps.map((s, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span className="text-blue-400 mt-1">&rarr;</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Question Details */}
            <div className="space-y-4 mb-6">
              {(selectedResult.questions || []).map((q, i) => (
                <div key={i} className="bg-zinc-900 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-sm">Question {i + 1}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (q.total ?? 0) >= 7 ? 'bg-green-500/20 text-green-400' :
                      (q.total ?? 0) >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {q.total ?? 0}/10
                    </span>
                  </div>
                  <p className="text-white font-medium mb-2">{q.question || 'Question not available'}</p>
                  <p className="text-white/60 text-sm mb-3">Your answer: {q.answer || 'No answer recorded'}</p>

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

                  {q.feedback?.whatWentRight?.length > 0 && (
                    <div className="text-green-400/80 text-sm">
                      + {q.feedback.whatWentRight.join(', ')}
                    </div>
                  )}
                  {q.feedback?.needsImprovement?.length > 0 && (
                    <div className="text-yellow-400/80 text-sm mt-1">
                      - {q.feedback.needsImprovement.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className={`min-h-screen bg-black ${loading || detailLoading ? 'overflow-hidden' : ''}`}>
      <Navbar />
      <div className={`pt-28 md:pt-36 p-4 md:p-8 ${loading || detailLoading ? 'no-scroll' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Interview Results</h1>

          {loading || detailLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              {detailLoading && <p className="text-white/60 mt-4">Loading interview details...</p>}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Interview Results Yet</h3>
              <p className="text-white/60 mb-6">Complete your first interview to see your results here.</p>
              <button
                onClick={() => navigate('/interview/setup')}
                className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
              >
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {/* Results List */}
              <div className="space-y-4">
                {results.map((result) => (
                  <button
                    key={result._id}
                    onClick={() => fetchResultDetail(result.sessionId)}
                    disabled={detailLoading}
                    className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl p-5 text-left transition-all duration-200 group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-2xl font-bold ${getScoreColor(result.finalScore)}`}>
                            {result.finalScore}
                          </span>
                          <span className="text-white/40">/100</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBg(result.finalScore)} ${getScoreColor(result.finalScore)}`}>
                            {result.finalScore >= 70 ? 'Good' : result.finalScore >= 50 ? 'Average' : 'Needs Work'}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">
                          {result.candidateName || 'Interview'}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          {formatDate(result.createdAt)}
                        </p>
                      </div>
                      <div className="text-white/40 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-white/60">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
