import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

// Import passport configuration
import './config/passport.js';

import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import testRoutes from './routes/test.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for secure cookies on Render
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session configuration with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production-123456789',
  resave: false,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/vector',
    ttl: 24 * 60 * 60, // 24 hours in seconds
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// API health check
app.get('/api', (req, res) => {
  res.json({ message: 'Vector Backend API', status: 'running' });
});

// User info endpoint
app.get('/api/user', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session destroy failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vector')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve frontend in production (must be last)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});