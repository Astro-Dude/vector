import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import TestQuestion from '../models/TestQuestion.js';
import TestResult from '../models/TestResult.js';
import Purchase from '../models/Purchase.js';
import Item, { IItem } from '../models/Item.js';

// In-memory session storage for active tests
interface TestSession {
  sessionId: string;
  testId: string;
  userId: string;
  candidateName: string;
  questions: Array<{
    _id: mongoose.Types.ObjectId;
    question: string;
    type: 'mcq' | 'short';
    options: string[];
    correctAnswer: number | string;
    note?: string;
    score: number;
  }>;
  answers: Map<string, number | string>; // questionId -> answer
  startedAt: Date;
  timeLimit: number; // in minutes
  status: 'in_progress' | 'completed' | 'abandoned';
}

const activeSessions: Map<string, TestSession> = new Map();

// Normalize short answer for comparison
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/,/g, '');  // Remove commas (1,000 -> 1000)
}

// Check if short answer is correct
function checkShortAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

// Get test setup info - check if user can take the test
export async function getTestSetup(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string; firstName?: string; lastName?: string } | undefined;
    const { testId } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get the test item
    const testItem = await Item.findOne({
      _id: testId,
      type: 'test',
      isActive: true
    }) as IItem | null;

    if (!testItem) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    // Check if user has purchased this test
    const purchase = await Purchase.findOne({
      user: user._id,
      item: testItem._id,
      status: 'active'
    });

    if (!purchase) {
      res.status(403).json({
        error: 'Test not purchased',
        message: 'Please purchase this test to continue',
        canStartTest: false
      });
      return;
    }

    // Tests have unlimited attempts once purchased - no credit check needed

    // Get question count for this test
    const questionCount = await TestQuestion.countDocuments({
      testId: testItem._id,
      isActive: true
    });

    // Get attempt count for display
    const attemptCount = await TestResult.countDocuments({
      userId: user._id,
      testId: testItem._id
    });

    res.json({
      canStartTest: true,
      test: {
        id: testItem._id,
        title: testItem.title,
        description: testItem.description,
        timeLimit: testItem.timeLimit || 30, // Default 30 minutes
        questionCount: testItem.questionCount || questionCount,
        totalQuestions: questionCount
      },
      attempts: attemptCount // Show how many times they've attempted
    });
  } catch (error) {
    console.error('Error getting test setup:', error);
    res.status(500).json({ error: 'Failed to get test setup' });
  }
}

// Start a new test session
export async function startTestSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string; firstName?: string; lastName?: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { testId, candidateName } = req.body;

    if (!testId) {
      res.status(400).json({ error: 'Test ID is required' });
      return;
    }

    // Get the test item
    const testItem = await Item.findOne({
      _id: testId,
      type: 'test',
      isActive: true
    }) as IItem | null;

    if (!testItem) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    // Check if user has purchased this test
    const purchase = await Purchase.findOne({
      user: user._id,
      item: testItem._id,
      status: 'active'
    });

    if (!purchase) {
      res.status(403).json({ error: 'Test not purchased' });
      return;
    }

    // Tests have unlimited attempts - no credit check or deduction needed

    // Get questions for this test
    const questionLimit = testItem.questionCount || 20;
    const questions = await TestQuestion.aggregate([
      { $match: { testId: testItem._id, isActive: true } },
      { $sample: { size: questionLimit } }
    ]);

    if (questions.length === 0) {
      res.status(500).json({ error: 'No questions available for this test' });
      return;
    }

    // Create session
    const sessionId = uuidv4();
    const name = candidateName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';
    const timeLimit = testItem.timeLimit || 30;

    const session: TestSession = {
      sessionId,
      testId: String(testItem._id),
      userId: user._id.toString(),
      candidateName: name,
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        note: q.note,
        score: q.score
      })),
      answers: new Map(),
      startedAt: new Date(),
      timeLimit,
      status: 'in_progress'
    };

    activeSessions.set(sessionId, session);

    // Return session info (without correct answers)
    res.json({
      sessionId,
      testId: testItem._id,
      testTitle: testItem.title,
      totalQuestions: questions.length,
      timeLimit,
      questions: questions.map((q, index) => ({
        index,
        questionId: q._id,
        question: q.question,
        type: q.type || 'mcq',
        options: q.options || [],
        note: q.note || undefined,
        score: q.score
      }))
    });
  } catch (error) {
    console.error('Error starting test session:', error);
    res.status(500).json({ error: 'Failed to start test session' });
  }
}

