import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import {
  startInterview,
  submitAnswer,
  transcribeAnswer,
  synthesizeText,
  getSessionStatus,
  getInterviewHistory,
  getInterviewResult,
  getSpeechStatus,
  getInterviewBalance,
  getInterviewSession,
  endInterviewEarly
} from '../controllers/interviewController.js';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Setup page - check credits and show balance before starting
router.get('/setup', requireAuth, getInterviewSession);

// Session page - start the interview (requires credits)
router.post('/session', requireAuth, startInterview);

// Active session routes
router.post('/session/:sessionId/answer', requireAuth, submitAnswer);
router.post('/session/:sessionId/end', requireAuth, endInterviewEarly);
router.get('/session/:sessionId/status', requireAuth, getSessionStatus);

// Speech routes
router.post('/transcribe', requireAuth, upload.single('audio'), transcribeAnswer);
router.post('/synthesize', requireAuth, synthesizeText);
router.get('/speech/status', getSpeechStatus);

// History routes
router.get('/history', requireAuth, getInterviewHistory);
router.get('/result/:sessionId', requireAuth, getInterviewResult);

// Balance route - check purchased vs used interviews
router.get('/balance', requireAuth, getInterviewBalance);

export default router;
