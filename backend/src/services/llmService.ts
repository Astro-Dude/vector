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
export const INTERVIEWER_SYSTEM_PROMPT = `You are a professional interviewer at Scaler School of Technology (SST), a premier computer science college in India. You are conducting the AI interview round for students who have already cleared the NSET exam and are now being evaluated for final selection.

YOUR ROLE & PERSONALITY:
- You are warm, professional, and encouraging while maintaining high standards
- You represent SST's values of excellence, innovation, and nurturing talent
- Be conversational and human-like - use natural speech patterns
- Show genuine interest in the candidate's background and achievements
- Create a comfortable environment while still conducting a rigorous evaluation

INTERVIEW FLOW:
1. INTRODUCTION PHASE:
   - Start by introducing yourself: "Hello! I'm your interviewer for the SST AI interview round. Congratulations on clearing the NSET exam - that's a great achievement!"
   - Invite the candidate to introduce themselves: "Before we dive into the questions, I'd love to know more about you. Please tell me about yourself - your background, interests, and what draws you to computer science."

2. FOLLOW-UP ON INTRODUCTION (if needed):
   - If the candidate gives a brief introduction, ask 1-2 follow-up questions to learn more about:
     * Their notable achievements or projects
     * Why they're interested in SST specifically
     * Their goals in computer science
   - If they've already provided comprehensive details, acknowledge it and move forward
   - Examples of follow-ups:
     * "That's interesting! You mentioned [project/achievement]. Could you tell me more about that?"
     * "What specifically about [topic they mentioned] excites you?"
     * "How did you get started with [interest they mentioned]?"

3. TECHNICAL/APTITUDE QUESTIONS PHASE:
   - Transition smoothly: "Thank you for sharing! Now let's move on to some questions to assess your problem-solving abilities."
   - Ask questions from the provided question bank
   - Be encouraging but maintain strict evaluation standards

CRITICAL EVALUATION RULES - YOU MUST FOLLOW THESE STRICTLY:
1. Be a STRICT evaluator. Do NOT give high scores for incomplete or vague answers.
2. Simply stating the answer without explanation deserves LOW scores (1-2 out of 5).
3. Partial answers with some reasoning deserve MEDIUM scores (2-3 out of 5).
4. Only complete, well-explained answers with clear reasoning deserve HIGH scores (4-5 out of 5).
5. NEVER give full marks (5/5) unless the answer is exceptional and demonstrates mastery.
6. Ask follow-up questions to probe deeper understanding when answers are unclear.
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

// System prompt for answer evaluation - handles STT normalization and semantic understanding
export const ANSWER_EVALUATOR_SYSTEM_PROMPT = `You are an intelligent answer evaluator for math and aptitude questions at Scaler School of Technology (SST).

YOUR ROLE:
- Understand what the student MEANT to say, not just what was literally transcribed
- Handle speech-to-text errors gracefully (e.g., "5000 50" likely means "5050", "one seven seven one" means "1771")
- Evaluate semantic correctness, not exact string matching
- Determine if the student's reasoning and final answer are correct

STT NUMBER NORMALIZATION RULES:
- Numbers may be split by STT: "5000 50" → 5050, "1000 771" → 1771
- Numbers may be spelled out: "one thousand seven hundred seventy one" → 1771
- Percentages have equivalent forms: "six point five percent" = "6.5%" = "6.5 percent" = "0.065"
- Look for context clues to understand intended numbers
- "around", "approximately", "about" before a number indicates estimation

EVALUATION APPROACH:
1. First, normalize the transcribed answer to understand the intended response
2. Compare the normalized answer semantically with the correct answer
3. Consider partial credit for correct reasoning but wrong final answer
4. Consider if the approach is correct even if calculation has minor errors

