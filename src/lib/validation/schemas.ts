/**
 * LADO 1: ESTABILIDADE - Validação com Zod + Supabase
 * 
 * Schemas de validação rigorosa para todo o sistema.
 */

import { z } from 'zod';

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime().optional(),
  display_name: z.string().max(100).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

// Message Schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(50000),
  role: z.enum(['user', 'assistant', 'system']),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

// Session Schema
export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().max(200).optional().nullable(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

// Memory Schema
export const MemorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  memory_type: z.enum(['episodic', 'semantic', 'procedural']).optional().nullable(),
  importance: z.number().min(0).max(10).optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  embedding_data: z.unknown().optional().nullable(),
});

// Chat Input Schema
export const ChatInputSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Mensagem não pode estar vazia')
    .max(50000, 'Mensagem muito longa (máx 50.000 caracteres)'),
});

// API Key Schema
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']),
  encrypted_key: z.string().min(10),
  label: z.string().max(100).optional().nullable(),
  is_active: z.boolean().default(true),
});

// Precision Engine Request Schema
export const ProcessedRequestSchema = z.object({
  id: z.string(),
  originalInput: z.string(),
  interception: z.object({
    executionMode: z.string(),
    responseType: z.string(),
    complexity: z.string(),
    requiresCapabilities: z.array(z.string()),
  }),
  intent: z.object({
    primary: z.string(),
    weights: z.object({
      analytical: z.number(),
      creative: z.number(),
      practical: z.number(),
    }),
  }),
  processedAt: z.number(),
});

// Metrics Schema
export const MetricsSchema = z.object({
  latencyMs: z.number().min(0),
  tokensPerSecond: z.number().min(0),
  memoryUsageMB: z.number().min(0).optional(),
  cacheHitRate: z.number().min(0).max(100).optional(),
  fps: z.number().min(0).max(120).optional(),
});

// Types exports
export type User = z.infer<typeof UserSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Memory = z.infer<typeof MemorySchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type ProcessedRequest = z.infer<typeof ProcessedRequestSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;

// Validation helpers
export function validateChatInput(input: unknown): { success: boolean; data?: ChatInput; error?: string } {
  const result = ChatInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}

export function validateMessage(input: unknown): { success: boolean; data?: Message; error?: string } {
  const result = MessageSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(i => i.message).join(', ') 
  };
}
