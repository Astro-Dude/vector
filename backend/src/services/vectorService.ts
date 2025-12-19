import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

// Memory types for structured storage
export type MemoryType =
  | 'session_start'
  | 'introduction_ask'
  | 'introduction_answer'
  | 'introduction_followup'
  | 'main_question'
  | 'main_answer'
  | 'follow_up_question'
  | 'follow_up_answer'
  | 'evaluation';

export interface MemoryMetadata {
  type: MemoryType;
  questionIndex?: number;
  followUpNumber?: number;
  category?: string;
  isCorrect?: boolean;
  candidateName?: string;
  [key: string]: unknown;
}

// Store memory without embeddings - just store the text content
// We'll use simple text matching for recall instead of vector similarity
export async function storeMemory(
  sessionId: string,
  text: string,
  metadata?: MemoryMetadata | Record<string, unknown>
): Promise<void> {
  try {
    const client = getSupabaseClient();

    const { error } = await client.from('interview_memories').insert({
      session_id: sessionId,
      content: text,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error storing memory in Supabase:', error);
      // Don't throw - fail gracefully
    } else {
      console.log('[VectorDB] Memory stored for session:', sessionId, '- Type:', (metadata as MemoryMetadata)?.type || 'unknown');
    }
  } catch (error) {
    console.error('Vector DB storeMemory error:', error);
    // Fail gracefully - don't throw
  }
}

// Recall memories for a session - returns all memories for context
// Without embeddings, we just return recent memories for the session
export async function recallMemory(
  sessionId: string,
  _query: string,
  limit: number = 20 // Increased default limit for better context
): Promise<string[]> {
  try {
    const client = getSupabaseClient();

    // Simple query - get recent memories for this session
    const { data, error } = await client
      .from('interview_memories')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error recalling memory from Supabase:', error);
      return [];
    }

    const memories = (data || []).map((item: { content: string }) => item.content);
    if (memories.length > 0) {
      console.log(`[VectorDB] Recalled ${memories.length} memories for session:`, sessionId);
    }
    return memories;
  } catch (error) {
    console.error('Vector DB recallMemory error:', error);
    return []; // Fail gracefully - return empty array
  }
}

// Get full conversation history in chronological order for LLM context
export async function getFullConversationHistory(
  sessionId: string
): Promise<Array<{ content: string; metadata: MemoryMetadata; created_at: string }>> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('interview_memories')
      .select('content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }); // Chronological order

    if (error) {
      console.error('Error getting conversation history from Supabase:', error);
      return [];
    }

    const history = (data || []).map((item: { content: string; metadata: MemoryMetadata; created_at: string }) => ({
      content: item.content,
      metadata: item.metadata,
      created_at: item.created_at
    }));

    if (history.length > 0) {
      console.log(`[VectorDB] Retrieved ${history.length} conversation entries for session:`, sessionId);
    }
    return history;
  } catch (error) {
    console.error('Vector DB getFullConversationHistory error:', error);
    return [];
  }
}

// Format conversation history as a string for LLM context
export async function getFormattedConversationContext(
  sessionId: string
): Promise<string> {
  const history = await getFullConversationHistory(sessionId);

  if (history.length === 0) {
    return '';
  }

  const formatted = history.map(entry => {
    const type = entry.metadata?.type || 'unknown';
    const prefix = getTypePrefix(type);
    return `${prefix}: ${entry.content}`;
  }).join('\n\n');

  return `=== CONVERSATION HISTORY ===\n${formatted}\n=== END HISTORY ===`;
}

// Helper to get display prefix for memory type
function getTypePrefix(type: MemoryType | string): string {
  const prefixes: Record<string, string> = {
    'session_start': '[Session Started]',
    'introduction_ask': '[Interviewer - Introduction]',
    'introduction_answer': '[Candidate - Introduction]',
    'introduction_followup': '[Introduction Follow-up]',
    'main_question': '[Interviewer - Question]',
    'main_answer': '[Candidate - Answer]',
    'follow_up_question': '[Interviewer - Follow-up]',
    'follow_up_answer': '[Candidate - Follow-up Response]',
    'evaluation': '[Evaluation]',
    'qa_pair': '[Q&A]',
    'follow_up': '[Follow-up Exchange]'
  };
  return prefixes[type] || '[Entry]';
}

// Initialize the Supabase table for interview memories (run once)
// Simplified version without vector/embedding columns
export async function initializeVectorTable(): Promise<void> {
  console.log(`
    To set up the memory database, run this SQL in Supabase SQL Editor:

    -- Create interview memories table (simplified - no embeddings)
    CREATE TABLE IF NOT EXISTS interview_memories (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create index for session filtering
    CREATE INDEX IF NOT EXISTS interview_memories_session_idx
    ON interview_memories (session_id);

    -- Create index for recent queries
    CREATE INDEX IF NOT EXISTS interview_memories_created_idx
    ON interview_memories (created_at DESC);
  `);
}

export default {
  storeMemory,
  recallMemory,
  getFullConversationHistory,
  getFormattedConversationContext,
  initializeVectorTable
};
