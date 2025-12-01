import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

interface Item {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: 'test' | 'interview' | 'course';
  duration?: string;
  level?: string;
}

interface PurchasedItem extends Item {
  purchasedAt: string;
  status: 'active' | 'completed' | 'expired';
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>('available');
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available items
  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/items`);
        if (!response.ok) {
          throw new Error('Failed to fetch available items');
        }
        const data = await response.json();
        setAvailableItems(data.items);
      } catch (err) {
        setError('Failed to load available items');
        console.error('Error fetching available items:', err);
      }
    };

    fetchAvailableItems();
  }, []);

  // Fetch purchased items
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPurchasedItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/purchases`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch purchased items');
        }
        const data = await response.json();
        setPurchasedItems(data.purchases);
      } catch (err) {
        setError('Failed to load purchased items');
        console.error('Error fetching purchased items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedItems();
  }, [isAuthenticated]);

  const handlePurchase = async (item: Item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/purchase/${item._id}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Purchase failed');
      }

      alert(`Purchase successful! ${item.title} has been added to your account.`);

      // Refresh purchased items
      const purchasedResponse = await fetch(`${API_BASE_URL}/auth/purchases`, {
        credentials: 'include'
      });
      if (purchasedResponse.ok) {
        const purchasedData = await purchasedResponse.json();
        setPurchasedItems(purchasedData.purchases);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'interview': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'course': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-28 md:pt-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 mt-5">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-lg md:text-xl text-white/70 px-4">
              Continue your journey towards NSET success
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-3 md:mb-4"></div>
                <p className="text-white/70 text-sm md:text-base">Loading your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 md:p-6 mb-6 md:mb-8 mx-4 md:mx-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-400 font-medium text-sm md:text-base">{error}</p>
              </div>
            </div>
          )}

          {/* Tab Navigation and Content */}
          {!loading && !error && (
            <>
              {/* Mobile Tab Navigation */}
              <div className="md:hidden mb-8">
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'available'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Available ({availableItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('purchased')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'purchased'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    Purchased ({purchasedItems.length})
                  </button>
                </div>
              </div>

              {/* Desktop Tab Navigation */}
              <div className="hidden md:flex gap-8 mb-12 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`pb-4 px-2 text-lg font-medium transition-colors ${
                    activeTab === 'available'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Available Items ({availableItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('purchased')}
                  className={`pb-4 px-2 text-lg font-medium transition-colors ${
                    activeTab === 'purchased'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  My Purchases ({purchasedItems.length})
                </button>
              </div>

              {/* Available Items Tab */}
              {activeTab === 'available' && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Available Items</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {availableItems.map((item) => (
                      <div key={item._id} className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 md:mb-4 gap-2">
                          <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium border self-start ${getTypeColor(item.type)}`}>
                            {item.type.toUpperCase()}
                          </span>
                          <span className="text-xl md:text-2xl font-bold text-white">₹{item.price}</span>
                        </div>

                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 leading-tight">{item.title}</h3>
                        <p className="text-white/70 mb-3 md:mb-4 leading-relaxed text-sm md:text-base line-clamp-3">{item.description}</p>

                        <div className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6 text-xs md:text-sm text-white/60">
                          {item.duration && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate">{item.duration}</span>
                            </div>
                          )}
                          {item.level && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate">{item.level}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handlePurchase(item)}
                          className="w-full py-2.5 md:py-3 bg-white text-black hover:bg-white/90 rounded-lg font-medium transition-colors duration-300 text-sm md:text-base"
                        >
                          Purchase Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchased Items Tab */}
              {activeTab === 'purchased' && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">My Purchases</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {purchasedItems.map((item) => (
                      <div key={item._id} className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 md:mb-4 gap-2">
                          <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium border self-start ${getTypeColor(item.type)}`}>
                            {item.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium self-start ${getStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 leading-tight">{item.title}</h3>
                        <p className="text-white/70 mb-3 md:mb-4 leading-relaxed text-sm md:text-base line-clamp-3">{item.description}</p>

                        <div className="flex flex-col gap-2 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm text-white/60">
                          {item.duration && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate">{item.duration}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">Purchased {new Date(item.purchasedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-lg md:text-xl font-bold text-white">₹{item.price}</span>
                          <div className="flex gap-2">
                            {item.type === 'interview' && item.status === 'active' && (
                              <button
                                onClick={() => navigate('/interview/setup')}
                                className="px-3 py-2 md:px-4 md:py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-lg font-medium transition-colors duration-300 text-sm md:text-base"
                              >
                                Start Interview
                              </button>
                            )}
                            <button className="px-3 py-2 md:px-4 md:py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium transition-colors duration-300 text-sm md:text-base">
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}