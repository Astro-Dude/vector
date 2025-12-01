import Groq from 'groq-sdk';
import OpenAI from 'openai';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENAI_FALLBACK_MODEL = 'gpt-4o-mini';

let groqClient: Groq | null = null;
let openaiClient: OpenAI | null = null;

const getGroqClient = (): Groq => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY!
    });
  }
  return groqClient;
};

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  return openaiClient;
};

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: 'groq' | 'openai';
}

// System prompt for the interviewer - strict evaluation
export const INTERVIEWER_SYSTEM_PROMPT = `You are a professional technical interviewer conducting a rigorous interview.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. Be a STRICT evaluator. Do NOT give high scores for incomplete or vague answers.
2. Simply stating the answer without explanation deserves LOW scores (1-2 out of 5).
3. Partial answers with some reasoning deserve MEDIUM scores (2-3 out of 5).
4. Only complete, well-explained answers with clear reasoning deserve HIGH scores (4-5 out of 5).
5. NEVER give full marks (5/5) unless the answer is exceptional and demonstrates mastery.
6. Ask follow-up questions to probe deeper understanding.
7. Be conversational and human-like in your responses.

SCORING RUBRIC - Apply this STRICTLY:

1. Correctness (0-5):
   - 0: Completely wrong or no answer
   - 1: Mostly incorrect with minor correct elements
   - 2: Partially correct but missing key points
   - 3: Correct but incomplete or with minor errors
   - 4: Fully correct with good detail
   - 5: Exceptionally correct with additional insights (RARE)

2. Reasoning (0-5):
   - 0: No reasoning provided
   - 1: Just stated the answer without explanation
   - 2: Some reasoning but shallow or incomplete
   - 3: Decent reasoning with logical steps
   - 4: Strong reasoning with clear thought process
   - 5: Exceptional reasoning with deep understanding (RARE)

3. Clarity (0-5):
   - 0: Incomprehensible or no response
   - 1: Very unclear, hard to follow
   - 2: Somewhat clear but disorganized
   - 3: Clear enough to understand main points
   - 4: Well-structured and easy to follow
   - 5: Exceptionally clear and articulate (RARE)

4. Problem-Solving (0-5):
   - 0: No problem-solving approach shown
   - 1: Poor approach, no methodology
   - 2: Basic approach but inefficient
   - 3: Reasonable approach with some structure
   - 4: Good systematic approach
   - 5: Excellent, optimal approach (RARE)

IMPORTANT SCORING EXAMPLES:
- "The answer is 42" → Correctness: 3-4, Reasoning: 1, Clarity: 2, Problem-Solving: 1 (Total: ~4/10)
- "I think it's around 40 something" → Correctness: 2, Reasoning: 1, Clarity: 2, Problem-Solving: 1 (Total: ~3/10)
- Full explanation with steps → Can score 7-8/10 if complete
- Only perfect, exceptional answers score 9-10/10

Always return valid JSON in the exact format requested. Never hallucinate data.`;

// Generate brief spoken feedback (4-5 words for TTS)
export async function generateSpokenFeedback(
  question: string,
  answer: string
): Promise<string> {
  const prompt = `The candidate answered: "${answer}" to the question: "${question}"

Generate a VERY brief spoken acknowledgment (4-6 words ONLY). Examples:
- "Good explanation, thank you."
- "Interesting approach there."
- "Okay, got it."
- "That's a fair point."
- "Alright, moving on."
- "I see your reasoning."

Just the brief acknowledgment, nothing else:`;

  return await chat([
    { role: 'system', content: 'You are giving brief verbal acknowledgments. Keep responses to 4-6 words only.' },
    { role: 'user', content: prompt }
  ]);
}

