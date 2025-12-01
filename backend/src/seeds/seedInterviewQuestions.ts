import 'dotenv/config';
import mongoose from 'mongoose';
import InterviewQuestion from '../models/InterviewQuestion.js';

const questions = [
  // MATHS QUESTIONS
  {
    question: 'Consider the expression 7679×3421. Determine the digit in the units (ones) place of the resulting product.',
    answer: '9',
    category: 'maths',
    difficulty: 'easy'
  },
  {
    question: `At SST, a candidate must first clear the NSET exam to qualify for an interview. Assume the following:
• The probability of a candidate clearing the NSET exam (event E) is 10% (P(E) = 0.10).
• Given that a candidate clears the exam, the probability of passing the interview (event I) is 37% (P(I | E) = 0.37).
• A candidate is selected (event S) only if they clear the exam and pass the interview, so: P(S) = P(E) × P(I | E) = 0.10 × 0.37 = 0.037 (or 3.7%).
If a candidate is not selected (i.e., they do not get into SST), what is the probability that they had actually cleared the NSET exam?`,
    answer: '0.0654 ~ 6.5%',
    category: 'maths',
    difficulty: 'hard'
  },
  {
    question: 'A project manager has a budget of $20,000 to allocate four different project initiatives, each requiring funding in multiples of $1000. Determine how many distinct ways the total budget can be completely utilized across the initiatives ensuring that every dollar is allocated.',
    answer: '1771',
    category: 'maths',
    difficulty: 'medium'
  },
  {
    question: 'What is the sum of all integers from 1 to 100?',
    answer: '5050 (using the formula n(n+1)/2 = 100×101/2)',
    category: 'maths',
    difficulty: 'easy'
  },
  {
    question: 'A train travels from city A to city B at 60 km/h and returns at 40 km/h. What is the average speed for the entire journey?',
    answer: '48 km/h (harmonic mean: 2×60×40/(60+40))',
    category: 'maths',
    difficulty: 'medium'
  },
  {
    question: 'If you have a 3x3 grid and need to go from the bottom-left corner to the top-right corner by only moving up or right, how many unique paths are there?',
    answer: '6 (C(4,2) = 6, choosing 2 right moves out of 4 total moves)',
    category: 'maths',
    difficulty: 'medium'
  },
  {
    question: 'A fair coin is tossed 5 times. What is the probability of getting exactly 3 heads?',
    answer: '10/32 or 5/16 or 31.25% (C(5,3) × (1/2)^5)',
    category: 'maths',
    difficulty: 'medium'
  },
  {
    question: 'What is the remainder when 2^100 is divided by 7?',
    answer: '2 (using Fermat\'s little theorem: 2^6 ≡ 1 mod 7, so 2^100 = 2^(6×16+4) ≡ 2^4 = 16 ≡ 2 mod 7)',
    category: 'maths',
    difficulty: 'hard'
  },

  // BEHAVIOUR QUESTIONS
  {
    question: 'Tell me about a time when you faced a significant challenge. How did you approach it and what was the outcome?',
    answer: 'Look for: Problem identification, systematic approach, perseverance, learning from the experience',
    category: 'behaviour',
    difficulty: 'medium'
  },
  {
    question: 'Describe a situation where you had to work with someone whose working style was very different from yours. How did you handle it?',
    answer: 'Look for: Adaptability, communication skills, respect for differences, collaboration',
    category: 'behaviour',
    difficulty: 'medium'
  },
  {
    question: 'Give an example of when you had to make a decision with incomplete information. What was your thought process?',
    answer: 'Look for: Risk assessment, analytical thinking, decision-making under uncertainty, accountability',
    category: 'behaviour',
    difficulty: 'hard'
  },
  {
    question: 'Tell me about a time when you received critical feedback. How did you respond?',
    answer: 'Look for: Emotional intelligence, growth mindset, ability to separate self from criticism, concrete actions taken',
    category: 'behaviour',
    difficulty: 'medium'
  },
  {
    question: 'Describe a project where you had to learn something completely new in a short time. How did you approach the learning?',
    answer: 'Look for: Learning strategies, resourcefulness, time management, ability to apply new knowledge',
    category: 'behaviour',
    difficulty: 'easy'
  },
  {
    question: 'What motivates you to do your best work? Can you give a specific example?',
    answer: 'Look for: Self-awareness, intrinsic motivation, alignment with values, concrete examples',
    category: 'behaviour',
    difficulty: 'easy'
  },
  {
    question: 'Tell me about a time when you had to persuade others to see things your way. What approach did you take?',
    answer: 'Look for: Communication skills, empathy, logical argumentation, respect for others\' viewpoints',
    category: 'behaviour',
    difficulty: 'medium'
  },
  {
    question: 'Describe a situation where you failed at something. What did you learn from it?',
    answer: 'Look for: Honesty, accountability, growth mindset, concrete lessons learned and applied',
    category: 'behaviour',
    difficulty: 'medium'
  }
];

async function seedQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vector');
    console.log('MongoDB connected');

    // Clear existing questions (optional - remove if you want to append)
    await InterviewQuestion.deleteMany({});
    console.log('Cleared existing interview questions');

    // Insert new questions
    const result = await InterviewQuestion.insertMany(questions);
    console.log(`Successfully inserted ${result.length} interview questions`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
