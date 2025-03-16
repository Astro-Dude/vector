// Mock data for the NSET sample test
const sampleTestData = {
  id: "sample-test-1",
  title: "NSET Free Sample Test",
  description: "A sample test to help you prepare for the Scaler School of Technology entrance exam.",
  duration: 60, // in minutes
  questions: [
    {
      id: "q1",
      questionText: "What is the time complexity of binary search algorithm?",
      type: "mcq",
      category: "Computer Science",
      options: [
        { id: "q1_a", text: "O(n)" },
        { id: "q1_b", text: "O(log n)" },
        { id: "q1_c", text: "O(n log n)" },
        { id: "q1_d", text: "O(n²)" }
      ],
      correctOptionId: "q1_b",
      explanation: "Binary search has a time complexity of O(log n) because it divides the search interval in half with each step."
    },
    {
      id: "q2",
      questionText: "If f(x) = 3x² + 2x - 5, what is f'(x)?",
      type: "mcq",
      category: "Quantitative Aptitude",
      options: [
        { id: "q2_a", text: "6x + 2" },
        { id: "q2_b", text: "3x² + 2" },
        { id: "q2_c", text: "6x² + 2x" },
        { id: "q2_d", text: "3x + 2" }
      ],
      correctOptionId: "q2_a",
      explanation: "The derivative of f(x) = 3x² + 2x - 5 is f'(x) = 6x + 2."
    },
    {
      id: "q3",
      questionText: "In a syllogism, if all A are B, and all B are C, then:",
      type: "mcq",
      category: "Logical Reasoning",
      options: [
        { id: "q3_a", text: "All A are C" },
        { id: "q3_b", text: "Some A are C" },
        { id: "q3_c", text: "No A are C" },
        { id: "q3_d", text: "Cannot be determined" }
      ],
      correctOptionId: "q3_a",
      explanation: "This is a valid syllogism. If all A are B, and all B are C, then all A are also C."
    },
    {
      id: "q4",
      questionText: "Which data structure is used for implementing recursion?",
      type: "mcq",
      category: "Computer Science",
      options: [
        { id: "q4_a", text: "Queue" },
        { id: "q4_b", text: "Stack" },
        { id: "q4_c", text: "Array" },
        { id: "q4_d", text: "Linked List" }
      ],
      correctOptionId: "q4_b",
      explanation: "A stack is used to implement recursion. Function calls are stored in a stack and the most recently called function is executed first."
    },
    {
      id: "q5",
      questionText: "Find the value of x: log₁₀(x) + log₁₀(4x) = log₁₀(30)",
      type: "mcq",
      category: "Quantitative Aptitude",
      options: [
        { id: "q5_a", text: "1" },
        { id: "q5_b", text: "2.5" },
        { id: "q5_c", text: "3" },
        { id: "q5_d", text: "5" }
      ],
      correctOptionId: "q5_b",
      explanation: "Using the property log(a) + log(b) = log(ab), we get log₁₀(x) + log₁₀(4x) = log₁₀(4x²) = log₁₀(30). Solving, 4x² = 30, so x² = 7.5, therefore x = 2.5 (taking positive value)."
    },
    {
      id: "q6",
      questionText: "Choose the word that is a synonym of 'Ephemeral':",
      type: "mcq",
      category: "Verbal Ability",
      options: [
        { id: "q6_a", text: "Lasting" },
        { id: "q6_b", text: "Transient" },
        { id: "q6_c", text: "Eternal" },
        { id: "q6_d", text: "Significant" }
      ],
      correctOptionId: "q6_b",
      explanation: "'Ephemeral' means short-lived or transient. The opposite would be 'permanent' or 'lasting'."
    },
    {
      id: "q7",
      questionText: "If A → B, B → C, and A → C is valid, this is an example of:",
      type: "mcq",
      category: "Logical Reasoning",
      options: [
        { id: "q7_a", text: "Transitivity" },
        { id: "q7_b", text: "Reflexivity" },
        { id: "q7_c", text: "Symmetry" },
        { id: "q7_d", text: "Equivalence" }
      ],
      correctOptionId: "q7_a",
      explanation: "Transitivity is a logical property: if a relation R has the property that whenever xRy and yRz, then xRz, the relation is transitive."
    },
    {
      id: "q8",
      questionText: "What is the primary difference between process and thread?",
      type: "mcq",
      category: "Computer Science",
      options: [
        { id: "q8_a", text: "Processes share memory while threads do not" },
        { id: "q8_b", text: "Threads share memory while processes do not" },
        { id: "q8_c", text: "Both processes and threads have their own memory space" },
        { id: "q8_d", text: "None of the above" }
      ],
      correctOptionId: "q8_b",
      explanation: "Threads within the same process share the memory space of the process, while different processes have their own separate memory spaces."
    },
    {
      id: "q9",
      questionText: "In a sequence, if the 5th term is 26 and the 8th term is 50, find the 12th term. (The sequence is arithmetic.)",
      type: "mcq",
      category: "Quantitative Aptitude",
      options: [
        { id: "q9_a", text: "74" },
        { id: "q9_b", text: "82" },
        { id: "q9_c", text: "86" },
        { id: "q9_d", text: "90" }
      ],
      correctOptionId: "q9_b",
      explanation: "For an arithmetic sequence, a₈ - a₅ = 3d where d is the common difference. So 50 - 26 = 3d, therefore d = 8. The 12th term = a₅ + 7d = 26 + 7(8) = 26 + 56 = 82."
    },
    {
      id: "q10",
      questionText: "Choose the correct meaning of the idiom: 'To bite the dust'",
      type: "mcq",
      category: "Verbal Ability",
      options: [
        { id: "q10_a", text: "To eat dirt" },
        { id: "q10_b", text: "To be defeated" },
        { id: "q10_c", text: "To die of thirst" },
        { id: "q10_d", text: "To clean thoroughly" }
      ],
      correctOptionId: "q10_b",
      explanation: "The idiom 'to bite the dust' means to be defeated or to fail at something."
    },
    {
      id: "q11",
      questionText: "In the series 1, 3, 6, 10, 15, ..., what is the next number?",
      type: "mcq",
      category: "Logical Reasoning",
      options: [
        { id: "q11_a", text: "18" },
        { id: "q11_b", text: "20" },
        { id: "q11_c", text: "21" },
        { id: "q11_d", text: "24" }
      ],
      correctOptionId: "q11_c",
      explanation: "This is a triangular number sequence where each number is the sum of the first n natural numbers. The differences between consecutive terms are 2, 3, 4, 5, so the next difference is 6, making the next number 15 + 6 = 21."
    },
    {
      id: "q12",
      questionText: "What is the worst-case space complexity of merge sort algorithm?",
      type: "mcq",
      category: "Computer Science",
      options: [
        { id: "q12_a", text: "O(1)" },
        { id: "q12_b", text: "O(log n)" },
        { id: "q12_c", text: "O(n)" },
        { id: "q12_d", text: "O(n log n)" }
      ],
      correctOptionId: "q12_c",
      explanation: "Merge sort requires O(n) extra space for the temporary arrays used during merging."
    },
    {
      id: "q13",
      questionText: "If a train travels at 40 km/hr for half the time and at 60 km/hr for the other half, what is its average speed for the entire journey?",
      type: "mcq",
      category: "Quantitative Aptitude",
      options: [
        { id: "q13_a", text: "45 km/hr" },
        { id: "q13_b", text: "48 km/hr" },
        { id: "q13_c", text: "50 km/hr" },
        { id: "q13_d", text: "52 km/hr" }
      ],
      correctOptionId: "q13_b",
      explanation: "When traveling at different speeds for equal times, the average speed is the harmonic mean: 2/(1/40 + 1/60) = 2/(5/120) = 2 × 120/5 = 48 km/hr."
    },
    {
      id: "q14",
      questionText: "Identify the correct sentence:",
      type: "mcq",
      category: "Verbal Ability",
      options: [
        { id: "q14_a", text: "Neither of the students have completed their assignment." },
        { id: "q14_b", text: "Neither of the students has completed their assignment." },
        { id: "q14_c", text: "Neither of the students have completed his assignment." },
        { id: "q14_d", text: "Neither of the students has completed his assignment." }
      ],
      correctOptionId: "q14_b",
      explanation: "'Neither' is singular, so it takes the singular verb 'has'. The possessive pronoun 'their' is used as a gender-neutral singular in modern English."
    },
    {
      id: "q15",
      questionText: "If all Boobles are Snazzles, and some Snazzles are Whizzles, which of the following must be true?",
      type: "mcq",
      category: "Logical Reasoning",
      options: [
        { id: "q15_a", text: "All Boobles are Whizzles" },
        { id: "q15_b", text: "Some Boobles are Whizzles" },
        { id: "q15_c", text: "No Boobles are Whizzles" },
        { id: "q15_d", text: "None of the above" }
      ],
      correctOptionId: "q15_d",
      explanation: "From the given premises, we cannot definitively determine any relationship between Boobles and Whizzles. Some Boobles may be Whizzles if they are among the Snazzles that are Whizzles, but it's also possible that no Boobles are Whizzles."
    }
  ]
};

export default sampleTestData; 