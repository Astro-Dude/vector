import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type Tab = 'stats' | 'users' | 'items' | 'purchases' | 'results' | 'questions' | 'testQuestions';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalPaid: number;
  totalAssigned: number;
  createdAt: string;
}

interface Item {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: 'test' | 'interview' | 'course';
  isActive: boolean;
}

interface Purchase {
  _id: string;
  user: { firstName?: string; lastName?: string; email: string };
  item: { title: string; price: number };
  credits: number;
  creditsUsed: number;
  creditsAssigned: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface InterviewResult {
  _id: string;
  sessionId: string;
  candidateName: string;
  finalScore: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalEarnings: number;
  totalAssigned: number;
  totalInterviewCredits: number;
  totalInterviewCreditsUsed: number;
  totalTestsPurchased: number;
  purchasesByType: Array<{
    _id: string;
    count: number;
    totalAmount: number;
    totalAssigned: number;
  }>;
  earningsOverTime: Array<{
    _id: { year: number; month: number };
    total: number;
  }>;
  usersOverTime: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

interface InterviewQuestion {
  _id: string;
  question: string;
  answer: string;
  category: 'maths' | 'behaviour';
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: string;
}

interface TestQuestion {
  _id: string;
  testId: { _id: string; title: string } | string;
  question: string;
  options: string[];
  correctAnswer: number;
  score: number;
  category: 'maths' | 'reasoning';
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: string;
}

interface TestResult {
  _id: string;
  userId: { _id: string; firstName?: string; lastName?: string; email: string };
  testId: { _id: string; title: string };
  sessionId: string;
  candidateName: string;
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    users: { search: '' },
    items: { type: '' as '' | 'test' | 'interview' | 'course' },
    purchases: { status: '' as '' | 'active' | 'completed' | 'expired' | 'cancelled' },
    interviews: { search: '', minScore: '', maxScore: '' },
    questions: { category: '' as '' | 'maths' | 'behaviour', difficulty: '' as '' | 'easy' | 'medium' | 'hard', isActive: '' as '' | 'true' | 'false' },
    testQuestions: { testId: '', category: '' as '' | 'maths' | 'reasoning', difficulty: '' as '' | 'easy' | 'medium' | 'hard', isActive: '' as '' | 'true' | 'false' },
    testResults: { testId: '', status: '' as '' | 'in_progress' | 'completed' | 'abandoned', search: '' }
  });

