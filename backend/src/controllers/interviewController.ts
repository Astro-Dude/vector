import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request type to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import InterviewQuestion, { IInterviewQuestion } from '../models/InterviewQuestion.js';
import InterviewResult from '../models/InterviewResult.js';
import Purchase from '../models/Purchase.js';
import Item from '../models/Item.js';
import { storeMemory, recallMemory } from '../services/vectorService.js';
import { generateFeedback, generateSpokenFeedback, generateFollowUp, generateReport, getQuestionIntro } from '../services/llmService.js';
import { transcribeAudio, synthesizeSpeech, getSpeechServiceStatus } from '../services/speechService.js';

// In-memory session storage (in production, use Redis)
interface InterviewSession {
  sessionId: string;
  userId: string;
  candidateName: string;
  questions: IInterviewQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    question: string;
    answer: string;
    feedback: string;
    followUpQuestion?: string;
    followUpAnswer?: string;
  }>;
  startedAt: Date;
  status: 'in_progress' | 'completed';
  pendingFollowUp?: {
    question: string;
    originalQuestionIndex: number;
  };
}

const activeSessions: Map<string, InterviewSession> = new Map();

// Start a new interview session
export async function startInterview(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string; firstName?: string; lastName?: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has purchased AI Interview and has remaining interviews
    const aiInterviewItem = await Item.findOne({ title: 'AI Interview', isActive: true });
    if (!aiInterviewItem) {
      res.status(404).json({ error: 'AI Interview product not found' });
      return;
    }

    const purchase = await Purchase.findOne({
      user: user._id,
      item: aiInterviewItem._id,
      status: 'active'
    });

    if (!purchase) {
      res.status(403).json({
        error: 'No active AI Interview purchase found',
        message: 'Please purchase an AI Interview to continue'
      });
      return;
    }

    // Migrate old fields if they exist (one-time migration)
    const oldPurchase = purchase as any;
    if (oldPurchase.interviewsPurchased !== undefined && purchase.credits === 0) {
      purchase.credits = oldPurchase.interviewsPurchased || 0;
      purchase.creditsUsed = oldPurchase.interviewsUsed || 0;
      await purchase.save();
    }

    // Check if user has remaining credits
    const totalCredits = purchase.credits + purchase.creditsAssigned;
    if (purchase.creditsUsed >= totalCredits) {
      res.status(403).json({
        error: 'No interviews remaining',
        message: 'You have used all your purchased interviews. Please purchase more to continue.',
        totalCredits,
        creditsUsed: purchase.creditsUsed
      });
      return;
    }

    const { candidateName } = req.body;
    const name = candidateName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';

    // Fetch 2 random questions from MongoDB
    const questions = await InterviewQuestion.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 2 } }
    ]);

    if (questions.length < 2) {
      res.status(500).json({ error: 'Not enough questions in database. Please add more questions.' });
      return;
    }

    // Increment credits used count
    purchase.creditsUsed += 1;
    await purchase.save();

    const sessionId = uuidv4();
    const session: InterviewSession = {
      sessionId,
      userId: user._id.toString(),
      candidateName: name,
      questions: questions as IInterviewQuestion[],
      currentQuestionIndex: 0,
      answers: [],
      startedAt: new Date(),
      status: 'in_progress'
    };

    activeSessions.set(sessionId, session);

    // Store session start in vector memory
    await storeMemory(sessionId, `Interview started for candidate: ${name}`, {
      type: 'session_start',
      candidateName: name
    });

    // Get human-like intro for first question
    const questionIntro = getQuestionIntro(0, questions.length);

    res.json({
      sessionId,
      totalQuestions: questions.length,
      currentQuestion: {
        index: 0,
        question: questions[0].question,
        category: questions[0].category,
        difficulty: questions[0].difficulty
      },
      questionIntro,
      speechService: getSpeechServiceStatus(),
      creditsRemaining: totalCredits - purchase.creditsUsed
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
}

// Submit an answer and get feedback
export async function submitAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'Interview already completed' });
      return;
    }

    // Check if this is a follow-up answer
    if (session.pendingFollowUp) {
      // This answer is for a follow-up question
      const { originalQuestionIndex, question: followUpQuestion } = session.pendingFollowUp;

      // Store the follow-up answer in the original question's answer record
      if (session.answers[originalQuestionIndex]) {
        session.answers[originalQuestionIndex].followUpQuestion = followUpQuestion;
        session.answers[originalQuestionIndex].followUpAnswer = answer;
      }

      // Store follow-up in vector memory
      await storeMemory(sessionId, `Follow-up Q: ${followUpQuestion}\nFollow-up A: ${answer}`, {
        type: 'follow_up',
        questionIndex: originalQuestionIndex
      });

      // Clear the pending follow-up
      session.pendingFollowUp = undefined;

      // Generate brief acknowledgment
      const spokenFeedback = await generateSpokenFeedback(followUpQuestion, answer);

      // Check if interview is complete
      if (session.currentQuestionIndex >= session.questions.length) {
        // Generate final report (include follow-up Q&A in the report data)
        const reportData = session.answers.map(a => {
          let combined = `Question: ${a.question}\nAnswer: ${a.answer}`;
          if (a.followUpQuestion && a.followUpAnswer) {
            combined += `\nFollow-up: ${a.followUpQuestion}\nFollow-up Answer: ${a.followUpAnswer}`;
          }
          return { question: a.question, answer: combined };
        });

        const report = await generateReport(
          session.candidateName,
          sessionId,
          reportData
        );

        const typedReport = report as {
          questions: Array<{
            question: string;
            answer: string;
            scores: {
              correctness: number;
              reasoning: number;
              clarity: number;
              problemSolving: number;
            };
            scoreReasons?: {
              correctness: string;
              reasoning: string;
              clarity: string;
              problemSolving: string;
            };
            total: number;
            feedback: {
              whatWentRight: string[];
              needsImprovement: string[];
            };
          }>;
          finalScore: number;
          overallFeedback: {
            strengths: string[];
            improvementAreas: string[];
            suggestedNextSteps: string[];
          };
        };

        const interviewResult = new InterviewResult({
          userId: session.userId,
          sessionId,
          candidateName: session.candidateName,
          questions: typedReport.questions,
          finalScore: typedReport.finalScore,
          overallFeedback: typedReport.overallFeedback,
          startedAt: session.startedAt,
          completedAt: new Date()
        });

        await interviewResult.save();
        session.status = 'completed';
        activeSessions.delete(sessionId);

        res.json({
          status: 'completed',
          feedback: 'Follow-up answered.',
          spokenFeedback: "Great, that's all the questions.",
          report: typedReport
        });
        return;
      }

      // Move to next main question
      const nextQuestion = session.questions[session.currentQuestionIndex];
      const questionIntro = getQuestionIntro(session.currentQuestionIndex, session.questions.length);

      res.json({
        status: 'in_progress',
        feedback: 'Thanks for elaborating.',
        spokenFeedback,
        questionIntro,
        nextQuestion: {
          index: session.currentQuestionIndex,
          question: nextQuestion.question,
          category: nextQuestion.category,
          difficulty: nextQuestion.difficulty
        },
        progress: {
          answered: session.currentQuestionIndex,
          total: session.questions.length
        }
      });
      return;
    }

    // This is an answer to a main question
    const currentQuestion = session.questions[session.currentQuestionIndex];

    // Recall previous context from vector memory
    const memoryContext = await recallMemory(sessionId, answer);

    // Generate detailed feedback for storage (not spoken)
    const feedback = await generateFeedback(
      currentQuestion.question,
      answer,
      memoryContext
    );

    // Generate brief spoken feedback (4-5 words)
    const spokenFeedback = await generateSpokenFeedback(
      currentQuestion.question,
      answer
    );

    // Store answer and feedback in vector memory
    await storeMemory(sessionId, `Q: ${currentQuestion.question}\nA: ${answer}\nFeedback: ${feedback}`, {
      type: 'qa_pair',
      questionIndex: session.currentQuestionIndex
    });

    // Store in session
    session.answers.push({
      question: currentQuestion.question,
      answer,
      feedback
    });

    // Try to generate a follow-up question for this answer
    const followUpQuestion = await generateFollowUp(currentQuestion.question, answer);

    // Increment to next question
    const answeredIndex = session.currentQuestionIndex;
    session.currentQuestionIndex++;

    // If we got a follow-up question, ask it before moving to the next main question
    if (followUpQuestion) {
      session.pendingFollowUp = {
        question: followUpQuestion,
        originalQuestionIndex: answeredIndex
      };

      res.json({
        status: 'in_progress',
        feedback,
        spokenFeedback,
        questionIntro: "Let me ask a quick follow-up.",
        isFollowUp: true,
        nextQuestion: {
          index: answeredIndex,
          question: followUpQuestion,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty
        },
        progress: {
          answered: session.currentQuestionIndex,
          total: session.questions.length
        }
      });
      return;
    }

    // No follow-up - check if interview is complete
    if (session.currentQuestionIndex >= session.questions.length) {
      // Generate final report
      const report = await generateReport(
        session.candidateName,
        sessionId,
        session.answers.map(a => ({ question: a.question, answer: a.answer }))
      );

      // Type assertion for the report
      const typedReport = report as {
        questions: Array<{
          question: string;
          answer: string;
          scores: {
            correctness: number;
            reasoning: number;
            clarity: number;
            problemSolving: number;
          };
          scoreReasons?: {
            correctness: string;
            reasoning: string;
            clarity: string;
            problemSolving: string;
          };
          total: number;
          feedback: {
            whatWentRight: string[];
            needsImprovement: string[];
          };
        }>;
        finalScore: number;
        overallFeedback: {
          strengths: string[];
          improvementAreas: string[];
          suggestedNextSteps: string[];
        };
      };

      // Save to MongoDB
      const interviewResult = new InterviewResult({
        userId: session.userId,
        sessionId,
        candidateName: session.candidateName,
        questions: typedReport.questions,
        finalScore: typedReport.finalScore,
        overallFeedback: typedReport.overallFeedback,
        startedAt: session.startedAt,
        completedAt: new Date()
      });

      await interviewResult.save();

      session.status = 'completed';
      activeSessions.delete(sessionId);

      res.json({
        status: 'completed',
        feedback,
        spokenFeedback: "Great, that's all the questions.",
        report: typedReport
      });
    } else {
      // Return next question with human-like intro
      const nextQuestion = session.questions[session.currentQuestionIndex];
      const questionIntro = getQuestionIntro(session.currentQuestionIndex, session.questions.length);

      res.json({
        status: 'in_progress',
        feedback,
        spokenFeedback,
        questionIntro,
        nextQuestion: {
          index: session.currentQuestionIndex,
          question: nextQuestion.question,
          category: nextQuestion.category,
          difficulty: nextQuestion.difficulty
        },
        progress: {
          answered: session.currentQuestionIndex,
          total: session.questions.length
        }
      });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to process answer' });
  }
}

