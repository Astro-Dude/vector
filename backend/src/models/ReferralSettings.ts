import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralSettings extends Document {
  referralDiscountPercent: number;
  referralRewardAmount: number;
  minScoreForReward: number;
  isActive: boolean;
  updatedAt: Date;
}

const referralSettingsSchema = new Schema<IReferralSettings>({
  referralDiscountPercent: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  },
  referralRewardAmount: {
    type: Number,
    required: true,
    default: 50,
    min: 0
  },
  minScoreForReward: {
    type: Number,
    required: true,
    default: 50,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Singleton pattern - only one settings document
referralSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      referralDiscountPercent: 10,
      referralRewardAmount: 50,
      minScoreForReward: 50,
      isActive: true
    });
  }
  return settings;
};

export default mongoose.model<IReferralSettings>('ReferralSettings', referralSettingsSchema);
