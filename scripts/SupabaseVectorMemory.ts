import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SoulMemoryType = 'working' | 'episodic' | 'semantic' | 'procedural';

export interface SoulMemoryRecord {
  id: string;
  nucleus_id: string;
  agent_id: string | null;
  session_id: string | null;
  content: string;
  memory_type: SoulMemoryType;
  metadata: Record<string, unknown>;
  importance: number;
  confidence: number;
  similarity: number;
  created_at: string;
}

export interface SoulVectorMemoryOptions {
  supabaseUrl?: string;
  supabaseKey?: string;
  geminiApiKey?: string;
  embeddingModel?: string;
  dimensions?: number;
  timeoutMs?: number;
}

const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TIMEOUT_MS = 8_000;

function env(name: string): string {
  return typeof process !== 'undefined' && typeof process.env?.[name] === 'string'
    ? process.env[name].trim()
    : '';
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function resolveServerKey(explicit?: string): string {
  return explicit?.trim()
    || env('SUPABASE_SECRET_KEY')
    || env('SUPABASE_SERVICE_ROLE_KEY')
    || env('SUPABASE_ANON_KEY');
}

export class SupabaseVectorMemory {
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly geminiApiKey: string;
  private readonly embeddingModel: string;
  private readonly dimensions: number;
  private readonly timeoutMs: number;
  private supabase: SupabaseClient | null = null;

  constructor(options: SoulVectorMemoryOptions = {}) {
    this.supabaseUrl = options.supabaseUrl?.trim() || env('SUPABASE_URL');
    this.supabaseKey = resolveServerKey(options.supabaseKey);
    this.geminiApiKey = options.geminiApiKey?.trim() || env('GEMINI_API_KEY');
    this.embeddingModel = options.embeddingModel?.trim() || env('GEMINI_EMBEDDING_MODEL') || DEFAULT_EMBEDDING_MODEL;
    this.dimensions = Number(options.dimensions || env('GEMINI_EMBEDDING_DIMENSIONS') || DEFAULT_DIMENSIONS);
    this.timeoutMs = Math.max(1_000, Number(options.timeoutMs || env('SOUL_MEMORY_TIMEOUT_MS') || DEFAULT_TIMEOUT_MS));
  }

  private getClient(): SupabaseClient | null {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) return null;
      if (!this.supabase) {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          global: {
            fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(this.timeoutMs) }),
          },
        });
      }
      return this.supabase;
    } catch {
      return null;
    }
  }

  private async embed(text: string): Promise<number[] | null> {
    try {
      if (!this.geminiApiKey || !text.trim()) return null;
      const ai = new GoogleGenAI({ apiKey: this.geminiApiKey });
      const response = await ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
        config: { outputDimensionality: this.dimensions },
      });
      const values = response.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length !== this.dimensions) return null;
      return values.map(Number);
    } catch {
      return null;
    }
  }

  async recall(options: {
    text: string;
    sessionId?: string;
    threshold?: number;
    limit?: number;
  }): Promise<SoulMemoryRecord[]> {
    try {
      const text = options.text?.trim();
      if (!text) return [];
      const supabase = this.getClient();
      if (!supabase) return [];
      const embedding = await this.embed(text);
      if (!embedding) return [];

      const { data, error } = await supabase.rpc('match_soul_memories', {
        query_embedding: embedding,
        match_threshold: clamp(Number(options.threshold ?? 0.70)),
        match_count: Math.max(1, Math.min(100, Number(options.limit ?? 8))),
        filter_nucleus_id: null,
        filter_session_id: options.sessionId?.trim() || null,
      });

      if (error || !Array.isArray(data)) return [];
      return data as SoulMemoryRecord[];
    } catch {
      return [];
    }
  }

  async remember(options: {
    content: string;
    agentId?: string;
    sessionId?: string;
    memoryType?: SoulMemoryType;
    metadata?: Record<string, unknown>;
    importance?: number;
    confidence?: number;
  }): Promise<boolean> {
    try {
      const content = options.content?.trim();
      if (!content) return false;
      const supabase = this.getClient();
      if (!supabase) return false;
      const embedding = await this.embed(content);
      if (!embedding) return false;

      const { error } = await supabase.from('soul_memories').insert({
        nucleus_id: 'N01',
        agent_id: options.agentId?.trim() || null,
        session_id: options.sessionId?.trim() || null,
        content,
        embedding,
        memory_type: options.memoryType || 'episodic',
        metadata: options.metadata || {},
        importance: clamp(Number(options.importance ?? 0.5)),
        confidence: clamp(Number(options.confidence ?? 0.5)),
      });

      return !error;
    } catch {
      return false;
    }
  }
}

export const soulVectorMemory = new SupabaseVectorMemory();
