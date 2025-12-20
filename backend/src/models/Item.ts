import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  title: string;
  description: string;
  price: number;
  type: 'test' | 'interview' | 'course';
  duration?: string;
  // Test-specific fields
  timeLimit?: number; // Time limit in minutes for tests
  questionCount?: number; // Number of questions to show in the test
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['test', 'interview', 'course']
  },
  duration: {
    type: String,
    trim: true
  },
  timeLimit: {
    type: Number,
    min: 1
  },
  questionCount: {
    type: Number,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
itemSchema.index({ type: 1, isActive: 1 });
itemSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IItem>('Item', itemSchema);