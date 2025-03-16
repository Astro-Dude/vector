import nsetQuestions from './nsetQuestions';

// Import other question sets when they're ready
// You can uncomment these lines when you create the question files
// import mockTest1Questions from './mockTest1Questions';
// import mockTest2Questions from './mockTest2Questions';

// Define test IDs as constants for consistency
export const TEST_IDS = {
  SAMPLE: 'nset-sample',
  MOCK_TEST_1: 'nset-mock-1',
  MOCK_TEST_2: 'nset-mock-2',
};

// Define test components that will be shown in the MockTestStart page
const testComponents = [
  {
    name: "Quantitative Aptitude",
    description: "Probability & statistics, permutation & combination, number theory, ratios & percentages, exponentials & logarithms, sets (venn diagrams).",
    bgColor: "bg-blue-50",
    textColor: "text-blue-800"
  },
  {
    name: "Logical Reasoning",
    description: "Direction sense, coding-decoding, clocks & calendars, series, blood Relations, & family Tree, syllogism, simple and compound interest, puzzles, seating arrangements.",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-800"
  }
];

// Placeholder questions to use until real questions are available
export const placeholderQuestions = [
  {
    id: 'placeholder-1',
    questionText: 'This is a placeholder question. Real questions will be added soon.',
    type: 'mcq',
    correctAnswer: 'a',
    options: [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
      { id: 'c', text: 'Option C' }
    ]
  }
];

// Main test configuration object
export const testConfigs = {
  [TEST_IDS.SAMPLE]: {
    questions: nsetQuestions,
    testName: "NSET Free Sample Test",
    testDuration: 120,
    totalQuestions: 21,
    passScore: 60,
    isFree: true,
    testComponents: testComponents
  },
  
  [TEST_IDS.MOCK_TEST_1]: {
    // Use placeholder questions until real ones are available
    questions: placeholderQuestions,
    testName: "NSET 2024 Mock Test 1",
    testDuration: 120,
    totalQuestions: 50,
    passScore: 70,
    isFree: false,
    price: '₹499',
    testComponents: testComponents
  },
  
  [TEST_IDS.MOCK_TEST_2]: {
    // Use placeholder questions until real ones are available
    questions: placeholderQuestions,
    testName: "NSET 2024 Mock Test 2",
    testDuration: 120,
    totalQuestions: 50,
    passScore: 70,
    isFree: false,
    price: '₹499',
    testComponents: testComponents
  }
};

// Helper function to get a test configuration by ID
export const getTestConfigById = (testId) => {
  return testConfigs[testId] || null;
}; 