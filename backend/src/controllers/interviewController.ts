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
import { storeMemory, recallMemory, getFormattedConversationContext } from '../services/vectorService.js';
import {
  generateFeedback,
  generateSpokenFeedback,
  generateDetailedFeedback,
  generateIntroductionFollowUp,
  generateFollowUp,
  generateReport,
  getQuestionIntro,
  normalizeTranscribedAnswer,
  evaluateAnswer,
  generateMathFollowUp,
  prepareForTTS,
  AnswerEvaluation,
  NormalizedAnswer
} from '../services/llmService.js';
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
    normalizedAnswer?: string;
    feedback: string;
    followUpQuestions: Array<{
      question: string;
      answer: string;
      wasHint: boolean;
    }>;
    initialEvaluation?: AnswerEvaluation;
  }>;
  startedAt: Date;
  status: 'in_progress' | 'completed';
  // Interview phase tracking
  phase: 'introduction' | 'introduction_followup' | 'technical';
  introductionFollowUpCount: number;
  introductionAnswer?: string;
  introductionFollowUpHistory: Array<{ question: string; answer: string }>;
  // New: Track follow-up state for current question
  currentQuestionState: {
    followUpCount: number;
    initialEvaluation?: AnswerEvaluation;
    awaitingFollowUpAnswer: boolean;
    currentFollowUpQuestion?: string;
    currentFollowUpType?: 'hint' | 'probe';
    followUpHistory: Array<{ question: string; answer: string }>;
    wasInitiallyCorrect?: boolean;
    gotCorrectAfterHint?: boolean;
  };
}

// Helper to reset question state when moving to next question
function resetQuestionState(): InterviewSession['currentQuestionState'] {
  return {
    followUpCount: 0,
    initialEvaluation: undefined,
    awaitingFollowUpAnswer: false,
    currentFollowUpQuestion: undefined,
    currentFollowUpType: undefined,
    followUpHistory: [],
    wasInitiallyCorrect: undefined,
    gotCorrectAfterHint: undefined
  };
}

const activeSessions: Map<string, InterviewSession> = new Map();

