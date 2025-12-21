import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  isAdmin: boolean;
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Update lastLogin on save
userSchema.pre<IUser>('save', function(next) {
  this.lastLogin = new Date();
  next();
});

export default mongoose.model<IUser>('User', userSchema);