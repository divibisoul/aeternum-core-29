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
  embeddingModel?: string;
  embeddingDimensions?: number;
  nucleusId?: string;
  timeoutMs?: number;
};

const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TIMEOUT_MS = 8_000;

function env(name: string): string {
  try {
    return typeof process !== 'undefined' && typeof process.env?.[name] === 'string'
      ? process.env[name]!.trim()
      : '';
  } catch {
    return '';
  }
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function timeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(Math.max(1_000, timeoutMs));
  }
  return undefined;
}

function resolveSupabaseKey(explicit?: string): string {
  return (
    explicit?.trim()
    || env('SUPABASE_SECRET_KEY')
    || env('SUPABASE_SERVICE_ROLE_KEY')
    || env('SUPABASE_ANON_KEY')
  ).trim();
}

export class SupabaseVectorMemory {
  private readonly apiKey: string;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly embeddingModel: string;
  private readonly embeddingDimensions: number;
  private readonly nucleusId: string;
  private readonly timeoutMs: number;

  constructor(options: SupabaseVectorMemoryOptions = {}) {
    this.apiKey = (options.apiKey ?? env('GEMINI_API_KEY')).trim();
    this.supabaseUrl = (options.supabaseUrl ?? env('SUPABASE_URL')).trim();
    this.supabaseKey = resolveSupabaseKey(options.supabaseKey);
    this.embeddingModel = (
      options.embeddingModel ?? env('GEMINI_EMBEDDING_MODEL') ?? DEFAULT_EMBEDDING_MODEL
    ).trim();

    const requestedDimensions = Number(
      options.embeddingDimensions ?? env('GEMINI_EMBEDDING_DIMENSIONS') ?? DEFAULT_DIMENSIONS,
    );
    this.embeddingDimensions = requestedDimensions === DEFAULT_DIMENSIONS
      ? DEFAULT_DIMENSIONS
      : DEFAULT_DIMENSIONS;

    this.nucleusId = (options.nucleusId ?? 'N01').trim() || 'N01';
    this.timeoutMs = Math.max(
      1_000,
      Number(options.timeoutMs ?? env('SOUL_MEMORY_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS),
    );
  }

  private client(): SupabaseClient | null {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) return null;
      return createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) => {
            const signal = timeoutSignal(this.timeoutMs);
            return fetch(input, signal ? { ...init, signal } : init);
          },
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
      if (!Array.isArray(values) || values.length !== DEFAULT_DIMENSIONS) return null;
      return values.map(Number);
    } catch {
      return null;
    }
  }

  async recall(
    text: string,
    options: {
      apiKey?: string;
      sessionId?: string;
      threshold?: number;
      limit?: number;
    } = {},
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
        match_threshold: clamp(Number(options.threshold ?? 0.70)),
        match_count: Math.max(1, Math.min(100, Number(options.limit ?? 8))),
        filter_nucleus_id: null,
        filter_session_id: options.sessionId?.trim() || null,
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
      if (!input) return false;

      const client = this.client();
      if (!client) return false;

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
        importance: clamp(Number(options.importance ?? 0.5)),
        confidence: clamp(Number(options.confidence ?? 0.5)),
      });

      return !error;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = this.client();
      if (!client) return false;
      const { error } = await client.from('soul_memories').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export const createSupabaseVectorMemory = (
  options?: SupabaseVectorMemoryOptions,
) => new SupabaseVectorMemory(options);
