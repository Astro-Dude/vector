import { Request } from 'express';
import { Document } from 'mongoose';

declare global {
  namespace Express {
    interface User extends Document {
      _id: any;
      googleId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      profilePicture?: string;
      createdAt: Date;
      lastLogin: Date;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    logout(callback: (err?: any) => void): void;
  }
}