// Handle introduction phase answers
async function handleIntroductionAnswer(
  req: Request,
  res: Response,
  session: InterviewSession,
  answer: string
): Promise<void> {
  const { sessionId } = session;

  if (session.phase === 'introduction') {
    // This is the initial "tell me about yourself" answer
    session.introductionAnswer = answer;

    // Store the introduction answer in memory
    await storeMemory(sessionId, `Candidate introduced themselves: "${answer}"`, {
      type: 'introduction_answer',
      candidateName: session.candidateName
    });

    // Generate a follow-up question about their background
    const followUpQuestion = await generateIntroductionFollowUp(answer, []);

    session.phase = 'introduction_followup';
    session.introductionFollowUpCount = 1;

    // Store the follow-up question
    await storeMemory(sessionId, `Interviewer asked follow-up: "${followUpQuestion}"`, {
      type: 'introduction_followup'
    });

    res.json({
      status: 'in_progress',
      phase: 'introduction_followup',
      feedback: "Thanks for sharing!",
      spokenFeedback: "Thanks for sharing!",
      followUpQuestion,
      currentQuestion: null
    });
    return;
  }

  if (session.phase === 'introduction_followup') {
    // Store the follow-up answer
    const previousFollowUp = session.introductionFollowUpHistory.length > 0
      ? session.introductionFollowUpHistory[session.introductionFollowUpHistory.length - 1]
      : null;

    session.introductionFollowUpHistory.push({
      question: previousFollowUp?.question || 'Follow-up question',
      answer
    });

    await storeMemory(sessionId, `Candidate responded to follow-up: "${answer}"`, {
      type: 'introduction_followup'
    });

    // Check if we should ask another follow-up or move to technical questions
    if (session.introductionFollowUpCount < 2) {
      // Ask one more follow-up
      const allFollowUps = [
        { question: 'Tell me about yourself', answer: session.introductionAnswer || '' },
        ...session.introductionFollowUpHistory
      ];

      const followUpQuestion = await generateIntroductionFollowUp(
        session.introductionAnswer || answer,
        allFollowUps
      );

      session.introductionFollowUpCount++;

      await storeMemory(sessionId, `Interviewer asked follow-up: "${followUpQuestion}"`, {
        type: 'introduction_followup'
      });

      res.json({
        status: 'in_progress',
        phase: 'introduction_followup',
        feedback: "Interesting!",
        spokenFeedback: "Interesting!",
        followUpQuestion,
        currentQuestion: null
      });
      return;
    }

    // Done with introduction - transition to technical questions
    session.phase = 'technical';

    const firstQuestion = session.questions[0];
    const questionIntro = "Thank you for sharing! Now let's move on to the technical questions.";

    // Store the first technical question being asked
    await storeMemory(sessionId, `Interviewer asked Question 1: ${firstQuestion.question}`, {
      type: 'main_question',
      questionIndex: 0,
      category: firstQuestion.category,
      difficulty: firstQuestion.difficulty
    });

    // Prepare question for TTS
    const questionForTTS = await prepareForTTS(firstQuestion.question, 'question');

    res.json({
      status: 'in_progress',
      phase: 'technical',
      feedback: "Great, thank you for the introduction!",
      spokenFeedback: "Great, thanks!",
      questionIntro,
      nextQuestion: {
        index: 0,
        question: firstQuestion.question,
        questionForTTS,
        category: firstQuestion.category,
        difficulty: firstQuestion.difficulty
      }
    });
    return;
  }
}

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
      status: 'in_progress',
      phase: 'introduction',
      introductionFollowUpCount: 0,
      introductionFollowUpHistory: [],
      currentQuestionState: resetQuestionState()
    };

    activeSessions.set(sessionId, session);

    // Store session start in vector memory
    await storeMemory(sessionId, `Interview started for candidate: ${name}`, {
      type: 'session_start',
      candidateName: name
    });

    // Introduction message
    const introductionMessage = `Hello! I'm your AI interviewer today. Before we dive into the questions, I'd love to know more about you. Please tell me about yourself - your background, interests, and what brings you here.`;

    // Store the introduction question being asked
    await storeMemory(sessionId, `Interviewer asked: ${introductionMessage}`, {
      type: 'introduction_ask'
    });

    res.json({
      sessionId,
      totalQuestions: questions.length,
      phase: 'introduction',
      introductionMessage,
      currentQuestion: null, // No technical question yet
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

    // Handle introduction phase
    if (session.phase === 'introduction' || session.phase === 'introduction_followup') {
      return handleIntroductionAnswer(req, res, session, answer);
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const isMathQuestion = currentQuestion.category === 'maths';

    // Step 1: Normalize the transcribed answer to fix STT issues
    const normalizedAnswer = await normalizeTranscribedAnswer(answer, currentQuestion.question);
    console.log(`[Interview] Original: "${answer}" -> Normalized: "${normalizedAnswer.normalizedText}"`);

    // Check if this is a follow-up answer
    if (session.currentQuestionState.awaitingFollowUpAnswer) {
      return handleFollowUpAnswer(req, res, session, answer, normalizedAnswer);
    }

    // This is an answer to a main question
    // Step 2: Evaluate the answer using LLM
    const evaluation = await evaluateAnswer(
      currentQuestion.question,
      currentQuestion.answer, // Correct answer from DB
      answer,
      normalizedAnswer
    );

    console.log(`[Interview] Evaluation: ${evaluation.correctnessLevel} - ${evaluation.reasoning}`);

    // Store initial evaluation in session state
    session.currentQuestionState.initialEvaluation = evaluation;
    session.currentQuestionState.wasInitiallyCorrect = evaluation.isCorrect;

    // Store candidate's answer in memory
    await storeMemory(sessionId, `Candidate answered: "${answer}" (Normalized: "${normalizedAnswer.normalizedText}")`, {
      type: 'main_answer',
      questionIndex: session.currentQuestionIndex,
      category: currentQuestion.category,
      isCorrect: evaluation.isCorrect
    });

    // Store evaluation result
    await storeMemory(sessionId, `Evaluation: ${evaluation.correctnessLevel} - ${evaluation.reasoning}`, {
      type: 'evaluation',
      questionIndex: session.currentQuestionIndex,
      isCorrect: evaluation.isCorrect
    });

    // Get full conversation context for feedback generation
    const conversationContext = await getFormattedConversationContext(sessionId);

    // Generate detailed feedback with full context
    const feedback = await generateFeedback(
      currentQuestion.question,
      answer,
      conversationContext ? [conversationContext] : []
    );

    // Store in session answers array
    session.answers.push({
      question: currentQuestion.question,
      answer,
      normalizedAnswer: normalizedAnswer.normalizedText,
      feedback,
      followUpQuestions: [],
      initialEvaluation: evaluation
    });

    // Step 3: For math questions, generate follow-up (1-3 mandatory)
    if (isMathQuestion && session.currentQuestionState.followUpCount < 3) {
      const followUp = await generateMathFollowUp(
        currentQuestion.question,
        currentQuestion.answer,
        answer,
        evaluation,
        session.currentQuestionState.followUpCount,
        session.currentQuestionState.followUpHistory,
        conversationContext
      );

      session.currentQuestionState.followUpCount++;
      session.currentQuestionState.awaitingFollowUpAnswer = true;
      session.currentQuestionState.currentFollowUpQuestion = followUp.question;
      session.currentQuestionState.currentFollowUpType = followUp.type;

      // Store follow-up question in memory
      await storeMemory(sessionId, `Interviewer asked follow-up (${followUp.type}): ${followUp.question}`, {
        type: 'follow_up_question',
        questionIndex: session.currentQuestionIndex,
        followUpNumber: session.currentQuestionState.followUpCount,
        category: currentQuestion.category
      });

      // Generate spoken feedback based on evaluation
      const spokenFeedback = evaluation.isCorrect
        ? "Good answer! Let me ask you something."
        : "Let me ask you a follow-up.";

      // Prepare follow-up question for TTS
      const questionForTTS = await prepareForTTS(followUp.question, 'question');

      res.json({
        status: 'in_progress',
        feedback: evaluation.reasoning,
        spokenFeedback,
        questionIntro: followUp.type === 'hint'
          ? "Let me help you think through this."
          : "I'd like to understand your thinking better.",
        isFollowUp: true,
        followUpNumber: session.currentQuestionState.followUpCount,
        maxFollowUps: 3,
        followUpType: followUp.type,
        nextQuestion: {
          index: session.currentQuestionIndex,
          question: followUp.question,
          questionForTTS,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          isFollowUp: true
        },
        progress: {
          answered: session.currentQuestionIndex,
          total: session.questions.length
        }
      });
      return;
    }

    // For behavior questions or when follow-ups are exhausted, move to next question
    return moveToNextQuestion(res, session, feedback);
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to process answer' });
  }
}

// Handle follow-up answer for math questions
async function handleFollowUpAnswer(
  req: Request,
  res: Response,
  session: InterviewSession,
  answer: string,
  normalizedAnswer: NormalizedAnswer
): Promise<void> {
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const currentAnswerIndex = session.answers.length - 1;
  const followUpQuestion = session.currentQuestionState.currentFollowUpQuestion!;
  const followUpType = session.currentQuestionState.currentFollowUpType!;

  // Get full conversation context for follow-up generation
  const conversationContext = await getFormattedConversationContext(session.sessionId);

  // Store candidate's follow-up answer in vector memory
  await storeMemory(session.sessionId, `Candidate responded to follow-up: "${answer}" (Normalized: "${normalizedAnswer.normalizedText}")`, {
    type: 'follow_up_answer',
    questionIndex: session.currentQuestionIndex,
    followUpNumber: session.currentQuestionState.followUpCount,
    category: currentQuestion.category
  });

  // Store in follow-up history
  session.currentQuestionState.followUpHistory.push({
    question: followUpQuestion,
    answer
  });

  // Store in answers array
  if (session.answers[currentAnswerIndex]) {
    session.answers[currentAnswerIndex].followUpQuestions.push({
      question: followUpQuestion,
      answer,
      wasHint: followUpType === 'hint'
    });
  }

  // Re-evaluate if this was a hint (student was wrong initially)
  if (followUpType === 'hint') {
    const reEvaluation = await evaluateAnswer(
      currentQuestion.question,
      currentQuestion.answer,
      answer,
      normalizedAnswer
    );

    // Check if they got it correct now
    if (reEvaluation.isCorrect && !session.currentQuestionState.gotCorrectAfterHint) {
      session.currentQuestionState.gotCorrectAfterHint = true;

      // Ask one more probe question to verify understanding, then move on
      if (session.currentQuestionState.followUpCount < 3) {
        const probeFollowUp = await generateMathFollowUp(
          currentQuestion.question,
          currentQuestion.answer,
          answer,
          reEvaluation,
          session.currentQuestionState.followUpCount,
          session.currentQuestionState.followUpHistory,
          conversationContext
        );

        session.currentQuestionState.followUpCount++;
        session.currentQuestionState.currentFollowUpQuestion = probeFollowUp.question;
        session.currentQuestionState.currentFollowUpType = 'probe';

        // Store probe follow-up question in memory
        await storeMemory(session.sessionId, `Interviewer asked verification probe: ${probeFollowUp.question}`, {
          type: 'follow_up_question',
          questionIndex: session.currentQuestionIndex,
          followUpNumber: session.currentQuestionState.followUpCount,
          category: currentQuestion.category
        });

        // Prepare for TTS
        const questionForTTS = await prepareForTTS(probeFollowUp.question, 'question');

        res.json({
          status: 'in_progress',
          feedback: "That's correct! Let me verify your understanding.",
          spokenFeedback: "Good, you got it!",
          questionIntro: "One more question to check your understanding.",
          isFollowUp: true,
          followUpNumber: session.currentQuestionState.followUpCount,
          maxFollowUps: 3,
          followUpType: 'probe',
          nextQuestion: {
            index: session.currentQuestionIndex,
            question: probeFollowUp.question,
            questionForTTS,
            category: currentQuestion.category,
            difficulty: currentQuestion.difficulty,
            isFollowUp: true
          },
          progress: {
            answered: session.currentQuestionIndex,
            total: session.questions.length
          }
        });
        return;
      }
    }
  }

  // Clear follow-up waiting state
  session.currentQuestionState.awaitingFollowUpAnswer = false;

  // Check if we need more follow-ups (for math questions)
  const isMathQuestion = currentQuestion.category === 'maths';
  if (isMathQuestion && session.currentQuestionState.followUpCount < 3) {
    // Get latest evaluation state
    const currentEvaluation = session.currentQuestionState.initialEvaluation!;
    const isCorrect = session.currentQuestionState.wasInitiallyCorrect || session.currentQuestionState.gotCorrectAfterHint;

    // Generate next follow-up
    const followUp = await generateMathFollowUp(
      currentQuestion.question,
      currentQuestion.answer,
      answer,
      { ...currentEvaluation, isCorrect: isCorrect || false },
      session.currentQuestionState.followUpCount,
      session.currentQuestionState.followUpHistory,
      conversationContext
    );

    session.currentQuestionState.followUpCount++;
    session.currentQuestionState.awaitingFollowUpAnswer = true;
    session.currentQuestionState.currentFollowUpQuestion = followUp.question;
    session.currentQuestionState.currentFollowUpType = followUp.type;

    // Store follow-up question in memory
    await storeMemory(session.sessionId, `Interviewer asked follow-up (${followUp.type}): ${followUp.question}`, {
      type: 'follow_up_question',
      questionIndex: session.currentQuestionIndex,
      followUpNumber: session.currentQuestionState.followUpCount,
      category: currentQuestion.category
    });

    // Prepare for TTS
    const questionForTTS = await prepareForTTS(followUp.question, 'question');

    res.json({
      status: 'in_progress',
      feedback: 'Thanks for your response.',
      spokenFeedback: "Okay, next follow-up.",
      questionIntro: followUp.type === 'hint'
        ? "Let me guide you a bit more."
        : "Here's another question.",
      isFollowUp: true,
      followUpNumber: session.currentQuestionState.followUpCount,
      maxFollowUps: 3,
      followUpType: followUp.type,
      nextQuestion: {
        index: session.currentQuestionIndex,
        question: followUp.question,
        questionForTTS,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        isFollowUp: true
      },
      progress: {
        answered: session.currentQuestionIndex,
        total: session.questions.length
      }
    });
    return;
  }

  // All follow-ups done, move to next question
  const feedback = session.answers[currentAnswerIndex]?.feedback || 'Thanks for your answers.';
  return moveToNextQuestion(res, session, feedback);
}

// Helper to move to next question or complete interview
async function moveToNextQuestion(
  res: Response,
  session: InterviewSession,
  feedback: string
): Promise<void> {
  // Reset question state for next question
  session.currentQuestionState = resetQuestionState();

  // Increment to next question
  session.currentQuestionIndex++;

  // Check if interview is complete
  if (session.currentQuestionIndex >= session.questions.length) {
    // Generate final report with all answers and follow-ups
    const reportData = session.answers.map(a => {
      let combined = `Question: ${a.question}\nAnswer: ${a.answer}`;
      if (a.normalizedAnswer && a.normalizedAnswer !== a.answer) {
        combined += ` (understood as: ${a.normalizedAnswer})`;
      }
      if (a.followUpQuestions.length > 0) {
        a.followUpQuestions.forEach((fq, i) => {
          combined += `\nFollow-up ${i + 1}: ${fq.question}\nResponse: ${fq.answer}`;
        });
      }
      return { question: a.question, answer: combined };
    });

    const report = await generateReport(
      session.candidateName,
      session.sessionId,
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

    // Generate detailed feedback for each question and merge with report
    const questionsWithDetails = await Promise.all(
      typedReport.questions.map(async (q, i) => {
        const sessionAnswer = session.answers[i];
        const originalQuestion = session.questions[i];

        // Generate detailed feedback using the new function
        // Generate detailed feedback for THIS question only (no conversation context
        // to prevent feedback from other questions bleeding in)
        const detailedFeedback = await generateDetailedFeedback(
          q.question,
          originalQuestion.answer, // correct answer from DB
          sessionAnswer.answer,
          sessionAnswer.normalizedAnswer || sessionAnswer.answer,
          sessionAnswer.initialEvaluation || {
            isCorrect: false,
            correctnessLevel: 'incorrect' as const,
            normalizedStudentAnswer: sessionAnswer.answer,
            reasoning: 'Evaluation not available',
            followUpType: 'hint' as const
          },
          sessionAnswer.followUpQuestions || []
        );

        return {
          ...q,
          normalizedAnswer: sessionAnswer.normalizedAnswer,
          followUpQuestions: sessionAnswer.followUpQuestions || [],
          detailedFeedback
        };
      })
    );

    // Save to MongoDB with enhanced data
    const interviewResult = new InterviewResult({
      userId: session.userId,
      sessionId: session.sessionId,
      candidateName: session.candidateName,
      questions: questionsWithDetails,
      finalScore: typedReport.finalScore,
      overallFeedback: typedReport.overallFeedback,
      startedAt: session.startedAt,
      completedAt: new Date()
    });

    await interviewResult.save();

    session.status = 'completed';
    activeSessions.delete(session.sessionId);

    res.json({
      status: 'completed',
      feedback,
      spokenFeedback: "Great, that's all the questions.",
      report: {
        ...typedReport,
        questions: questionsWithDetails
      }
    });
    return;
  }

  // Return next question with human-like intro
  const nextQuestion = session.questions[session.currentQuestionIndex];
  const questionIntro = getQuestionIntro(session.currentQuestionIndex, session.questions.length);

  // Store the next main question being asked
  await storeMemory(session.sessionId, `Interviewer asked Question ${session.currentQuestionIndex + 1}: ${nextQuestion.question}`, {
    type: 'main_question',
    questionIndex: session.currentQuestionIndex,
    category: nextQuestion.category,
    difficulty: nextQuestion.difficulty
  });

  // Prepare question for TTS
  const questionForTTS = await prepareForTTS(nextQuestion.question, 'question');

  res.json({
    status: 'in_progress',
    feedback,
    spokenFeedback: "Okay, moving on.",
    questionIntro,
    nextQuestion: {
      index: session.currentQuestionIndex,
      question: nextQuestion.question,
      questionForTTS,
      category: nextQuestion.category,
      difficulty: nextQuestion.difficulty
    },
    progress: {
      answered: session.currentQuestionIndex,
      total: session.questions.length
    }
  });
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

// End interview early and generate partial results
export async function endInterviewEarly(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'Interview already completed' });
      return;
    }

    // Check if any questions were answered
    if (session.answers.length === 0) {
      // No questions answered - just clean up, no report
      activeSessions.delete(sessionId);
      res.json({
        status: 'ended_early',
        message: 'Interview ended without answering any questions',
        hasReport: false
      });
      return;
    }

    // Generate partial report with answered questions only
    const reportData = session.answers.map(a => {
      let combined = `Question: ${a.question}\nAnswer: ${a.answer}`;
      if (a.normalizedAnswer && a.normalizedAnswer !== a.answer) {
        combined += ` (understood as: ${a.normalizedAnswer})`;
      }
      if (a.followUpQuestions.length > 0) {
        a.followUpQuestions.forEach((fq, i) => {
          combined += `\nFollow-up ${i + 1}: ${fq.question}\nResponse: ${fq.answer}`;
        });
      }
      return { question: a.question, answer: combined };
    });

    const report = await generateReport(
      session.candidateName,
      session.sessionId,
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

    // Generate detailed feedback for each answered question
    const questionsWithDetails = await Promise.all(
      typedReport.questions.map(async (q, i) => {
        const sessionAnswer = session.answers[i];
        const originalQuestion = session.questions[i];

        const detailedFeedback = await generateDetailedFeedback(
          q.question,
          originalQuestion.answer,
          sessionAnswer.answer,
          sessionAnswer.normalizedAnswer || sessionAnswer.answer,
          sessionAnswer.initialEvaluation || {
            isCorrect: false,
            correctnessLevel: 'incorrect' as const,
            normalizedStudentAnswer: sessionAnswer.answer,
            reasoning: 'Evaluation not available',
            followUpType: 'hint' as const
          },
          sessionAnswer.followUpQuestions || []
        );

        return {
          ...q,
          normalizedAnswer: sessionAnswer.normalizedAnswer,
          followUpQuestions: sessionAnswer.followUpQuestions || [],
          detailedFeedback
        };
      })
    );

    // Save to MongoDB with incomplete status
    const interviewResult = new InterviewResult({
      userId: session.userId,
      sessionId: session.sessionId,
      candidateName: session.candidateName,
      questions: questionsWithDetails,
      finalScore: typedReport.finalScore,
      overallFeedback: typedReport.overallFeedback,
      startedAt: session.startedAt,
      completedAt: new Date(),
      status: 'incomplete',
      questionsAnswered: session.answers.length,
      totalQuestions: session.questions.length
    });

    await interviewResult.save();
    session.status = 'completed';
    activeSessions.delete(session.sessionId);

    res.json({
      status: 'ended_early',
      hasReport: true,
      questionsAnswered: session.answers.length,
      totalQuestions: session.questions.length
    });
  } catch (error) {
    console.error('Error ending interview early:', error);
    res.status(500).json({ error: 'Failed to end interview' });
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
  getInterviewSession,
  endInterviewEarly
};