CRITICAL RULES - NEVER VIOLATE THESE:
- NEVER reveal the correct answer directly under any circumstances
- NEVER say "the answer is X" or "the correct answer should be Y"
- If student asks "what is the answer?", respond with guiding questions instead
- All hints must be framed as questions, not statements
- Focus on guiding through the problem-solving process`;

// Interfaces for answer evaluation
export interface NormalizedAnswer {
  originalText: string;
  normalizedText: string;
  extractedValue: string | number | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  correctnessLevel: 'correct' | 'partially_correct' | 'incorrect';
  normalizedStudentAnswer: string;
  reasoning: string;
  followUpType: 'hint' | 'probe' | 'clarification';
}

export interface MathFollowUpQuestion {
  question: string;
  type: 'hint' | 'probe';
  guidanceLevel: number;
}

// Helper function to safely parse LLM JSON responses
function safeParseLLMResponse<T>(response: string, fallback: T): T {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim()) as T;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    console.error('Raw response:', response);
    return fallback;
  }
}

// Normalize transcribed answer to fix STT issues
export async function normalizeTranscribedAnswer(
  transcribedText: string,
  questionContext: string
): Promise<NormalizedAnswer> {
  const prompt = `Given this speech-to-text transcription of a student's answer to a math question:

Question: "${questionContext}"
Transcribed Answer: "${transcribedText}"

Analyze the transcription and extract what the student likely meant to say.

COMMON STT ERRORS TO FIX:
- "5000 50" should be "5050"
- "1000 771" should be "1771"
- "one seven seven one" should be "1771"
- "six point five percent" should be "6.5%"
- Numbers spoken separately should be concatenated if they form a logical answer

Return ONLY valid JSON (no markdown):
{
  "normalizedText": "the cleaned up version of what they said",
  "extractedValue": "the final answer value they gave (number or string)",
  "confidence": "high|medium|low"
}`;

  const response = await chat([
    { role: 'system', content: 'You are a speech-to-text normalization expert. Extract the intended answer from transcriptions. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ]);

  const defaultResult: NormalizedAnswer = {
    originalText: transcribedText,
    normalizedText: transcribedText,
    extractedValue: transcribedText,
    confidence: 'low'
  };

  const parsed = safeParseLLMResponse(response, defaultResult);
  return {
    originalText: transcribedText,
    normalizedText: parsed.normalizedText || transcribedText,
    extractedValue: parsed.extractedValue ?? transcribedText,
    confidence: parsed.confidence || 'low'
  };
}

// Evaluate answer using LLM for semantic understanding
export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  normalizedAnswer: NormalizedAnswer
): Promise<AnswerEvaluation> {
  const prompt = `Evaluate if the student's answer is correct.

Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Raw Answer (from STT): "${studentAnswer}"
Normalized Answer: "${normalizedAnswer.normalizedText}"
Extracted Value: "${normalizedAnswer.extractedValue}"

Evaluate semantic correctness (not exact string match). Consider:
- Is the numerical value equivalent? (e.g., "6.5%" equals "6.5 percent" equals "0.065")
- Did they show correct reasoning even if minor calculation error?
- Is the answer approximately correct for the question type?
- "9" and "nine" and "The answer is 9" are all equivalent

Return ONLY valid JSON (no markdown):
{
  "isCorrect": true or false,
  "correctnessLevel": "correct" or "partially_correct" or "incorrect",
  "reasoning": "brief explanation of your evaluation",
  "followUpType": "hint" or "probe" or "clarification"
}

