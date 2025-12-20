import mongoose, { Document, Schema } from 'mongoose';

export interface ITestQuestion extends Document {
  testId: mongoose.Types.ObjectId;
  question: string;
  type: 'mcq' | 'short';
  options: string[];
  correctAnswer: number | string; // number for MCQ (index), string for short answer
  note?: string; // Optional note/hint to display with the question
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
  type: {
    type: String,
    enum: ['mcq', 'short'],
    default: 'mcq'
  },
  options: {
    type: [String],
    default: [],
    validate: {
      validator: function(this: ITestQuestion, v: string[]) {
        // MCQ requires at least 2 options, short answer can have none
        return this.type === 'short' || v.length >= 2;
      },
      message: 'MCQ questions require at least 2 options'
    }
  },
  correctAnswer: {
    type: Schema.Types.Mixed, // number for MCQ, string for short answer
    required: true
  },
  note: {
    type: String,
    trim: true
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
