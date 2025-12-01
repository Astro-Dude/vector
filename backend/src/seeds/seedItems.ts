import 'dotenv/config';
import mongoose from 'mongoose';
import Item from '../models/Item.js';

const items = [
  {
    title: 'AI Interview',
    description: 'Practice your interview skills with our AI-powered interviewer. Get real-time feedback on your answers, covering both technical (maths) and behavioural questions. Receive a detailed performance report with scores and actionable improvement suggestions.',
    price: 99,
    type: 'interview',
    duration: '15-20 minutes',
    level: 'Intermediate',
    isActive: true
  }
];

async function seedItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vector');
    console.log('MongoDB connected');

    // Check if AI Interview already exists
    const existingItem = await Item.findOne({ title: 'AI Interview' });

    if (existingItem) {
      console.log('AI Interview item already exists, updating...');
      await Item.updateOne({ title: 'AI Interview' }, items[0]);
      console.log('AI Interview item updated');
    } else {
      const result = await Item.insertMany(items);
      console.log(`Successfully inserted ${result.length} item(s)`);
    }

    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
}

seedItems();