// Transcribe audio to text (STT)
export async function transcribeAnswer(req: MulterRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const result = await transcribeAudio(
      req.file.buffer,
      req.file.mimetype
    );

    if (!result.success) {
      res.json({
        text: '',
        provider: 'browser',
        useBrowserFallback: true,
        message: 'Speechmatics unavailable, please use browser speech recognition'
      });
      return;
    }

    res.json({
      text: result.text,
      provider: result.provider,
      useBrowserFallback: false
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({
      error: 'Transcription failed',
      useBrowserFallback: true
    });
  }
}

// Synthesize text to speech (TTS)
export async function synthesizeText(req: Request, res: Response): Promise<void> {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const result = await synthesizeSpeech(text);

    if (!result.success || !result.audio) {
      res.json({
        audio: null,
        provider: 'browser',
        useBrowserFallback: true,
        message: 'Speechmatics unavailable, please use browser speech synthesis'
      });
      return;
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': result.audio.length.toString()
    });
    res.send(result.audio);
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({
      error: 'Speech synthesis failed',
      useBrowserFallback: true
    });
  }
}

// Get interview session status
export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      // Check if completed in database
      const result = await InterviewResult.findOne({ sessionId });
      if (result) {
        res.json({
          status: 'completed',
          result: {
            finalScore: result.finalScore,
            overallFeedback: result.overallFeedback
          }
        });
        return;
      }

      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      status: session.status,
      progress: {
        current: session.currentQuestionIndex,
        total: session.questions.length
      },
      currentQuestion: session.status === 'in_progress'
        ? {
            index: session.currentQuestionIndex,
            question: session.questions[session.currentQuestionIndex]?.question
          }
        : null
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
}

