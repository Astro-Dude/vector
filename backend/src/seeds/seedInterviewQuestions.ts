import 'dotenv/config';
import mongoose from 'mongoose';
import InterviewQuestion from '../models/InterviewQuestion.js';

const questions = [
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