  // New item form
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: 0,
    type: 'interview' as 'test' | 'interview' | 'course'
  });

  // New interview question form
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answer: '',
    category: 'maths' as 'maths' | 'behaviour',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  // Edit interview question state
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  // New test question form
  const [newTestQuestion, setNewTestQuestion] = useState({
    testId: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    score: 1,
    category: 'maths' as 'maths' | 'reasoning',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  // Edit test question state
  const [editingTestQuestion, setEditingTestQuestion] = useState<TestQuestion | null>(null);

  // Assign popup state
  const [assignPopup, setAssignPopup] = useState<{ user: User; itemId: string; quantity: number } | null>(null);

  // Results sub-tab state
  const [resultsSubTab, setResultsSubTab] = useState<'interviews' | 'tests'>('interviews');


  const fetchData = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/${endpoint}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch');
      }
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [tab]);

  const loadTabData = async () => {
    switch (tab) {
      case 'stats':
        const statsData = await fetchData('stats');
        if (statsData) setStats(statsData);
        break;
      case 'users':
        const [usersData, itemsForUsers] = await Promise.all([
          fetchData('users'),
          fetchData('items')
        ]);
        if (usersData) setUsers(usersData);
        if (itemsForUsers) setItems(itemsForUsers);
        break;
      case 'items':
        const itemsData = await fetchData('items');
        if (itemsData) setItems(itemsData);
        break;
      case 'purchases':
        const purchasesData = await fetchData('purchases');
        if (purchasesData) setPurchases(purchasesData);
        break;
      case 'results':
        const [interviewsData, testResultsData, itemsForResults] = await Promise.all([
          fetchData('interviews'),
          fetchData('test-results'),
          fetchData('items')
        ]);
        if (interviewsData) setInterviews(interviewsData);
        if (testResultsData) setTestResults(testResultsData);
        if (itemsForResults) setItems(itemsForResults);
        break;
      case 'questions':
        const questionsData = await fetchData('questions');
        if (questionsData) setQuestions(questionsData);
        break;
      case 'testQuestions':
        const [testQuestionsData, itemsForTestQ] = await Promise.all([
          fetchData('test-questions'),
          fetchData('items')
        ]);
        if (testQuestionsData) setTestQuestions(testQuestionsData);
        if (itemsForTestQ) setItems(itemsForTestQ);
        break;
    }
  };

  const createItem = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newItem)
      });

      if (!res.ok) throw new Error('Failed to create item');

      setNewItem({ title: '', description: '', price: 0, type: 'interview' });
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/items/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting item');
    }
  };

  const assignItemToUser = async () => {
    if (!assignPopup) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: assignPopup.user._id,
          itemId: assignPopup.itemId,
          quantity: assignPopup.quantity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign');

      alert(data.message);
      setAssignPopup(null);
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error assigning item');
    }
  };

  // Question CRUD operations
  const createQuestion = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newQuestion)
      });

      if (!res.ok) throw new Error('Failed to create question');

      setNewQuestion({ question: '', answer: '', category: 'maths', difficulty: 'medium' });
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating question');
    }
  };

  const updateQuestion = async () => {
    if (!editingQuestion) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${editingQuestion._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingQuestion)
      });

      if (!res.ok) throw new Error('Failed to update question');

      setEditingQuestion(null);
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating question');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting question');
    }
  };

  const toggleQuestionActive = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/questions/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to toggle');
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling question');
    }
  };

  // Test Question CRUD operations
  const createTestQuestion = async () => {
    try {
      const filteredOptions = newTestQuestion.options.filter(o => o.trim() !== '');
      if (filteredOptions.length < 2) {
        setError('At least 2 options are required');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/admin/test-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newTestQuestion, options: filteredOptions })
      });

      if (!res.ok) throw new Error('Failed to create test question');

      setNewTestQuestion({ testId: '', question: '', options: ['', '', '', ''], correctAnswer: 0, score: 1, category: 'maths', difficulty: 'medium' });
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating test question');
    }
  };

  const updateTestQuestion = async () => {
    if (!editingTestQuestion) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/test-questions/${editingTestQuestion._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingTestQuestion)
      });

      if (!res.ok) throw new Error('Failed to update test question');

      setEditingTestQuestion(null);
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating test question');
    }
  };

  const deleteTestQuestion = async (id: string) => {
    if (!confirm('Delete this test question?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/test-questions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting test question');
    }
  };

  const toggleTestQuestionActive = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/test-questions/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to toggle');
      loadTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling test question');
    }
  };

  // Get tests only (for test questions dropdown)
  const testItems = items.filter(i => i.type === 'test');

  // Apply filters to data
  const filteredUsersDisplay = users.filter(u => {
    if (filters.users.search && !u.email.toLowerCase().includes(filters.users.search.toLowerCase()) &&
        !`${u.firstName} ${u.lastName}`.toLowerCase().includes(filters.users.search.toLowerCase())) return false;
    return true;
  });

  const filteredItemsDisplay = items.filter(i => {
    if (filters.items.type && i.type !== filters.items.type) return false;
    return true;
  });

  const filteredPurchasesDisplay = purchases.filter(p => {
    // Only show paid purchases (those with amount > 0)
    if (p.amount <= 0) return false;
    if (filters.purchases.status && p.status !== filters.purchases.status) return false;
    return true;
  });

  const filteredInterviewsDisplay = interviews.filter(i => {
    if (filters.interviews.search && !i.candidateName.toLowerCase().includes(filters.interviews.search.toLowerCase()) &&
        !i.sessionId.toLowerCase().includes(filters.interviews.search.toLowerCase())) return false;
    if (filters.interviews.minScore && i.finalScore < Number(filters.interviews.minScore)) return false;
    if (filters.interviews.maxScore && i.finalScore > Number(filters.interviews.maxScore)) return false;
    return true;
  });

  const filteredQuestionsDisplay = questions.filter(q => {
    if (filters.questions.category && q.category !== filters.questions.category) return false;
    if (filters.questions.difficulty && q.difficulty !== filters.questions.difficulty) return false;
    if (filters.questions.isActive === 'true' && !q.isActive) return false;
    if (filters.questions.isActive === 'false' && q.isActive) return false;
    return true;
  });

  const filteredTestQuestionsDisplay = testQuestions.filter(q => {
    const testIdValue = typeof q.testId === 'object' ? q.testId._id : q.testId;
    if (filters.testQuestions.testId && testIdValue !== filters.testQuestions.testId) return false;
    if (filters.testQuestions.category && q.category !== filters.testQuestions.category) return false;
    if (filters.testQuestions.difficulty && q.difficulty !== filters.testQuestions.difficulty) return false;
    if (filters.testQuestions.isActive === 'true' && !q.isActive) return false;
    if (filters.testQuestions.isActive === 'false' && q.isActive) return false;
    return true;
  });

  const filteredTestResultsDisplay = testResults.filter(r => {
    if (filters.testResults.testId && r.testId._id !== filters.testResults.testId) return false;
    if (filters.testResults.status && r.status !== filters.testResults.status) return false;
    if (filters.testResults.search && !r.candidateName.toLowerCase().includes(filters.testResults.search.toLowerCase()) &&
        !r.userId?.email?.toLowerCase().includes(filters.testResults.search.toLowerCase())) return false;
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'users', label: 'Users' },
    { key: 'items', label: 'Items' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'results', label: 'Results' },
    { key: 'questions', label: 'Interview Questions' },
    { key: 'testQuestions', label: 'Test Questions' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded ${tab === t.key ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {loading && <div className="text-white/60">Loading...</div>}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 p-4 rounded">
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <div className="text-white/60 text-sm mt-1">Total Users</div>
            </div>
            <div className="bg-zinc-900 p-4 rounded">
              <div className="text-3xl font-bold text-green-400">₹{stats.totalEarnings.toLocaleString()}</div>
              <div className="text-white/60 text-sm mt-1">Total Earnings</div>
            </div>
            <div className="bg-zinc-900 p-4 rounded">
              <div className="text-3xl font-bold text-blue-400">{stats.totalInterviewCredits}</div>
              <div className="text-white/60 text-sm mt-1">Interviews Purchased</div>
            </div>
            <div className="bg-zinc-900 p-4 rounded">
              <div className="text-3xl font-bold text-purple-400">{stats.totalTestsPurchased}</div>
              <div className="text-white/60 text-sm mt-1">Tests Purchased</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Over Time Chart */}
            <div className="bg-zinc-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-4">Earnings Over Time</h3>
              {stats.earningsOverTime.length > 0 ? (
                <div className="h-48">
                  <svg viewBox="0 0 400 160" className="w-full h-full">
                    {(() => {
                      const data = stats.earningsOverTime.slice(-12);
                      const maxVal = Math.max(...data.map(d => d.total), 1);
                      const width = 400;
                      const height = 140;
                      const padding = 40;
                      const chartWidth = width - padding * 2;
                      const chartHeight = height - 20;
                      const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

                      const points = data.map((d, i) => ({
                        x: padding + (data.length > 1 ? i * stepX : chartWidth / 2),
                        y: height - 10 - (d.total / maxVal) * chartHeight
                      }));

                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`;

                      return (
                        <>
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map(i => (
                            <line key={i} x1={padding} y1={height - 10 - (i / 4) * chartHeight} x2={width - padding} y2={height - 10 - (i / 4) * chartHeight} stroke="#333" strokeDasharray="4" />
                          ))}
                          {/* Y-axis labels */}
                          {[0, 1, 2, 3, 4].map(i => (
                            <text key={i} x={padding - 5} y={height - 10 - (i / 4) * chartHeight + 4} fill="#666" fontSize="10" textAnchor="end">
                              ₹{Math.round((maxVal * i) / 4 / 1000)}k
                            </text>
                          ))}
                          {/* Area fill */}
                          <path d={areaPath} fill="url(#greenGradient)" opacity="0.3" />
                          {/* Line */}
                          <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" />
                          {/* Points */}
                          {points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#22c55e" />
                          ))}
                          {/* X-axis labels */}
                          {data.map((d, i) => (
                            <text key={i} x={points[i].x} y={height} fill="#666" fontSize="9" textAnchor="middle">
                              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month - 1]}
                            </text>
                          ))}
                          <defs>
                            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-white/40">No earnings data</div>
              )}
            </div>

            {/* Users Over Time Chart */}
            <div className="bg-zinc-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              {stats.usersOverTime.length > 0 ? (
                <div className="h-48">
                  <svg viewBox="0 0 400 160" className="w-full h-full">
                    {(() => {
                      const data = stats.usersOverTime.slice(-12);
                      const maxVal = Math.max(...data.map(d => d.count), 1);
                      const width = 400;
                      const height = 140;
                      const padding = 40;
                      const chartWidth = width - padding * 2;
                      const chartHeight = height - 20;
                      const barWidth = Math.min(30, (chartWidth / data.length) * 0.7);
                      const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

                      return (
                        <>
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map(i => (
                            <line key={i} x1={padding} y1={height - 10 - (i / 4) * chartHeight} x2={width - padding} y2={height - 10 - (i / 4) * chartHeight} stroke="#333" strokeDasharray="4" />
                          ))}
                          {/* Y-axis labels */}
                          {[0, 1, 2, 3, 4].map(i => (
                            <text key={i} x={padding - 5} y={height - 10 - (i / 4) * chartHeight + 4} fill="#666" fontSize="10" textAnchor="end">
                              {Math.round((maxVal * i) / 4)}
                            </text>
                          ))}
                          {/* Bars */}
                          {data.map((d, i) => {
                            const barHeight = (d.count / maxVal) * chartHeight;
                            const x = padding + gap + i * (barWidth + gap);
                            return (
                              <g key={i}>
                                <rect x={x} y={height - 10 - barHeight} width={barWidth} height={barHeight} fill="#3b82f6" rx="2" />
                                <text x={x + barWidth / 2} y={height} fill="#666" fontSize="9" textAnchor="middle">
                                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month - 1]}
                                </text>
                                <text x={x + barWidth / 2} y={height - 10 - barHeight - 5} fill="#3b82f6" fontSize="10" textAnchor="middle">
                                  {d.count}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-white/40">No user data</div>
              )}
            </div>
          </div>

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchases by Count - Pie Chart */}
            <div className="bg-zinc-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-4">Purchases by Quantity</h3>
              {stats.purchasesByType.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {(() => {
                        const total = stats.purchasesByType.reduce((sum, p) => sum + p.count, 0);
                        const colors: Record<string, string> = {
                          interview: '#3b82f6',
                          test: '#a855f7',
                          course: '#22c55e'
                        };
                        let startAngle = 0;

                        return stats.purchasesByType.map((p, i) => {
                          const percentage = p.count / total;
                          const angle = percentage * 360;
                          const endAngle = startAngle + angle;

                          const startRad = (startAngle - 90) * Math.PI / 180;
                          const endRad = (endAngle - 90) * Math.PI / 180;

                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);

                          const largeArcFlag = angle > 180 ? 1 : 0;

                          const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                          startAngle = endAngle;

                          return (
                            <path key={i} d={path} fill={colors[p._id] || '#666'} stroke="#18181b" strokeWidth="1" />
                          );
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="space-y-2 w-full">
                    {stats.purchasesByType.map((p, i) => {
                      const colors: Record<string, string> = {
                        interview: 'bg-blue-500',
                        test: 'bg-purple-500',
                        course: 'bg-green-500'
                      };
                      const total = stats.purchasesByType.reduce((sum, p) => sum + p.count, 0);
                      const percentage = ((p.count / total) * 100).toFixed(1);

                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${colors[p._id] || 'bg-gray-500'}`}></div>
                            <span className="text-white capitalize text-sm">{p._id}</span>
                          </div>
                          <span className="text-white/60 text-sm">{p.count} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-white/40">No purchase data</div>
              )}
            </div>

            {/* Revenue by Type - Pie Chart */}
            <div className="bg-zinc-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-4">Revenue by Type</h3>
              {stats.purchasesByType.length > 0 && stats.purchasesByType.some(p => p.totalAmount > 0) ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {(() => {
                        const total = stats.purchasesByType.reduce((sum, p) => sum + p.totalAmount, 0);
                        if (total === 0) return null;
                        const colors: Record<string, string> = {
                          interview: '#3b82f6',
                          test: '#a855f7',
                          course: '#22c55e'
                        };
                        let startAngle = 0;

                        return stats.purchasesByType.filter(p => p.totalAmount > 0).map((p, i) => {
                          const percentage = p.totalAmount / total;
                          const angle = percentage * 360;
                          const endAngle = startAngle + angle;

                          const startRad = (startAngle - 90) * Math.PI / 180;
                          const endRad = (endAngle - 90) * Math.PI / 180;

                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);

                          const largeArcFlag = angle > 180 ? 1 : 0;

                          const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                          startAngle = endAngle;

                          return (
                            <path key={i} d={path} fill={colors[p._id] || '#666'} stroke="#18181b" strokeWidth="1" />
                          );
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="space-y-2 w-full">
                    {stats.purchasesByType.map((p, i) => {
                      const colors: Record<string, string> = {
                        interview: 'bg-blue-500',
                        test: 'bg-purple-500',
                        course: 'bg-green-500'
                      };
                      const total = stats.purchasesByType.reduce((sum, p) => sum + p.totalAmount, 0);
                      const percentage = total > 0 ? ((p.totalAmount / total) * 100).toFixed(1) : '0';

                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${colors[p._id] || 'bg-gray-500'}`}></div>
                            <span className="text-white capitalize text-sm">{p._id}</span>
                          </div>
                          <span className="text-green-400 text-sm">₹{p.totalAmount.toLocaleString()} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-white/40">No revenue data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          {/* Filter */}
          <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={filters.users.search}
              onChange={e => setFilters({ ...filters, users: { ...filters.users, search: e.target.value } })}
              className="bg-zinc-800 p-2 rounded flex-1 max-w-md"
            />
            {filters.users.search && (
              <button onClick={() => setFilters({ ...filters, users: { search: '' } })} className="text-white/60 hover:text-white">
                Clear
              </button>
            )}
            <span className="text-white/40 text-sm">{filteredUsersDisplay.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Assigned</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsersDisplay.map(user => (
                  <tr key={user._id} className="border-b border-zinc-800">
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.firstName} {user.lastName}</td>
                    <td className="p-3 text-green-400">₹{user.totalPaid.toLocaleString()}</td>
                    <td className="p-3 text-yellow-400">₹{user.totalAssigned.toLocaleString()}</td>
                    <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setAssignPopup({ user, itemId: '', quantity: 1 })}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-sm"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {tab === 'items' && (
        <div>
          {/* Create Item Form */}
          <div className="bg-zinc-900 p-4 rounded mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Item</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Title"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                className="bg-zinc-800 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Description"
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                className="bg-zinc-800 p-2 rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                className="bg-zinc-800 p-2 rounded"
              />
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value as 'test' | 'interview' | 'course' })}
                className="bg-zinc-800 p-2 rounded"
              >
                <option value="interview">Interview</option>
                <option value="test">Test</option>
                <option value="course">Course</option>
              </select>
            </div>
            <button onClick={createItem} className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-white/90">
              Create Item
            </button>
          </div>

          {/* Filter */}
          <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center">
            <select
              value={filters.items.type}
              onChange={e => setFilters({ ...filters, items: { type: e.target.value as '' | 'test' | 'interview' | 'course' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Types</option>
              <option value="interview">Interview</option>
              <option value="test">Test</option>
              <option value="course">Course</option>
            </select>
            {filters.items.type && (
              <button onClick={() => setFilters({ ...filters, items: { type: '' } })} className="text-white/60 hover:text-white">
                Clear
              </button>
            )}
            <span className="text-white/40 text-sm">{filteredItemsDisplay.length} items</span>
          </div>

          {/* Items List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemsDisplay.map(item => (
                  <tr key={item._id} className="border-b border-zinc-800">
                    <td className="p-3">{item.title}</td>
                    <td className="p-3 text-white/60 text-sm">{item.description}</td>
                    <td className="p-3">₹{item.price}</td>
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteItem(item._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {tab === 'purchases' && (
        <div>
          {/* Filter */}
          <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center flex-wrap">
            <select
              value={filters.purchases.status}
              onChange={e => setFilters({ ...filters, purchases: { ...filters.purchases, status: e.target.value as '' | 'active' | 'completed' | 'expired' | 'cancelled' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {filters.purchases.status && (
              <button onClick={() => setFilters({ ...filters, purchases: { status: '' } })} className="text-white/60 hover:text-white">
                Clear
              </button>
            )}
            <span className="text-white/40 text-sm">{filteredPurchasesDisplay.length} purchases</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Used</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchasesDisplay.map(p => (
                  <tr key={p._id} className="border-b border-zinc-800">
                    <td className="p-3">{p.user?.email || 'N/A'}</td>
                    <td className="p-3">{p.item?.title || 'N/A'}</td>
                    <td className="p-3">{p.credits + p.creditsAssigned}</td>
                    <td className="p-3">{p.creditsUsed}</td>
                    <td className="p-3">₹{p.amount}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Tab - Combined Interviews and Tests */}
      {tab === 'results' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setResultsSubTab('interviews')}
              className={`px-4 py-2 rounded ${resultsSubTab === 'interviews' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              Interview Results
            </button>
            <button
              onClick={() => setResultsSubTab('tests')}
              className={`px-4 py-2 rounded ${resultsSubTab === 'tests' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              Test Results
            </button>
          </div>

          {/* Interview Results Sub-tab */}
          {resultsSubTab === 'interviews' && (
            <>
              {/* Filter */}
              <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center flex-wrap">
                <input
                  type="text"
                  placeholder="Search candidate or session..."
                  value={filters.interviews.search}
                  onChange={e => setFilters({ ...filters, interviews: { ...filters.interviews, search: e.target.value } })}
                  className="bg-zinc-800 p-2 rounded flex-1 max-w-xs"
                />
                <input
                  type="number"
                  placeholder="Min Score"
                  value={filters.interviews.minScore}
                  onChange={e => setFilters({ ...filters, interviews: { ...filters.interviews, minScore: e.target.value } })}
                  className="bg-zinc-800 p-2 rounded w-24"
                />
                <input
                  type="number"
                  placeholder="Max Score"
                  value={filters.interviews.maxScore}
                  onChange={e => setFilters({ ...filters, interviews: { ...filters.interviews, maxScore: e.target.value } })}
                  className="bg-zinc-800 p-2 rounded w-24"
                />
                {(filters.interviews.search || filters.interviews.minScore || filters.interviews.maxScore) && (
                  <button onClick={() => setFilters({ ...filters, interviews: { search: '', minScore: '', maxScore: '' } })} className="text-white/60 hover:text-white">
                    Clear
                  </button>
                )}
                <span className="text-white/40 text-sm">{filteredInterviewsDisplay.length} results</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviewsDisplay.map(i => (
                      <tr key={i._id} className="border-b border-zinc-800">
                        <td className="p-3 font-mono text-sm">{i.sessionId}</td>
                        <td className="p-3">{i.candidateName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded ${i.finalScore >= 70 ? 'bg-green-500/20 text-green-400' : i.finalScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {i.finalScore}/100
                          </span>
                        </td>
                        <td className="p-3">{new Date(i.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Test Results Sub-tab */}
          {resultsSubTab === 'tests' && (
            <>
              {/* Filter */}
              <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center flex-wrap">
                <input
                  type="text"
                  placeholder="Search candidate or email..."
                  value={filters.testResults.search}
                  onChange={e => setFilters({ ...filters, testResults: { ...filters.testResults, search: e.target.value } })}
                  className="bg-zinc-800 p-2 rounded flex-1 max-w-xs"
                />
                <select
                  value={filters.testResults.testId}
                  onChange={e => setFilters({ ...filters, testResults: { ...filters.testResults, testId: e.target.value } })}
                  className="bg-zinc-800 p-2 rounded"
                >
                  <option value="">All Tests</option>
                  {testItems.map(t => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
                <select
                  value={filters.testResults.status}
                  onChange={e => setFilters({ ...filters, testResults: { ...filters.testResults, status: e.target.value as '' | 'in_progress' | 'completed' | 'abandoned' } })}
                  className="bg-zinc-800 p-2 rounded"
                >
                  <option value="">All Status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
                {(filters.testResults.search || filters.testResults.testId || filters.testResults.status) && (
                  <button onClick={() => setFilters({ ...filters, testResults: { search: '', testId: '', status: '' } })} className="text-white/60 hover:text-white">
                    Clear
                  </button>
                )}
                <span className="text-white/40 text-sm">{filteredTestResultsDisplay.length} results</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Test</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Correct</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestResultsDisplay.map(r => (
                      <tr key={r._id} className="border-b border-zinc-800">
                        <td className="p-3">
                          <div>{r.candidateName}</div>
                          <div className="text-white/40 text-xs">{r.userId?.email}</div>
                        </td>
                        <td className="p-3">{r.testId?.title || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded ${r.percentageScore >= 70 ? 'bg-green-500/20 text-green-400' : r.percentageScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {r.percentageScore.toFixed(0)}%
                          </span>
                          <span className="text-white/40 text-xs ml-2">({r.totalScore}/{r.maxPossibleScore})</span>
                        </td>
                        <td className="p-3">{r.correctAnswers}/{r.totalQuestions}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            r.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div>
          {/* Create/Edit Question Form */}
          <div className="bg-zinc-900 p-4 rounded mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 mb-1">Question</label>
                <textarea
                  placeholder="Enter the interview question..."
                  value={editingQuestion ? editingQuestion.question : newQuestion.question}
                  onChange={e => editingQuestion
                    ? setEditingQuestion({ ...editingQuestion, question: e.target.value })
                    : setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                  className="w-full bg-zinc-800 p-2 rounded min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Expected Answer / Guidelines</label>
                <textarea
                  placeholder="Enter the expected answer or evaluation guidelines..."
                  value={editingQuestion ? editingQuestion.answer : newQuestion.answer}
                  onChange={e => editingQuestion
                    ? setEditingQuestion({ ...editingQuestion, answer: e.target.value })
                    : setNewQuestion({ ...newQuestion, answer: e.target.value })
                  }
                  className="w-full bg-zinc-800 p-2 rounded min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 mb-1">Category</label>
                  <select
                    value={editingQuestion ? editingQuestion.category : newQuestion.category}
                    onChange={e => editingQuestion
                      ? setEditingQuestion({ ...editingQuestion, category: e.target.value as 'maths' | 'behaviour' })
                      : setNewQuestion({ ...newQuestion, category: e.target.value as 'maths' | 'behaviour' })
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  >
                    <option value="maths">Maths</option>
                    <option value="behaviour">Behaviour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Difficulty</label>
                  <select
                    value={editingQuestion ? editingQuestion.difficulty : newQuestion.difficulty}
                    onChange={e => editingQuestion
                      ? setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                      : setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                {editingQuestion ? (
                  <>
                    <button
                      onClick={updateQuestion}
                      className="px-4 py-2 bg-white text-black rounded hover:bg-white/90"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={createQuestion}
                    className="px-4 py-2 bg-white text-black rounded hover:bg-white/90"
                  >
                    Add Question
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center flex-wrap">
            <select
              value={filters.questions.category}
              onChange={e => setFilters({ ...filters, questions: { ...filters.questions, category: e.target.value as '' | 'maths' | 'behaviour' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Categories</option>
              <option value="maths">Maths</option>
              <option value="behaviour">Behaviour</option>
            </select>
            <select
              value={filters.questions.difficulty}
              onChange={e => setFilters({ ...filters, questions: { ...filters.questions, difficulty: e.target.value as '' | 'easy' | 'medium' | 'hard' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={filters.questions.isActive}
              onChange={e => setFilters({ ...filters, questions: { ...filters.questions, isActive: e.target.value as '' | 'true' | 'false' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(filters.questions.category || filters.questions.difficulty || filters.questions.isActive) && (
              <button onClick={() => setFilters({ ...filters, questions: { category: '', difficulty: '', isActive: '' } })} className="text-white/60 hover:text-white">
                Clear
              </button>
            )}
            <span className="text-white/40 text-sm">{filteredQuestionsDisplay.length} questions</span>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {filteredQuestionsDisplay.map(q => (
              <div key={q._id} className={`bg-zinc-900 p-4 rounded ${!q.isActive ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${q.category === 'maths' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {q.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {q.difficulty}
                    </span>
                    {!q.isActive && (
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleQuestionActive(q._id)}
                      className={`text-xs px-2 py-1 rounded ${q.isActive ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                    >
                      {q.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestion(q._id)}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-white/60 text-sm">{q.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Questions Tab */}
      {tab === 'testQuestions' && (
        <div>
          {/* Create/Edit Test Question Form */}
          <div className="bg-zinc-900 p-4 rounded mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingTestQuestion ? 'Edit Test Question' : 'Add New Test Question'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 mb-1">Test</label>
                <select
                  value={editingTestQuestion ? (typeof editingTestQuestion.testId === 'object' ? editingTestQuestion.testId._id : editingTestQuestion.testId) : newTestQuestion.testId}
                  onChange={e => editingTestQuestion
                    ? setEditingTestQuestion({ ...editingTestQuestion, testId: e.target.value })
                    : setNewTestQuestion({ ...newTestQuestion, testId: e.target.value })
                  }
                  className="w-full bg-zinc-800 p-2 rounded"
                >
                  <option value="">Select a Test</option>
                  {testItems.map(t => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 mb-1">Question</label>
                <textarea
                  placeholder="Enter the test question..."
                  value={editingTestQuestion ? editingTestQuestion.question : newTestQuestion.question}
                  onChange={e => editingTestQuestion
                    ? setEditingTestQuestion({ ...editingTestQuestion, question: e.target.value })
                    : setNewTestQuestion({ ...newTestQuestion, question: e.target.value })
                  }
                  className="w-full bg-zinc-800 p-2 rounded min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Options</label>
                <div className="space-y-2">
                  {(editingTestQuestion ? editingTestQuestion.options : newTestQuestion.options).map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={(editingTestQuestion ? editingTestQuestion.correctAnswer : newTestQuestion.correctAnswer) === idx}
                        onChange={() => editingTestQuestion
                          ? setEditingTestQuestion({ ...editingTestQuestion, correctAnswer: idx })
                          : setNewTestQuestion({ ...newTestQuestion, correctAnswer: idx })
                        }
                        className="text-white"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...(editingTestQuestion ? editingTestQuestion.options : newTestQuestion.options)];
                          newOpts[idx] = e.target.value;
                          editingTestQuestion
                            ? setEditingTestQuestion({ ...editingTestQuestion, options: newOpts })
                            : setNewTestQuestion({ ...newTestQuestion, options: newOpts });
                        }}
                        className="flex-1 bg-zinc-800 p-2 rounded"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-1">Select the radio button for the correct answer</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 mb-1">Score</label>
                  <input
                    type="number"
                    min="0"
                    value={editingTestQuestion ? editingTestQuestion.score : newTestQuestion.score}
                    onChange={e => editingTestQuestion
                      ? setEditingTestQuestion({ ...editingTestQuestion, score: Number(e.target.value) })
                      : setNewTestQuestion({ ...newTestQuestion, score: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Category</label>
                  <select
                    value={editingTestQuestion ? editingTestQuestion.category : newTestQuestion.category}
                    onChange={e => editingTestQuestion
                      ? setEditingTestQuestion({ ...editingTestQuestion, category: e.target.value as 'maths' | 'reasoning' })
                      : setNewTestQuestion({ ...newTestQuestion, category: e.target.value as 'maths' | 'reasoning' })
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  >
                    <option value="maths">Maths</option>
                    <option value="reasoning">Reasoning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Difficulty</label>
                  <select
                    value={editingTestQuestion ? editingTestQuestion.difficulty : newTestQuestion.difficulty}
                    onChange={e => editingTestQuestion
                      ? setEditingTestQuestion({ ...editingTestQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                      : setNewTestQuestion({ ...newTestQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
                    }
                    className="w-full bg-zinc-800 p-2 rounded"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                {editingTestQuestion ? (
                  <>
                    <button
                      onClick={updateTestQuestion}
                      className="px-4 py-2 bg-white text-black rounded hover:bg-white/90"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingTestQuestion(null)}
                      className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={createTestQuestion}
                    className="px-4 py-2 bg-white text-black rounded hover:bg-white/90"
                  >
                    Add Question
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-zinc-900 p-4 rounded mb-4 flex gap-4 items-center flex-wrap">
            <select
              value={filters.testQuestions.testId}
              onChange={e => setFilters({ ...filters, testQuestions: { ...filters.testQuestions, testId: e.target.value } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Tests</option>
              {testItems.map(t => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
            <select
              value={filters.testQuestions.category}
              onChange={e => setFilters({ ...filters, testQuestions: { ...filters.testQuestions, category: e.target.value as '' | 'maths' | 'reasoning' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Categories</option>
              <option value="maths">Maths</option>
              <option value="reasoning">Reasoning</option>
            </select>
            <select
              value={filters.testQuestions.difficulty}
              onChange={e => setFilters({ ...filters, testQuestions: { ...filters.testQuestions, difficulty: e.target.value as '' | 'easy' | 'medium' | 'hard' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={filters.testQuestions.isActive}
              onChange={e => setFilters({ ...filters, testQuestions: { ...filters.testQuestions, isActive: e.target.value as '' | 'true' | 'false' } })}
              className="bg-zinc-800 p-2 rounded"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(filters.testQuestions.testId || filters.testQuestions.category || filters.testQuestions.difficulty || filters.testQuestions.isActive) && (
              <button onClick={() => setFilters({ ...filters, testQuestions: { testId: '', category: '', difficulty: '', isActive: '' } })} className="text-white/60 hover:text-white">
                Clear
              </button>
            )}
            <span className="text-white/40 text-sm">{filteredTestQuestionsDisplay.length} questions</span>
          </div>

          {/* Test Questions List */}
          <div className="space-y-3">
            {filteredTestQuestionsDisplay.map(q => (
              <div key={q._id} className={`bg-zinc-900 p-4 rounded ${!q.isActive ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                      {typeof q.testId === 'object' ? q.testId.title : 'Unknown Test'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${q.category === 'maths' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {q.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">
                      {q.score} pts
                    </span>
                    {!q.isActive && (
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTestQuestionActive(q._id)}
                      className={`text-xs px-2 py-1 rounded ${q.isActive ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                    >
                      {q.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setEditingTestQuestion(q)}
                      className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTestQuestion(q._id)}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="font-medium mb-2">{q.question}</p>
                <div className="space-y-1">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className={`text-sm px-2 py-1 rounded ${idx === q.correctAnswer ? 'bg-green-500/20 text-green-400' : 'text-white/60'}`}>
                      {idx === q.correctAnswer ? '✓ ' : '  '}{opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Assign Popup Modal */}
      {assignPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Item to {assignPopup.user.email}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 mb-1">Item</label>
                <select
                  value={assignPopup.itemId}
                  onChange={e => setAssignPopup({ ...assignPopup, itemId: e.target.value })}
                  className="w-full bg-zinc-800 p-2 rounded"
                >
                  <option value="">Select Item</option>
                  {items.map(i => (
                    <option key={i._id} value={i._id}>{i.title} ({i.type}) - ₹{i.price}</option>
                  ))}
                </select>
                {assignPopup.itemId && (
                  <p className="text-white/40 text-xs mt-1">
                    {items.find(i => i._id === assignPopup.itemId)?.type === 'interview'
                      ? 'Interviews are single-use per purchase'
                      : items.find(i => i._id === assignPopup.itemId)?.type === 'test'
                      ? 'Tests have unlimited access after purchase'
                      : ''}
                  </p>
                )}
              </div>
              {items.find(i => i._id === assignPopup.itemId)?.type === 'interview' && (
                <div>
                  <label className="block text-white/60 mb-1">Number of Interviews to Assign</label>
                  <input
                    type="number"
                    value={assignPopup.quantity}
                    onChange={e => setAssignPopup({ ...assignPopup, quantity: Number(e.target.value) })}
                    className="w-full bg-zinc-800 p-2 rounded"
                    min={1}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={assignItemToUser}
                  disabled={!assignPopup.itemId}
                  className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {items.find(i => i._id === assignPopup.itemId)?.type === 'interview'
                    ? 'Assign Interviews'
                    : items.find(i => i._id === assignPopup.itemId)?.type === 'test'
                    ? 'Grant Test Access'
                    : 'Assign Item'}
                </button>
                <button
                  onClick={() => setAssignPopup(null)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
