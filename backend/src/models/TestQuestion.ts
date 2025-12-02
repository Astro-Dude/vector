import mongoose, { Document, Schema } from 'mongoose';

export interface ITestQuestion extends Document {
  testId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  score: number;
  category: 'maths' | 'reasoning';
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testQuestionSchema = new Schema<ITestQuestion>({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length >= 2,
      message: 'At least 2 options are required'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  category: {
    type: String,
    required: true,
    enum: ['maths', 'reasoning']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
testQuestionSchema.index({ testId: 1, isActive: 1 });
testQuestionSchema.index({ testId: 1, category: 1 });

export default mongoose.model<ITestQuestion>('TestQuestion', testQuestionSchema);
