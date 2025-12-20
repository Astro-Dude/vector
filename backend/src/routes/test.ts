import { Router, Request, Response, NextFunction } from 'express';
import {
  getTestSetup,
  startTestSession,
  submitAnswer,
  endTest,
  getTestHistory,
  getTestResult,
  getSessionStatus
} from '../controllers/testController.js';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Setup page - check if user can take the test
router.get('/setup/:testId', requireAuth, getTestSetup);

// Start test session
router.post('/session', requireAuth, startTestSession);

// Submit answer during test
router.post('/session/:sessionId/answer', requireAuth, submitAnswer);

// End test and get results
router.post('/session/:sessionId/end', requireAuth, endTest);

// Get session status (for time remaining, etc.)
router.get('/session/:sessionId/status', requireAuth, getSessionStatus);

// History routes
router.get('/history', requireAuth, getTestHistory);
router.get('/result/:sessionId', requireAuth, getTestResult);

export default router;