// Get interview history for a user
export async function getInterviewHistory(req: Request, res: Response): Promise<void> {
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
      InterviewResult.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('sessionId candidateName finalScore createdAt'),
      InterviewResult.countDocuments({ userId: user._id })
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
    console.error('Error getting interview history:', error);
    res.status(500).json({ error: 'Failed to get interview history' });
  }
}

// Get detailed interview result
export async function getInterviewResult(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string } | undefined;
    const { sessionId } = req.params;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await InterviewResult.findOne({
      sessionId,
      userId: user._id
    });

    if (!result) {
      res.status(404).json({ error: 'Interview result not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting interview result:', error);
    res.status(500).json({ error: 'Failed to get interview result' });
  }
}

// Get speech service status (for frontend to decide on fallback)
export function getSpeechStatus(_req: Request, res: Response): void {
  res.json(getSpeechServiceStatus());
}

// Get user's interview balance (purchased vs used)
export async function getInterviewBalance(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const aiInterviewItem = await Item.findOne({ title: 'AI Interview', isActive: true });
    if (!aiInterviewItem) {
      res.json({
        hasPurchase: false,
        totalCredits: 0,
        creditsUsed: 0,
        creditsRemaining: 0
      });
      return;
    }

    const purchase = await Purchase.findOne({
      user: user._id,
      item: aiInterviewItem._id,
      status: 'active'
    });

    if (!purchase) {
      res.json({
        hasPurchase: false,
        totalCredits: 0,
        creditsUsed: 0,
        creditsRemaining: 0
      });
      return;
    }

    // Migrate old fields if they exist (one-time migration)
    const oldPurchase = purchase as any;
    if (oldPurchase.interviewsPurchased !== undefined && purchase.credits === 0) {
      purchase.credits = oldPurchase.interviewsPurchased || 0;
      purchase.creditsUsed = oldPurchase.interviewsUsed || 0;
      await purchase.save();
    }

    const totalCredits = purchase.credits + purchase.creditsAssigned;
    res.json({
      hasPurchase: true,
      totalCredits,
      creditsUsed: purchase.creditsUsed,
      creditsRemaining: totalCredits - purchase.creditsUsed
    });
  } catch (error) {
    console.error('Error getting interview balance:', error);
    res.status(500).json({ error: 'Failed to get interview balance' });
  }
}

