import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SoulMemory = {
  id: string;
  nucleus_id: string;
  agent_id: string | null;
  session_id: string | null;
  content: string;
  memory_type: string;
  metadata: Record<string, unknown>;
  importance: number;
  confidence: number;
  similarity: number;
  created_at: string;
};

export type SupabaseVectorMemoryOptions = {
  apiKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseAnonKey?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  nucleusId?: string;
  timeoutMs?: number;
};

const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TIMEOUT_MS = 8_000;

export class SupabaseVectorMemory {
  private readonly apiKey: string;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly embeddingModel: string;
  private readonly embeddingDimensions: number;
  private readonly nucleusId: string;
  private readonly timeoutMs: number;

  constructor(options: SupabaseVectorMemoryOptions = {}) {
    this.apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY ?? '').trim();
    this.supabaseUrl = (options.supabaseUrl ?? process.env.SUPABASE_URL ?? '').trim();
    this.supabaseKey = (
      options.supabaseKey ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      options.supabaseAnonKey ??
      process.env.SUPABASE_ANON_KEY ??
      ''
    ).trim();
    this.embeddingModel = (options.embeddingModel ?? process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL).trim();
    this.embeddingDimensions = Number(options.embeddingDimensions ?? process.env.GEMINI_EMBEDDING_DIMENSIONS ?? DEFAULT_DIMENSIONS);
    this.nucleusId = (options.nucleusId ?? process.env.SOUL_NUCLEUS_ID ?? 'N01').trim() || 'N01';
    this.timeoutMs = Math.max(1000, Number(options.timeoutMs ?? process.env.SOUL_MEMORY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS));
  }

  private client(): SupabaseClient | null {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) return null;
      return createClient(this.supabaseUrl, this.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(this.timeoutMs) }),
        },
      });
    } catch {
      return null;
    }
  }

  private async embedding(text: string, apiKey?: string): Promise<number[] | null> {
    try {
      const key = (apiKey ?? this.apiKey).trim();
      if (!key || !text.trim()) return null;
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
        config: { outputDimensionality: this.embeddingDimensions },
      });
      const values = response.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length !== this.embeddingDimensions) return null;
      return values.map(Number);
    } catch {
      return null;
    }
  }

  async recall(
    text: string,
    options: { apiKey?: string; sessionId?: string; threshold?: number; limit?: number } = {},
  ): Promise<SoulMemory[]> {
    try {
      const input = typeof text === 'string' ? text.trim() : '';
      if (!input) return [];
      const client = this.client();
      if (!client) return [];
      const vector = await this.embedding(input, options.apiKey);
      if (!vector) return [];
      const { data, error } = await client.rpc('match_soul_memories', {
        query_embedding: vector,
        match_threshold: Math.max(0, Math.min(1, Number(options.threshold ?? 0.70))),
        match_count: Math.max(1, Math.min(100, Number(options.limit ?? 8))),
        filter_nucleus_id: null,
        filter_session_id: options.sessionId ?? null,
      });
      if (error || !Array.isArray(data)) return [];
      return data as SoulMemory[];
    } catch {
      return [];
    }
  }

  async remember(
    content: string,
    options: {
      apiKey?: string;
      agentId?: string;
      sessionId?: string;
      memoryType?: string;
      metadata?: Record<string, unknown>;
      importance?: number;
      confidence?: number;
    } = {},
  ): Promise<boolean> {
    try {
      const input = typeof content === 'string' ? content.trim() : '';
      const client = this.client();
      if (!input || !client) return false;
      const vector = await this.embedding(input, options.apiKey);
      if (!vector) return false;
      const { error } = await client.from('soul_memories').insert({
        nucleus_id: this.nucleusId,
        agent_id: options.agentId ?? null,
        session_id: options.sessionId ?? null,
        content: input,
        embedding: vector,
        memory_type: options.memoryType ?? 'episodic',
        metadata: options.metadata ?? {},
        importance: Math.max(0, Math.min(1, Number(options.importance ?? 0.5))),
        confidence: Math.max(0, Math.min(1, Number(options.confidence ?? 0.5))),
      });
      return !error;
    } catch {
      return false;
    }
  }
}

export const createSupabaseVectorMemory = (options?: SupabaseVectorMemoryOptions) => new SupabaseVectorMemory(options);