// Submit an answer
export async function submitAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined || answer === null) {
      res.status(400).json({ error: 'Question ID and answer are required' });
      return;
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.status !== 'in_progress') {
      res.status(400).json({ error: 'Test already completed' });
      return;
    }

    // Check time limit
    const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / (1000 * 60);
    if (elapsedMinutes > session.timeLimit) {
      res.status(400).json({ error: 'Time limit exceeded', timeExpired: true });
      return;
    }

    // Store the answer
    session.answers.set(questionId, answer);

    res.json({
      success: true,
      answersSubmitted: session.answers.size,
      totalQuestions: session.questions.length
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
}

// End test and calculate results
export async function endTest(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { answers: submittedAnswers } = req.body; // Optional: submit all answers at once

    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'Test already completed' });
      return;
    }

    // If answers submitted with end request, update them
    if (submittedAnswers && typeof submittedAnswers === 'object') {
      for (const [questionId, answer] of Object.entries(submittedAnswers)) {
        if (answer !== undefined && answer !== null) {
          session.answers.set(questionId, answer as number | string);
        }
      }
    }

    // Calculate results
    const completedAt = new Date();
    const timeTaken = Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000); // in seconds

    let correctAnswers = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    const questionResults = session.questions.map(q => {
      const questionId = q._id.toString();
      const userAnswer = session.answers.get(questionId);
      maxPossibleScore += q.score;

      let isCorrect = false;

      if (userAnswer !== undefined && userAnswer !== null) {
        if (q.type === 'short') {
          // Short answer string matching
          isCorrect = checkShortAnswer(String(userAnswer), String(q.correctAnswer));
        } else {
          // MCQ - compare indices
          isCorrect = userAnswer === q.correctAnswer;
        }
      }

      if (isCorrect) {
        correctAnswers++;
        totalScore += q.score;
      }

      return {
        questionId: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        note: q.note,
        selectedAnswer: userAnswer ?? -1, // -1 for unanswered
        correctAnswer: q.correctAnswer,
        isCorrect,
        maxScore: q.score,
        scoreAwarded: isCorrect ? q.score : 0
      };
    });

    const percentageScore = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

    // Save to database
    const testResult = new TestResult({
      userId: session.userId,
      sessionId: session.sessionId,
      testId: session.testId,
      candidateName: session.candidateName,
      questions: questionResults,
      totalQuestions: session.questions.length,
      correctAnswers,
      totalScore,
      maxPossibleScore,
      percentageScore,
      timeTaken,
      status: 'completed',
      startedAt: session.startedAt,
      completedAt
    });

    await testResult.save();

    // Clean up session
    session.status = 'completed';
    activeSessions.delete(sessionId);

    res.json({
      status: 'completed',
      summary: {
        totalQuestions: session.questions.length,
        correctAnswers,
        totalScore,
        maxPossibleScore,
        percentageScore,
        timeTaken,
        timeLimit: session.timeLimit * 60 // in seconds for display
      }
    });
  } catch (error) {
    console.error('Error ending test:', error);
    res.status(500).json({ error: 'Failed to end test' });
  }
}

// Get test history for a user
export async function getTestHistory(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      TestResult.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('testId', 'title')
        .select('sessionId candidateName percentageScore correctAnswers totalQuestions timeTaken createdAt'),
      TestResult.countDocuments({ userId: user._id })
    ]);

    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting test history:', error);
    res.status(500).json({ error: 'Failed to get test history' });
  }
}

// Get detailed test result
export async function getTestResult(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string } | undefined;
    const { sessionId } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await TestResult.findOne({
      sessionId,
      userId: user._id
    }).populate('testId', 'title description');

    if (!result) {
      res.status(404).json({ error: 'Test result not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting test result:', error);
    res.status(500).json({ error: 'Failed to get test result' });
  }
}

// Get session status (for resuming or checking time)
export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      // Check if completed in database
      const result = await TestResult.findOne({ sessionId });
      if (result) {
        res.json({
          status: 'completed',
          result: {
            percentageScore: result.percentageScore,
            correctAnswers: result.correctAnswers,
            totalQuestions: result.totalQuestions
          }
        });
        return;
      }

      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const elapsedSeconds = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, session.timeLimit * 60 - elapsedSeconds);

    res.json({
      status: session.status,
      timeRemaining: remainingSeconds,
      answersSubmitted: session.answers.size,
      totalQuestions: session.questions.length
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
}

export default {
  getTestSetup,
  startTestSession,
  submitAnswer,
  endTest,
  getTestHistory,
  getTestResult,
  getSessionStatus
};