// Get interview session page - checks balance and returns session info
export async function getInterviewSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as { _id: string; firstName?: string; lastName?: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get AI Interview item
    const aiInterviewItem = await Item.findOne({ title: 'AI Interview', isActive: true });
    if (!aiInterviewItem) {
      res.status(404).json({
        error: 'AI Interview product not found',
        canStartInterview: false
      });
      return;
    }

    // Get user's purchase
    const purchase = await Purchase.findOne({
      user: user._id,
      item: aiInterviewItem._id,
      status: 'active'
    });

    if (!purchase) {
      res.status(403).json({
        error: 'No active AI Interview purchase found',
        message: 'Please purchase an AI Interview to continue',
        canStartInterview: false,
        totalCredits: 0,
        creditsUsed: 0,
        creditsRemaining: 0
      });
      return;
    }

    // Migrate old fields if they exist (one-time migration)
    const oldPurchase = purchase as any;
    if (oldPurchase.interviewsPurchased !== undefined && purchase.credits === 0) {
      purchase.credits = oldPurchase.interviewsPurchased || 0;
      purchase.creditsUsed = oldPurchase.interviewsUsed || 0;
      await purchase.save();
    }

    const totalCredits = purchase.credits + purchase.creditsAssigned;
    const creditsRemaining = totalCredits - purchase.creditsUsed;

    if (creditsRemaining <= 0) {
      res.status(403).json({
        error: 'No interviews remaining',
        message: 'You have used all your purchased interviews. Please purchase more to continue.',
        canStartInterview: false,
        totalCredits,
        creditsUsed: purchase.creditsUsed,
        creditsRemaining: 0
      });
      return;
    }

    // User can start an interview
    res.json({
      canStartInterview: true,
      totalCredits,
      creditsUsed: purchase.creditsUsed,
      creditsRemaining,
      message: `You have ${creditsRemaining} interview${creditsRemaining > 1 ? 's' : ''} remaining out of ${totalCredits} total.`,
      speechService: getSpeechServiceStatus()
    });
  } catch (error) {
    console.error('Error getting interview session:', error);
    res.status(500).json({ error: 'Failed to get interview session' });
  }
}

export default {
  startInterview,
  submitAnswer,
  transcribeAnswer,
  synthesizeText,
  getSessionStatus,
  getInterviewHistory,
  getInterviewResult,
  getSpeechStatus,
  getInterviewBalance,
  getInterviewSession
};
