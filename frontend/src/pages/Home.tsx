import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Item {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: 'test' | 'interview' | 'course';
  duration?: string;
}

interface PurchasedItem extends Item {
  id?: string; // Backend returns 'id' instead of '_id'
  itemId?: string;
  purchasedAt: string;
  status: 'active' | 'completed' | 'expired';
  quantity?: number;
  purchaseType?: 'paid' | 'assigned';
}

interface InterviewBalance {
  totalCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface DiscountInfo {
  valid: boolean;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  codeType: 'coupon' | 'referral';
  message: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>('available');
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [interviewBalance, setInterviewBalance] = useState<InterviewBalance>({ totalCredits: 0, creditsUsed: 0, creditsRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Discount code state per item
  const [discountCodes, setDiscountCodes] = useState<Record<string, string>>({});
  const [discountInfo, setDiscountInfo] = useState<Record<string, DiscountInfo | null>>({});
  const [validatingCode, setValidatingCode] = useState<Record<string, boolean>>({});

  // Fetch available items
  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/items`);
        if (!response.ok) {
          throw new Error('Failed to fetch available items');
        }
        const data = await response.json();
        // Sort items: interviews first, then tests, then courses
        const sortedItems = [...data.items].sort((a: Item, b: Item) => {
          const order = { interview: 0, test: 1, course: 2 };
          return order[a.type] - order[b.type];
        });
        setAvailableItems(sortedItems);
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
        if (data.interviewBalance) {
          setInterviewBalance(data.interviewBalance);
        }
      } catch (err) {
        setError('Failed to load purchased items');
        console.error('Error fetching purchased items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedItems();
  }, [isAuthenticated]);

  // Validate discount code
  const validateDiscountCode = async (itemId: string, itemType: string) => {
    const code = discountCodes[itemId]?.trim();
    if (!code) return;

    setValidatingCode(prev => ({ ...prev, [itemId]: true }));
    setDiscountInfo(prev => ({ ...prev, [itemId]: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, itemType })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setDiscountInfo(prev => ({
          ...prev,
          [itemId]: {
            valid: true,
            discountType: data.discountType,
            discountValue: data.discountValue,
            codeType: data.codeType,
            message: data.message
          }
        }));
      } else {
        setDiscountInfo(prev => ({
          ...prev,
          [itemId]: {
            valid: false,
            discountType: 'percentage',
            discountValue: 0,
            codeType: 'coupon',
            message: data.message || 'Invalid code'
          }
        }));
      }
    } catch (err) {
      setDiscountInfo(prev => ({
        ...prev,
        [itemId]: {
          valid: false,
          discountType: 'percentage',
          discountValue: 0,
          codeType: 'coupon',
          message: 'Failed to validate code'
        }
      }));
    } finally {
      setValidatingCode(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (item: Item): number => {
    const info = discountInfo[item._id];
    if (!info || !info.valid) return item.price;

    if (info.discountType === 'percentage') {
      return Math.round(item.price * (1 - info.discountValue / 100));
    } else {
      return Math.max(0, item.price - info.discountValue);
    }
  };

  // Clear discount code
  const clearDiscountCode = (itemId: string) => {
    setDiscountCodes(prev => ({ ...prev, [itemId]: '' }));
    setDiscountInfo(prev => ({ ...prev, [itemId]: null }));
  };

  const handlePurchase = async (item: Item) => {
    try {
      // Get Razorpay key
      const keyResponse = await fetch(`${API_BASE_URL}/api/payment/key`, {
        credentials: 'include'
      });
      const { key } = await keyResponse.json();

      // Get discount code if validated
      const validDiscount = discountInfo[item._id]?.valid ? discountCodes[item._id]?.trim() : undefined;

      // Create order
      const orderResponse = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemId: item._id,
          quantity: 1,
          discountCode: validDiscount
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vector',
        description: `${orderData.itemTitle}${orderData.quantity > 1 ? ` x${orderData.quantity}` : ''}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                itemId: item._id,
                quantity: 1,
                discountCode: validDiscount
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Refresh purchased items
              const purchasedResponse = await fetch(`${API_BASE_URL}/auth/purchases`, {
                credentials: 'include'
              });
              if (purchasedResponse.ok) {
                const purchasedData = await purchasedResponse.json();
                setPurchasedItems(purchasedData.purchases);
                if (purchasedData.interviewBalance) {
                  setInterviewBalance(purchasedData.interviewBalance);
                }
              }
              // Switch to purchased tab
              setActiveTab('purchased');
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert(err instanceof Error ? err.message : 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          email: user?.email || ''
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
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

  const isItemPurchased = (item: Item) => {
    // For tests and courses, check if already purchased
    if (item.type === 'test' || item.type === 'course') {
      const itemId = String(item._id);
      return purchasedItems.some(p => {
        const purchasedId = String(p.id || p._id);
        return purchasedId === itemId && p.type === item.type;
      });
    }
    return false;
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {availableItems.map((item) => {
                      const hasValidDiscount = discountInfo[item._id]?.valid;
                      const discountedPrice = getDiscountedPrice(item);
                      const discount = discountInfo[item._id];

                      return (
                        <div key={item._id} className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 md:mb-4 gap-2">
                            <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium border self-start ${getTypeColor(item.type)}`}>
                              {item.type.toUpperCase()}
                            </span>
                            <div className="text-right">
                              {hasValidDiscount ? (
                                <>
                                  <span className="text-sm text-white/50 line-through mr-2">₹{item.price}</span>
                                  <span className="text-xl md:text-2xl font-bold text-green-400">₹{discountedPrice}</span>
                                </>
                              ) : (
                                <span className="text-xl md:text-2xl font-bold text-white">₹{item.price}</span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 leading-tight">{item.title}</h3>
                          <p className="text-white/70 mb-3 md:mb-4 leading-relaxed text-sm md:text-base line-clamp-3">{item.description}</p>

                          <div className="flex flex-col gap-2 md:gap-4 mb-4 text-xs md:text-sm text-white/60">
                            {item.duration && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{item.duration}</span>
                              </div>
                            )}
                          </div>

                          {/* Discount Code Input */}
                          {!isItemPurchased(item) && (
                            <div className="mb-4">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Coupon or referral code"
                                  value={discountCodes[item._id] || ''}
                                  onChange={(e) => setDiscountCodes(prev => ({ ...prev, [item._id]: e.target.value.toUpperCase() }))}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
                                />
                                {hasValidDiscount ? (
                                  <button
                                    onClick={() => clearDiscountCode(item._id)}
                                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30"
                                  >
                                    Clear
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => validateDiscountCode(item._id, item.type)}
                                    disabled={!discountCodes[item._id]?.trim() || validatingCode[item._id]}
                                    className="px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg text-sm font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {validatingCode[item._id] ? '...' : 'Apply'}
                                  </button>
                                )}
                              </div>
                              {/* Discount message */}
                              {discount && (
                                <p className={`mt-2 text-xs ${discount.valid ? 'text-green-400' : 'text-red-400'}`}>
                                  {discount.message}
                                </p>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={isItemPurchased(item)}
                            className={`w-full py-2.5 md:py-3 rounded-lg font-medium transition-colors duration-300 text-sm md:text-base ${
                              isItemPurchased(item)
                                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-white/90'
                            }`}
                          >
                            {isItemPurchased(item) ? 'Already Purchased' : 'Purchase Now'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchased Items Tab */}
              {activeTab === 'purchased' && (
                <div>
                  {/* Interviews Section */}
                  {interviewBalance.totalCredits > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Interviews
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                          <span className="text-white font-medium">AI Interview</span>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm ${interviewBalance.creditsRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {interviewBalance.creditsRemaining} / {interviewBalance.totalCredits} left
                            </span>
                            <button
                              onClick={() => navigate('/interview/setup')}
                              disabled={interviewBalance.creditsRemaining <= 0}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                interviewBalance.creditsRemaining > 0
                                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10'
                                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                              }`}
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tests Section */}
                  {purchasedItems.filter(item => item.type === 'test').length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Tests
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        {purchasedItems.filter(item => item.type === 'test').map((item, index, arr) => {
                          const itemId = item.id || item._id;
                          return (
                            <div key={item._id} className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${index !== arr.length - 1 ? 'border-b border-white/10' : ''}`}>
                              <span className="text-white font-medium">{item.title}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-blue-400">
                                  Unlimited attempts
                                </span>
                                <button
                                  onClick={() => navigate(`/test/setup/${itemId}`)}
                                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 transition-all duration-200"
                                >
                                  Start
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Courses Section */}
                  {purchasedItems.filter(item => item.type === 'course').length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Courses
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        {purchasedItems.filter(item => item.type === 'course').map((item, index, arr) => (
                          <div key={item._id} className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${index !== arr.length - 1 ? 'border-b border-white/10' : ''}`}>
                            <span className="text-white font-medium">{item.title}</span>
                            <button
                              onClick={() => navigate(`/course/${item._id}`)}
                              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 transition-all duration-200"
                            >
                              Continue
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {purchasedItems.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-white/60">No purchases yet</p>
                      <button
                        onClick={() => setActiveTab('available')}
                        className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
                      >
                        Browse Available Items
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}