import nsetQuestions from './nsetQuestions';
import mock1 from './mock1';

// Import other question sets when they're ready


// Define test IDs as constants for consistency
export const TEST_IDS = {
  SAMPLE: 'nset-sample',
  MOCK_TEST_1: 'mock1',
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
    passScore: 35,
    isFree: true,
    testComponents: testComponents
  },
  
  [TEST_IDS.MOCK_TEST_1]: {
    questions: mock1,
    testName: "NSET 2024 Mock Test 1",
    testDuration: 120,
    totalQuestions: 1,
    passScore: 35,
    isFree: false,
    price: 49,
    testComponents: testComponents
  },
};

// Helper function to format price with currency symbol
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '';
  return `₹${price}`;
};

// Helper function to get a test configuration by ID
export const getTestConfigById = (testId) => {
  return testConfigs[testId] || null;
}; 