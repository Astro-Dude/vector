import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ReferralRecord {
  id: string;
  referredEmail: string;
  referredName: string;
  status: 'pending' | 'successful' | 'failed';
  rewardAmount: number;
  rewardStatus: 'pending' | 'earned' | 'paid';
  createdAt: string;
  completedAt?: string;
}

interface ReferralData {
  referralCode: string;
  totalEarnings: number;
  pendingEarnings: number;
  successfulReferrals: number;
  pendingReferrals: number;
  referrals: ReferralRecord[];
}

export default function Referral() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchReferralData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/referral`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch referral data');
        }

        const referralData = await response.json();
        setData(referralData);
      } catch (err) {
        setError('Failed to load referral data');
        console.error('Error fetching referral data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [isAuthenticated, navigate]);

  const copyToClipboard = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'successful': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRewardStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-white/50';
      case 'earned': return 'text-yellow-400';
      case 'paid': return 'text-green-400';
      default: return 'text-white/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 md:pt-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Referral Program
            </h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Share your referral code with friends. When they purchase an interview and score above 50%, you earn rewards!
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Loading referral data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && data && (
            <>
              {/* Referral Code Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Referral Code</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3">
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">
                      {data.referralCode}
                    </span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-white/50 text-sm mt-3">
                  Share this code with friends. They'll get a discount on their interview purchase!
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{data.successfulReferrals}</p>
                  <p className="text-white/50 text-sm">Successful</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{data.pendingReferrals}</p>
                  <p className="text-white/50 text-sm">Pending</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">₹{data.totalEarnings}</p>
                  <p className="text-white/50 text-sm">Total Earned</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">₹{data.pendingEarnings}</p>
                  <p className="text-white/50 text-sm">Pending Payout</p>
                </div>
              </div>

              {/* Referrals List */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Your Referrals</h2>
                </div>

                {data.referrals.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-white/50">No referrals yet. Share your code to get started!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {data.referrals.map((referral) => (
                      <div key={referral.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-medium">{referral.referredName}</p>
                            <p className="text-white/50 text-sm">{referral.referredEmail}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-sm font-medium ${getRewardStatusColor(referral.rewardStatus)}`}>
                                {referral.status === 'successful' ? `₹${referral.rewardAmount}` : '-'}
                              </p>
                              <p className="text-white/40 text-xs">
                                {referral.rewardStatus === 'earned' ? 'Earned' : referral.rewardStatus === 'paid' ? 'Paid' : ''}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                              {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                            </span>
                            <span className="text-white/40 text-xs hidden md:block">
                              {formatDate(referral.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How it Works */}
              <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">How it Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-medium shrink-0">1</div>
                    <div>
                      <p className="text-white font-medium">Share your code</p>
                      <p className="text-white/50 text-sm">Give your unique referral code to friends</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-medium shrink-0">2</div>
                    <div>
                      <p className="text-white font-medium">They get a discount</p>
                      <p className="text-white/50 text-sm">Your friend applies the code when purchasing an interview</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-medium shrink-0">3</div>
                    <div>
                      <p className="text-white font-medium">Complete the interview</p>
                      <p className="text-white/50 text-sm">They must complete the interview naturally (not exit early)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-medium shrink-0">4</div>
                    <div>
                      <p className="text-white font-medium">You earn rewards</p>
                      <p className="text-white/50 text-sm">If they score above 50%, you earn a reward!</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
