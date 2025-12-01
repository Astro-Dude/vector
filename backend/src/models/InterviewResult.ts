import mongoose, { Document, Schema } from 'mongoose';

export interface IScores {
  correctness: number;
  reasoning: number;
  clarity: number;
  problemSolving: number;
}

export interface IQuestionResult {
  question: string;
  answer: string;
  scores: IScores;
  total: number;
  feedback: {
    whatWentRight: string[];
    needsImprovement: string[];
  };
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
  questions: IQuestionResult[];
  finalScore: number;
  overallFeedback: IOverallFeedback;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scoresSchema = new Schema<IScores>({
  correctness: { type: Number, required: true, min: 0, max: 5 },
  reasoning: { type: Number, required: true, min: 0, max: 5 },
  clarity: { type: Number, required: true, min: 0, max: 5 },
  problemSolving: { type: Number, required: true, min: 0, max: 5 }
}, { _id: false });

const questionResultSchema = new Schema<IQuestionResult>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  scores: { type: scoresSchema, required: true },
  total: { type: Number, required: true, min: 0, max: 10 },
  feedback: {
    whatWentRight: [{ type: String }],
    needsImprovement: [{ type: String }]
  }
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
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
// Note: sessionId already has unique: true which creates an index automatically
interviewResultSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IInterviewResult>('InterviewResult', interviewResultSchema);
