import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  status: 'pending' | 'successful' | 'failed';
  purchaseId?: Types.ObjectId;
  interviewResultId?: Types.ObjectId;
  rewardAmount: number;
  rewardStatus: 'pending' | 'earned' | 'paid';
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending'
  },
  purchaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  interviewResultId: {
    type: Schema.Types.ObjectId,
    ref: 'InterviewResult'
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  rewardStatus: {
    type: String,
    enum: ['pending', 'earned', 'paid'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
referralSchema.index({ referrerId: 1, createdAt: -1 });
referralSchema.index({ referredUserId: 1 });
referralSchema.index({ status: 1 });

export default mongoose.model<IReferral>('Referral', referralSchema);
