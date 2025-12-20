import mongoose, { Document, Schema } from 'mongoose';

export interface IScores {
  correctness: number;
  reasoning: number;
  clarity: number;
  problemSolving: number;
}

export interface IScoreReasons {
  correctness?: string;
  reasoning?: string;
  clarity?: string;
  problemSolving?: string;
}

export interface IFollowUpResult {
  question: string;
  answer: string;
  wasHint: boolean;
}

export interface IIntroductionExchange {
  question: string;
  answer: string;
}

export interface IIntroduction {
  initialQuestion: string;
  initialAnswer: string;
  followUps: IIntroductionExchange[];
  feedback?: string; // Qualitative feedback on self-introduction (no scores)
}

export interface IQuestionResult {
  question: string;
  answer: string;
  normalizedAnswer?: string;
  followUpQuestions?: IFollowUpResult[];
  scores: IScores;
  scoreReasons?: IScoreReasons;
  total: number;
  feedback: {
    whatWentRight: string[];
    needsImprovement: string[];
  };
  detailedFeedback?: string; // Comprehensive improvement suggestions (markdown)
}

export interface IOverallFeedback {
  strengths: string[];
  improvementAreas: string[];
  suggestedNextSteps: string[];
}

export interface IInterviewResult extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  candidateName: string;
  introduction?: IIntroduction;
  questions: IQuestionResult[];
  finalScore: number;
  overallFeedback: IOverallFeedback;
  startedAt: Date;
  completedAt: Date;
  status?: 'complete' | 'incomplete';
  questionsAnswered?: number;
  totalQuestions?: number;
  createdAt: Date;
  updatedAt: Date;
}

const scoresSchema = new Schema<IScores>({
  correctness: { type: Number, required: true, min: 0, max: 5 },
  reasoning: { type: Number, required: true, min: 0, max: 5 },
  clarity: { type: Number, required: true, min: 0, max: 5 },
  problemSolving: { type: Number, required: true, min: 0, max: 5 }
}, { _id: false });

const scoreReasonsSchema = new Schema<IScoreReasons>({
  correctness: { type: String },
  reasoning: { type: String },
  clarity: { type: String },
  problemSolving: { type: String }
}, { _id: false });

const followUpResultSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  wasHint: { type: Boolean, default: false }
}, { _id: false });

const introductionExchangeSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const introductionSchema = new Schema({
  initialQuestion: { type: String, required: true },
  initialAnswer: { type: String, required: true },
  followUps: [introductionExchangeSchema],
  feedback: { type: String }
}, { _id: false });

const questionResultSchema = new Schema<IQuestionResult>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  normalizedAnswer: { type: String },
  followUpQuestions: [followUpResultSchema],
  scores: { type: scoresSchema, required: true },
  scoreReasons: { type: scoreReasonsSchema },
  total: { type: Number, required: true, min: 0, max: 10 },
  feedback: {
    whatWentRight: [{ type: String }],
    needsImprovement: [{ type: String }]
  },
  detailedFeedback: { type: String } // Comprehensive improvement suggestions (markdown)
}, { _id: false });

const overallFeedbackSchema = new Schema<IOverallFeedback>({
  strengths: [{ type: String }],
  improvementAreas: [{ type: String }],
  suggestedNextSteps: [{ type: String }]
}, { _id: false });

const interviewResultSchema = new Schema<IInterviewResult>({
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
  candidateName: {
    type: String,
    required: true
  },
  introduction: {
    type: introductionSchema,
    required: false
  },
  questions: [questionResultSchema],
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  overallFeedback: {
    type: overallFeedbackSchema,
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['complete', 'incomplete'],
    default: 'complete'
  },
  questionsAnswered: {
    type: Number
  },
  totalQuestions: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
// Note: sessionId already has unique: true which creates an index automatically
interviewResultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IInterviewResult>('InterviewResult', interviewResultSchema);
