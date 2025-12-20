import mongoose, { Document, Schema } from 'mongoose';

export interface ITestQuestionResult {
  questionId: mongoose.Types.ObjectId;
  question: string;
  type: 'mcq' | 'short';
  options: string[];
  note?: string;
  selectedAnswer: number | string; // number for MCQ (index), string for short answer
  correctAnswer: number | string;
  isCorrect: boolean;
  maxScore: number;
  scoreAwarded: number;
  timeTaken?: number;
}

export interface ITestResult extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  testId: mongoose.Types.ObjectId;
  candidateName: string;
  questions: ITestQuestionResult[];
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  timeTaken: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const testQuestionResultSchema = new Schema<ITestQuestionResult>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'short'],
    default: 'mcq'
  },
  options: {
    type: [String],
    default: []
  },
  note: {
    type: String
  },
  selectedAnswer: {
    type: Schema.Types.Mixed, // number for MCQ, string for short answer
    required: true
  },
  correctAnswer: {
    type: Schema.Types.Mixed, // number for MCQ, string for short answer
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  scoreAwarded: {
    type: Number,
    required: true,
    default: 0
  },
  timeTaken: {
    type: Number
  }
}, { _id: false });

const testResultSchema = new Schema<ITestResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  questions: [testQuestionResultSchema],
  totalQuestions: {
    type: Number,
    required: true,
    min: 0
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxPossibleScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentageScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeTaken: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
testResultSchema.index({ userId: 1 });
testResultSchema.index({ testId: 1 });
testResultSchema.index({ sessionId: 1 });
testResultSchema.index({ userId: 1, testId: 1 });

export default mongoose.model<ITestResult>('TestResult', testResultSchema);
