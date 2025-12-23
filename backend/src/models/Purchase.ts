import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  user: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  purchaseDate: Date;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiryDate?: Date;
  amount: number;
  // Credit tracking fields
  credits: number;        // Credits purchased (paid)
  creditsUsed: number;    // Credits consumed
  creditsAssigned: number; // Credits assigned by admin (free)
  // Total available = credits + creditsAssigned - creditsUsed
  // Discount tracking fields
  originalAmount: number;
  discountAmount: number;
  discountType?: 'coupon' | 'referral';
  discountCode?: string;
  couponId?: mongoose.Types.ObjectId;
  referralId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active'
  },
  expiryDate: {
    type: Date
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Credit tracking: paid credits, used credits, assigned credits
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  creditsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  creditsAssigned: {
    type: Number,
    default: 0,
    min: 0
  },
  // Discount tracking
  originalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['coupon', 'referral']
  },
  discountCode: {
    type: String
  },
  couponId: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  referralId: {
    type: Schema.Types.ObjectId,
    ref: 'Referral'
  }
}, {
  timestamps: true
});

// Index for better query performance
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ user: 1, item: 1 });

export default mongoose.model<IPurchase>('Purchase', purchaseSchema);