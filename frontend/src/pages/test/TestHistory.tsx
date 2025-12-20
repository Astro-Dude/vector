import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface TestResultSummary {
  _id: string;
  sessionId: string;
  candidateName: string;
  percentageScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  createdAt: string;
  testId?: {
    _id: string;
    title: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TestHistory() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResultSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test/history?page=${page}&limit=10`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch test history');
      }

      const data = await response.json();
      setResults(data.results);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 md:pt-36 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Test History</h1>
            <p className="text-white/60">View your past test attempts and results</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading test history...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchHistory(currentPage)}
              className="mt-4 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Test History</h3>
            <p className="text-white/60 mb-6">You haven't taken any tests yet.</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all duration-200"
            >
              Take a Test
            </button>
          </div>
        )}

        {/* Results List */}
        {!loading && !error && results.length > 0 && (
          <>
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result._id}
                  onClick={() => navigate(`/test/result/${result.sessionId}`)}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Test Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {result.testId?.title || 'Test'}
                      </h3>
                      <p className="text-white/40 text-sm">{formatDate(result.createdAt)}</p>
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-center">
                        <p className="text-white/40 text-xs mb-1">Correct</p>
                        <p className="text-white font-semibold">
                          {result.correctAnswers}/{result.totalQuestions}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-xs mb-1">Time</p>
                        <p className="text-white font-semibold">{formatTime(result.timeTaken)}</p>
                      </div>
                    </div>

                    {/* Right: Score */}
                    <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${getScoreBgColor(result.percentageScore)}`}>
                      <span className={`text-xl font-bold ${getScoreColor(result.percentageScore)}`}>
                        {result.percentageScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    currentPage === 1
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Previous
                </button>

                <span className="text-white/60 px-4">
                  Page {currentPage} of {pagination.pages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    currentPage === pagination.pages
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
