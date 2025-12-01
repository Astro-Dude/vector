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

// Store memory without embeddings - just store the text content
// We'll use simple text matching for recall instead of vector similarity
export async function storeMemory(
  sessionId: string,
  text: string,
  metadata?: Record<string, unknown>
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
      console.log('[VectorDB] Memory stored for session:', sessionId);
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
  limit: number = 5
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
  initializeVectorTable
};
