import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  title: string;
  description: string;
  price: number;
  type: 'test' | 'interview' | 'course';
  duration?: string;
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