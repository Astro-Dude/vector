import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewQuestion extends Document {
  question: string;
  answer: string;
  category: 'maths' | 'behaviour';
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['maths', 'behaviour']
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

// Index for random selection of active questions
interviewQuestionSchema.index({ isActive: 1, category: 1 });

export default mongoose.model<IInterviewQuestion>('InterviewQuestion', interviewQuestionSchema);
