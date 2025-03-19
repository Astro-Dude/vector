/**
 * NSET Sample Questions
 * This file contains questions for the NSET exam preparation
 */

const nsetQuestions = [
  {
    id: "q1",
    questionText: "(direction sense) A circular dial of an analog clock is placed in such a way that the minute hand points towards South at 12 noon. At what time between 9 and 10 am the minute hand will point towards South East?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "09:52:30",
    options: [],
    explanation: "At 12 noon, the minute hand points South. One complete rotation is 360° in 60 minutes, so it moves at 6° per minute. South East is 135° from North, or 45° from South. To move 45° at 6° per minute takes 45/6 = 7.5 minutes. So the time is 09:45 + 7.5 minutes = 09:52:30."
  },
  {
    id: "q2",
    questionText: "(coding-decoding) In a coded language if TIGER is written as 25799 and LION is written as 3569, what will be CRICKET?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q3",
    questionText: "(clocks) At what time between 5:30 and 6:00 p.m. does the hour and minute make 90 degrees?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "05:43:38",
    options: []
  },
  {
    id: "q4",
    questionText: "(PnC) The number of 4 digit numbers such that the first two digits and the last two digits are prime number and their sum is 102 and their is no 0 in the number",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q5",
    questionText: "(math) If n represent a positive number such that n²+10n is a perfect square, then number of values of n the satisfy this is?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q6",
    questionText: "(probability) There are 7 Red and 5 Blue in a bag, if 2 balls are picked from the bag without replacement, what is the probability of both balls being Red?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "7C2/12C2",
    options: []
  },
  {
    id: "q7",
    questionText: "(math) There is a 3*3 matrix that can be filled with numbers from 0-9 in such a way that their sum horizontally it vertically is a prime number then at most how many summations result can be a prime number",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q8",
    questionText: "(probability) A box has 2 Black, 3 Red, 5 White balls. If 5 balls are picked with replacement what is the probability that white ball is picked exactly twice",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q9",
    questionText: "(PnC) Number of ways to put 10 books in two identical boxes with exactly 5 in each box",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "10C5/2",
    options: []
  },
  {
    id: "q10",
    questionText: "(PnC) Also see the highest power of 2 in the 200! or 200C100",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q11",
    questionText: "(log) if log 25 to base 3 / log 5 to base 7 = log n to base 3 / log 2 root 2 to base 7 then value of n is?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q12",
    questionText: "(syllogism) similar to syllogism in which the give around 5 statement name as A,B,C,D,E and conclusion like if A+C is correct than d is correct or not. like that",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q13",
    questionText: "(Investing) P invests ₹30,000 for 6 months, A invests ₹40,000 for 12 months, and R invests ₹50,000 from the 4th month to the 12th month. After an overall profit of ₹125,000, ₹20,000 is set aside for an emergency fund. What will be the profit of P?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q14",
    questionText: "(ratio) Milkman has 2 cans of milk. 1st can milk and water ratio 3 : 2 and 2nd can 4 : 1. He mixes 15 litres from 1st can with 20 litres from second in large container. What's volume of milk in litres in the resulting mixture?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q15",
    questionText: "(PnC) How many 4 digits of ATM pin are there in which 2 first are ab second 2 are cd, ab and cd are prime numbers and ab+cd=102",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q16",
    questionText: "(percentage) Question from interest in which there are 3 friend who invested in parts 2 start than 1 friend joined after 3 month than 2nd friend leave investment after 9 month and in the end of a year they earn some profit take 20,000 for reinvest and remaining divide",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q17",
    questionText: "(number theory) A 3 digit number which is divisible by 7 but when divided with 23 leaves a remainder of 3",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  },
  {
    id: "q18",
    questionText: "(sets) Out of 50 each required to choose one language and sport. 20 choose French, 20 cricket, 12 German and cricket. How many choose French and football?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "12",
    options: []
  },
  {
    id: "q19",
    questionText: "(IQ) 100 spectators. 55 watched on 1st day, 65 on 2nd, 75 on 3rd. What is the maximum number of spectators who watched all the matches in all three days?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "45",
    options: []
  },
  {
    id: "q20",
    questionText: "(series) Complete sequence: 11, 13, 23, 53, 121, 251, ?",
    type: "text",
    category: "Reasoning",
    correctAnswer: "",
    options: []
  },
  {
    id: "q21",
    questionText: "(PnC) What is the rank of the word 'ELBOW'?",
    type: "text",
    category: "Quantitative Aptitude",
    correctAnswer: "",
    options: []
  }
];

export default nsetQuestions; 