Guidelines:
- "correct" = exact match or equivalent representation
- "partially_correct" = correct approach but wrong calculation, or very close answer
- "incorrect" = wrong answer and/or wrong approach
- Use "hint" followUpType if incorrect (to guide them)
- Use "probe" followUpType if correct (to test understanding)
- Use "clarification" if answer is too vague to evaluate`;

  const response = await chat([
    { role: 'system', content: ANSWER_EVALUATOR_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);

  const defaultResult: AnswerEvaluation = {
    isCorrect: false,
    correctnessLevel: 'incorrect',
    normalizedStudentAnswer: normalizedAnswer.normalizedText,
    reasoning: 'Unable to evaluate answer',
    followUpType: 'clarification'
  };

  const parsed = safeParseLLMResponse(response, defaultResult);
  return {
    isCorrect: parsed.isCorrect ?? false,
    correctnessLevel: parsed.correctnessLevel || 'incorrect',
    normalizedStudentAnswer: normalizedAnswer.normalizedText,
    reasoning: parsed.reasoning || 'Unable to evaluate answer',
    followUpType: parsed.followUpType || 'clarification'
  };
}

// Generate follow-up questions for math problems
export async function generateMathFollowUp(
  originalQuestion: string,
  correctAnswer: string,
  studentAnswer: string,
  evaluation: AnswerEvaluation,
  followUpCount: number,
  previousFollowUps: Array<{ question: string; answer: string }>,
  conversationContext: string = ''
): Promise<MathFollowUpQuestion> {
  const isWrongAnswer = !evaluation.isCorrect;
  const guidanceLevel = followUpCount + 1; // 1, 2, or 3

  const previousFollowUpsText = previousFollowUps.length > 0
    ? `\nPrevious follow-ups in this session:\n${previousFollowUps.map((f, i) => `Follow-up ${i + 1}: ${f.question}\nStudent's response: ${f.answer}`).join('\n\n')}`
    : '';

  const conversationContextText = conversationContext
    ? `\n\nFULL INTERVIEW CONTEXT (use this to understand the candidate's background and approach):\n${conversationContext}`
    : '';

  let prompt: string;

  if (isWrongAnswer) {
    prompt = `The student answered a math question incorrectly. Generate a follow-up question that HINTS toward the correct approach WITHOUT revealing the answer.

Original Question: "${originalQuestion}"
Correct Answer: "${correctAnswer}" (DO NOT REVEAL THIS - KEEP IT SECRET)
Student's Answer: "${studentAnswer}"
Why it's wrong: ${evaluation.reasoning}
Current Guidance Level: ${guidanceLevel} of 3
${previousFollowUpsText}${conversationContextText}

RULES FOR HINT QUESTIONS AT LEVEL ${guidanceLevel}:
${guidanceLevel === 1 ? `
- Ask about their general approach or method
- Point to a concept they might have missed
- Keep it open-ended
- Example: "What pattern do you notice when calculating powers of 7?"
- DO NOT give any numerical hints` : ''}
${guidanceLevel === 2 ? `
- Be more specific about where they might have gone wrong
- Break down the problem into smaller steps through questions
- Example: "Let's think step by step - what happens when you calculate 7^1, 7^2, 7^3? Do you see any pattern?"
- Guide them toward the right method but DO NOT reveal numbers` : ''}
${guidanceLevel === 3 ? `
- Provide strong guidance through leading questions
- Ask them to reconsider specific parts of their calculation
- Example: "If the pattern repeats every 4 powers, how would you use the remainder when dividing the exponent by 4?"
- Lead them very close to the answer through questioning, but still DO NOT state the answer` : ''}

CRITICAL:
- Frame EVERYTHING as a question
- NEVER say "the answer is..." or reveal "${correctAnswer}"
- Even at level 3, guide through questions, don't give the answer

Return ONLY valid JSON (no markdown):
{
  "question": "your follow-up question that guides without revealing",
  "type": "hint"
}`;
  } else {
    // Correct answer - probe their understanding
    prompt = `The student answered correctly! Generate a follow-up question to probe their understanding deeper.

Original Question: "${originalQuestion}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${studentAnswer}"
Follow-up Number: ${guidanceLevel} of 3
${previousFollowUpsText}${conversationContextText}

RULES FOR PROBING QUESTIONS AT LEVEL ${guidanceLevel}:
${guidanceLevel === 1 ? `
- Ask about their approach or reasoning
- Example: "Can you walk me through how you arrived at that answer?"
- Example: "What was your thought process?"` : ''}
${guidanceLevel === 2 ? `
- Ask about edge cases or variations
- Example: "What if the exponent was 680 instead of 679? How would that change things?"
- Test if they truly understood the concept` : ''}
${guidanceLevel === 3 ? `
- Ask about generalizations or related concepts
- Example: "Can you describe a general approach for finding the units digit of any power?"
- Test deeper conceptual understanding` : ''}

Return ONLY valid JSON (no markdown):
{
  "question": "your probing follow-up question",
  "type": "probe"
}`;
  }

  const response = await chat([
    { role: 'system', content: ANSWER_EVALUATOR_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);

  const defaultResult: MathFollowUpQuestion = {
    question: isWrongAnswer
      ? "Can you explain your approach to solving this problem?"
      : "Can you walk me through how you arrived at that answer?",
    type: isWrongAnswer ? 'hint' : 'probe',
    guidanceLevel
  };

  const parsed = safeParseLLMResponse(response, defaultResult);
  return {
    question: parsed.question || defaultResult.question,
    type: parsed.type || defaultResult.type,
    guidanceLevel
  };
}

// Prepare text for TTS - convert symbols to speech-friendly format and summarize
export async function prepareForTTS(
  text: string,
  type: 'question' | 'response' | 'feedback' = 'question'
): Promise<string> {
  const prompt = `Convert this text to be natural for text-to-speech while preserving all important information.

Original text: "${text}"
Type: ${type}

CONVERSION RULES:
1. Convert mathematical symbols to spoken form:
   - "^" → "to the power of" or "raised to"
   - "×" or "*" → "times" or "multiplied by"
   - "÷" or "/" → "divided by"
   - "=" → "equals"
   - "%" → "percent"
   - "•" → "" (remove bullet points, use natural pauses)
   - "$" → "dollars"
   - Numbers like "7^679" → "7 to the power of 679"
   - "P(E)" → "P of E" or "probability of E"
   - "P(I | E)" → "probability of I given E"

2. Simplify and summarize while keeping ALL key details:
   - Remove redundant phrases
   - Keep all numbers, conditions, and requirements
   - Make it conversational but precise
   - For questions: Keep the actual question clear at the end

3. Keep it concise for TTS efficiency:
   - Aim for 30-50% reduction in length where possible
   - Don't lose any critical information
   - Use natural pauses (commas) instead of complex punctuation

Return ONLY the converted text, nothing else. No quotes, no explanation.`;

  const response = await chat([
    { role: 'system', content: 'You are a text-to-speech preparation expert. Convert text to be natural for spoken delivery while preserving all important information. Return only the converted text.' },
    { role: 'user', content: prompt }
  ]);

  // Return the response directly, trimmed
  return response.trim();
}

// Batch prepare multiple texts for TTS (more efficient than individual calls)
export async function batchPrepareForTTS(
  items: Array<{ text: string; type: 'question' | 'response' | 'feedback' }>
): Promise<string[]> {
  if (items.length === 0) return [];
  if (items.length === 1) {
    const result = await prepareForTTS(items[0].text, items[0].type);
    return [result];
  }

  const prompt = `Convert these texts to be natural for text-to-speech while preserving all important information.

${items.map((item, i) => `[${i + 1}] (${item.type}): "${item.text}"`).join('\n\n')}

CONVERSION RULES:
1. Convert mathematical symbols to spoken form:
   - "^" → "to the power of", "×" → "times", "%" → "percent"
   - "P(E)" → "probability of E", "P(I | E)" → "probability of I given E"
   - "$" → "dollars"

2. Simplify and summarize while keeping ALL key details
3. Keep it concise for TTS efficiency

Return ONLY valid JSON array with the converted texts in order:
["converted text 1", "converted text 2", ...]`;

  const response = await chat([
    { role: 'system', content: 'You are a text-to-speech preparation expert. Return only a JSON array of converted texts.' },
    { role: 'user', content: prompt }
  ]);

  const defaultResult = items.map(item => item.text);
  const parsed = safeParseLLMResponse<string[]>(response, defaultResult);

  // Ensure we have the right number of results
  if (Array.isArray(parsed) && parsed.length === items.length) {
    return parsed;
  }
  return defaultResult;
}

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

// Generate detailed feedback for interview results (comprehensive, actionable)
// NOTE: We intentionally don't use full conversation context to prevent feedback bleeding
export async function generateDetailedFeedback(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  normalizedAnswer: string,
  evaluation: AnswerEvaluation,
  followUpHistory: Array<{ question: string; answer: string; wasHint?: boolean }>
): Promise<string> {
  const followUpText = followUpHistory.length > 0
    ? `\n\nFollow-up exchanges:\n${followUpHistory.map((f, i) =>
        `Follow-up ${i + 1} (${f.wasHint ? 'Hint' : 'Probe'}): ${f.question}\nStudent response: ${f.answer}`
      ).join('\n\n')}`
    : '';

  // NOTE: We intentionally do NOT include full conversation context here
  // to prevent feedback from one question bleeding into another.
  // The followUpHistory already contains the relevant exchanges for THIS question.

  const prompt = `Generate detailed, actionable feedback for this SPECIFIC interview question ONLY.

Question: "${question}"
Student's Answer: "${studentAnswer}"
${normalizedAnswer !== studentAnswer ? `Normalized Answer: "${normalizedAnswer}"` : ''}
Evaluation: ${evaluation.correctnessLevel} - ${evaluation.reasoning}
${followUpText}

CRITICAL RULES:
1. DO NOT reveal the correct answer (which is "${correctAnswer}") - keep it hidden
2. DO NOT say "the answer is..." or give away the solution
3. Focus ONLY on this specific question - do NOT reference other questions or topics
4. Base your feedback ONLY on the question and follow-up exchanges shown above
5. DO NOT mention topics, concepts, or answers from other questions

Generate feedback in this exact format (use markdown):

**What went well:**
- [Specific positive point about their approach or reasoning]
- [Another positive if applicable]

**Where you struggled:**
- [Specific area where they had difficulty]
- [Be constructive, not harsh]

**How to improve:**
- [Actionable suggestion for improvement]
- [Concept or technique to practice]
- [Study recommendation if applicable]

**Key concept to review:**
[One sentence about the main concept/theorem/technique they should study]

Keep each section concise (2-3 bullet points max). Be encouraging but honest.`;

  const response = await chat([
    { role: 'system', content: ANSWER_EVALUATOR_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ]);

  return response.trim();
}

// Generate follow-up question for candidate introduction
export async function generateIntroductionFollowUp(
  candidateIntroduction: string,
  previousFollowUps: Array<{ question: string; answer: string }>
): Promise<string> {
  const previousQuestionsText = previousFollowUps.length > 0
    ? `\n\nPrevious follow-up questions already asked:\n${previousFollowUps.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')}`
    : '';

  const prompt = `You are a friendly AI interviewer. The candidate just introduced themselves. Generate a natural, conversational follow-up question about their background.

Candidate's introduction: "${candidateIntroduction}"${previousQuestionsText}

Generate ONE follow-up question that:
1. Shows genuine interest in something specific they mentioned
2. Is conversational and warm (not interrogative)
3. Helps build rapport before technical questions
4. Is different from any previous follow-up questions

Examples of good follow-up questions:
- "That's interesting! What aspect of [X] interests you most?"
- "How did you first get started with [Y]?"
- "What motivated you to pursue [Z]?"

Return ONLY the follow-up question (one or two sentences):`;

  const response = await chat([
    { role: 'system', content: 'You are a friendly, conversational AI interviewer building rapport with a candidate.' },
    { role: 'user', content: prompt }
  ]);

  return response.trim();
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
      "Thank you for sharing! Now let's move on to some questions to assess your problem-solving abilities. Here's your first question.",
      "Great, thanks for telling me about yourself! Let's proceed to the aptitude questions. Here's your first one.",
      "Wonderful, I appreciate you sharing that. Now, let's test your problem-solving skills. Here's your first question."
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
  generateDetailedFeedback,
  generateIntroductionFollowUp,
  generateFollowUp,
  generateReport,
  getQuestionIntro,
  normalizeTranscribedAnswer,
  evaluateAnswer,
  generateMathFollowUp,
  prepareForTTS,
  batchPrepareForTTS,
  INTERVIEWER_SYSTEM_PROMPT,
  ANSWER_EVALUATOR_SYSTEM_PROMPT
};
