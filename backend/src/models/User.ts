import mongoose, { Document, Schema, Types } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  isAdmin: boolean;
  referralCode: string;
  referredBy?: Types.ObjectId;
  totalReferralEarnings: number;
  interviewCredits: number;
  interviewCreditsUsed: number;
  createdAt: Date;
  lastLogin: Date;
}

const userSchema = new Schema<IUser>({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: String,
  lastName: String,
  phone: {
    type: String,
    trim: true
  },
  profilePicture: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  totalReferralEarnings: {
    type: Number,
    default: 0
  },
  interviewCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  interviewCreditsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Generate unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Update lastLogin and generate referral code on save
userSchema.pre<IUser>('save', async function(next) {
  this.lastLogin = new Date();

  // Generate referral code if not present
  if (!this.referralCode) {
    let code = generateReferralCode();
    // Ensure uniqueness
    const User = mongoose.model('User');
    let exists = await User.findOne({ referralCode: code });
    while (exists) {
      code = generateReferralCode();
      exists = await User.findOne({ referralCode: code });
    }
    this.referralCode = code;
  }

  next();
});

export default mongoose.model<IUser>('User', userSchema);