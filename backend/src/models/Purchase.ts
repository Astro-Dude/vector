import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  user: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  purchaseDate: Date;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiryDate?: Date;
  amount: number;
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
  }
}, {
  timestamps: true
});

// Index for better query performance
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ user: 1, item: 1 });

export default mongoose.model<IPurchase>('Purchase', purchaseSchema);