import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  applicableTypes: ('interview' | 'test' | 'course')[];
  maxUses: number;
  currentUses: number;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'flat']
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  applicableTypes: {
    type: [String],
    required: true,
    enum: ['interview', 'test', 'course']
  },
  maxUses: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  currentUses: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for quick code lookups
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });

export default mongoose.model<ICoupon>('Coupon', couponSchema);