// Generate detailed feedback for storage (not spoken)
export async function generateFeedback(
  question: string,
  answer: string,
  memoryContext: string[] = []
): Promise<string> {
  const contextString = memoryContext.length > 0
    ? `\n\nPrevious context from this session:\n${memoryContext.join('\n')}`
    : '';

  const prompt = `The candidate was asked: "${question}"

Their answer was: "${answer}"
${contextString}

Provide brief constructive feedback (2-3 sentences). Be specific about what was good and what could be improved. Do NOT be overly positive if the answer was incomplete or wrong.`;

  return await chat([
    { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);
}

// Generate follow-up question based on the answer
export async function generateFollowUp(
  question: string,
  answer: string
): Promise<string | null> {
  const prompt = `Original question: "${question}"
Candidate's answer: "${answer}"

Based on their answer, generate a brief follow-up question to probe their understanding deeper. The follow-up should:
1. Test if they truly understand or just memorized
2. Ask them to elaborate on a specific point
3. Present a variation or edge case

If the answer was too vague or incomplete, the follow-up should ask them to explain their reasoning.

Return ONLY the follow-up question (one sentence), or return "NONE" if no follow-up is needed:`;

  const response = await chat([
    { role: 'system', content: 'You are a technical interviewer asking follow-up questions.' },
    { role: 'user', content: prompt }
  ]);

  if (response.trim().toUpperCase() === 'NONE') {
    return null;
  }
  return response.trim();
}

// Generate the final interview report with detailed scoring
export async function generateReport(
  candidateName: string,
  sessionId: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<object> {
  const qaString = questionsAndAnswers
    .map((qa, i) => `Question ${i + 1}: ${qa.question}\nAnswer: ${qa.answer}`)
    .join('\n\n');

  const prompt = `Evaluate this interview STRICTLY. Do NOT be lenient.

Candidate: ${candidateName}
Session ID: ${sessionId}

${qaString}

SCORING REMINDERS:
- Simply stating an answer without explanation = LOW scores (total 3-4/10)
- Partial explanation = MEDIUM scores (total 5-6/10)
- Good explanation with reasoning = GOOD scores (total 7-8/10)
- Only exceptional, complete answers = HIGH scores (9-10/10)
- NEVER give 5/5 on any criterion unless truly exceptional

Return ONLY valid JSON (no markdown, no code blocks):
{
  "candidate": {
    "name": "${candidateName}",
    "sessionId": "${sessionId}"
  },
  "questions": [
    {
      "question": "the question text",
      "answer": "the candidate's answer",
      "scores": {
        "correctness": {
          "score": 0,
          "reason": "Brief explanation why this score"
        },
        "reasoning": {
          "score": 0,
          "reason": "Brief explanation why this score"
        },
        "clarity": {
          "score": 0,
          "reason": "Brief explanation why this score"
        },
        "problemSolving": {
          "score": 0,
          "reason": "Brief explanation why this score"
        }
      },
      "total": 0,
      "feedback": {
        "whatWentRight": ["specific positive point"],
        "needsImprovement": ["specific area to improve"]
      }
    }
  ],
  "finalScore": 0,
  "overallFeedback": {
    "strengths": ["strength 1"],
    "improvementAreas": ["area 1"],
    "suggestedNextSteps": ["step 1"]
  }
}

CALCULATION:
- Each criterion is 0-5
- Total per question = ((correctness + reasoning + clarity + problemSolving) / 20) * 10
- Final score = average of question totals * 10 (to get 0-100)

BE STRICT. Most answers should score 4-7 out of 10 unless they are truly exceptional.`;

  const response = await chat([
    { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);

  try {
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);

    // Transform the nested score structure to flat for frontend compatibility
    // while keeping the reasons for display
    // Also calculate totals ourselves to ensure accuracy
    if (parsed.questions) {
      parsed.questions = parsed.questions.map((q: any) => {
        const scores = q.scores;

        // Extract numeric scores (handle both nested {score, reason} and flat number formats)
        const correctnessScore = typeof scores.correctness === 'object' ? scores.correctness.score : (scores.correctness || 0);
        const reasoningScore = typeof scores.reasoning === 'object' ? scores.reasoning.score : (scores.reasoning || 0);
        const clarityScore = typeof scores.clarity === 'object' ? scores.clarity.score : (scores.clarity || 0);
        const problemSolvingScore = typeof scores.problemSolving === 'object' ? scores.problemSolving.score : (scores.problemSolving || 0);

        // Calculate total for this question: sum of scores (max 20) scaled to 10
        const sumScores = correctnessScore + reasoningScore + clarityScore + problemSolvingScore;
        const calculatedTotal = Math.round((sumScores / 20) * 10 * 10) / 10; // Round to 1 decimal

        return {
          ...q,
          scores: {
            correctness: correctnessScore,
            reasoning: reasoningScore,
            clarity: clarityScore,
            problemSolving: problemSolvingScore
          },
          scoreReasons: {
            correctness: typeof scores.correctness === 'object' ? scores.correctness.reason : '',
            reasoning: typeof scores.reasoning === 'object' ? scores.reasoning.reason : '',
            clarity: typeof scores.clarity === 'object' ? scores.clarity.reason : '',
            problemSolving: typeof scores.problemSolving === 'object' ? scores.problemSolving.reason : ''
          },
          total: calculatedTotal
        };
      });

      // Calculate final score: average of all question totals, scaled to 100
      const questionTotals = parsed.questions.map((q: any) => q.total);
      const averageTotal = questionTotals.reduce((sum: number, t: number) => sum + t, 0) / questionTotals.length;
      parsed.finalScore = Math.round(averageTotal * 10); // Scale to 0-100
    }

    console.log('[LLM] Report generated - Final Score:', parsed.finalScore);
    return parsed;
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error);
    console.error('Raw response:', response);
    throw new Error('LLM returned invalid JSON format');
  }
}

// Generate human-like introduction for question
export function getQuestionIntro(questionIndex: number, totalQuestions: number): string {
  if (questionIndex === 0) {
    const intros = [
      "Alright, let's begin. Here's your first question.",
      "Great, let's get started. Here's your first question.",
      "Okay, we'll start with this question."
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  } else if (questionIndex === totalQuestions - 1) {
    const intros = [
      "Alright, here's your final question.",
      "Okay, last question now.",
      "Here's your last question for today."
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  } else {
    const intros = [
      "Moving on to the next question.",
      "Here's your next question.",
      "Alright, next one.",
      "Let's continue. Here's the next question."
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  }
}

// Main chat function with Groq primary and OpenAI fallback
export async function chat(
  messages: LLMMessage[],
  _maxRetries: number = 3,
  timeout: number = 30000
): Promise<string> {
  // Try Groq first
  try {
    const response = await chatWithGroq(messages, timeout);
    return response;
  } catch (groqError) {
    console.warn('Groq failed, falling back to OpenAI:', groqError);

    // Fallback to OpenAI
    try {
      const response = await chatWithOpenAI(messages, timeout);
      return response;
    } catch (openaiError) {
      console.error('OpenAI fallback also failed:', openaiError);
      throw new Error('Both Groq and OpenAI failed to respond');
    }
  }
}

async function chatWithGroq(messages: LLMMessage[], timeout: number): Promise<string> {
  const client = getGroqClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7,
      max_tokens: 4096
    });

    clearTimeout(timeoutId);
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function chatWithOpenAI(messages: LLMMessage[], timeout: number): Promise<string> {
  const client = getOpenAIClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_FALLBACK_MODEL,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7,
      max_tokens: 4096
    });

    clearTimeout(timeoutId);
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export default {
  chat,
  generateFeedback,
  generateSpokenFeedback,
  generateFollowUp,
  generateReport,
  getQuestionIntro,
  INTERVIEWER_SYSTEM_PROMPT
};
