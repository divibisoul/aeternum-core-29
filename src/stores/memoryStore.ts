/**
 * MEMORY STORE - Sistema de Memória da Super AGI
 * 
 * Implementa memória persistente semântica e grafo de conhecimento dinâmico.
 * Baseado no Módulo 2: Framework do Chatbot de Super AGI
 * 
 * Características:
 * - Memória Persistente e Semântica
 * - Grafo de Conhecimento Dinâmico
 * - Auto-Reflexão e Otimização
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Tipos de memória
export type MemoryType = 
  | 'episodic'     // Eventos e interações específicas
  | 'semantic'     // Conhecimento factual e conceitos
  | 'procedural'   // Como fazer tarefas
  | 'working';     // Memória de curto prazo da sessão atual

// Nível de importância
export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';

// Interface para um item de memória
export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  summary?: string;
  importance: ImportanceLevel;
  tags: string[];
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  relatedIds: string[]; // Conexões no grafo de conhecimento
  metadata?: Record<string, unknown>;
}

// Interface para uma sessão de conversa
export interface ConversationSession {
  id: string;
  title?: string;
  startedAt: number;
  endedAt?: number;
  messageCount: number;
  topics: string[];
  summary?: string;
}

// Estado completo do sistema de memória
export interface MemoryState {
  // Memórias de longo prazo
  memories: MemoryItem[];
  
  // Sessões de conversa
  sessions: ConversationSession[];
  currentSessionId: string | null;
  
  // Grafo de conhecimento (conexões semânticas)
  knowledgeGraph: {
    nodes: string[]; // IDs de memórias
    edges: Array<{ source: string; target: string; weight: number; relation: string }>;
  };
  
  // Estatísticas de auto-reflexão
  stats: {
    totalMemories: number;
    totalSessions: number;
    topTopics: string[];
    lastReflectionAt: number;
  };
  
  // Actions
  addMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>) => string;
  updateMemory: (id: string, updates: Partial<MemoryItem>) => void;
  removeMemory: (id: string) => void;
  accessMemory: (id: string) => MemoryItem | undefined;
  
  // Sessões
  startSession: (title?: string) => string;
  endSession: (id: string, summary?: string) => void;
  updateSessionTopics: (id: string, topics: string[]) => void;
  
  // Grafo de conhecimento
  addKnowledgeEdge: (sourceId: string, targetId: string, relation: string, weight?: number) => void;
  getRelatedMemories: (id: string) => MemoryItem[];
  
  // Busca semântica
  searchMemories: (query: string, type?: MemoryType) => MemoryItem[];
  
  // Auto-reflexão
  runReflection: () => void;
  
  // Limpeza
  pruneOldMemories: (maxAge: number) => void;
  reset: () => void;
}

// Função para gerar ID único
const generateId = () => `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Estado inicial
const initialState = {
  memories: [],
  sessions: [],
  currentSessionId: null,
  knowledgeGraph: {
    nodes: [],
    edges: [],
  },
  stats: {
    totalMemories: 0,
    totalSessions: 0,
    topTopics: [],
    lastReflectionAt: 0,
  },
};

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addMemory: (memoryData) => {
        const id = generateId();
        const now = Date.now();
        
        const newMemory: MemoryItem = {
          ...memoryData,
          id,
          createdAt: now,
          lastAccessedAt: now,
          accessCount: 1,
        };

        set((state) => ({
          memories: [...state.memories, newMemory],
          knowledgeGraph: {
            ...state.knowledgeGraph,
            nodes: [...state.knowledgeGraph.nodes, id],
          },
          stats: {
            ...state.stats,
            totalMemories: state.stats.totalMemories + 1,
          },
        }));

        return id;
      },

      updateMemory: (id, updates) => {
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      removeMemory: (id) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
          knowledgeGraph: {
            nodes: state.knowledgeGraph.nodes.filter((n) => n !== id),
            edges: state.knowledgeGraph.edges.filter(
              (e) => e.source !== id && e.target !== id
            ),
          },
          stats: {
            ...state.stats,
            totalMemories: Math.max(0, state.stats.totalMemories - 1),
          },
        }));
      },

      accessMemory: (id) => {
        const memory = get().memories.find((m) => m.id === id);
        if (memory) {
          set((state) => ({
            memories: state.memories.map((m) =>
              m.id === id
                ? { ...m, lastAccessedAt: Date.now(), accessCount: m.accessCount + 1 }
                : m
            ),
          }));
        }
        return memory;
      },

      startSession: (title) => {
        const id = `session_${Date.now()}`;
        const session: ConversationSession = {
          id,
          title,
          startedAt: Date.now(),
          messageCount: 0,
          topics: [],
        };

        set((state) => ({
          sessions: [...state.sessions, session],
          currentSessionId: id,
          stats: {
            ...state.stats,
            totalSessions: state.stats.totalSessions + 1,
          },
        }));

        return id;
      },

      endSession: (id, summary) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, endedAt: Date.now(), summary } : s
          ),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        }));
      },

      updateSessionTopics: (id, topics) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, topics: [...new Set([...s.topics, ...topics])] } : s
          ),
        }));
      },

      addKnowledgeEdge: (sourceId, targetId, relation, weight = 1.0) => {
        set((state) => {
          // Verificar se a edge já existe
          const exists = state.knowledgeGraph.edges.some(
            (e) => e.source === sourceId && e.target === targetId && e.relation === relation
          );
          
          if (exists) {
            // Aumentar peso se já existe
            return {
              knowledgeGraph: {
                ...state.knowledgeGraph,
                edges: state.knowledgeGraph.edges.map((e) =>
                  e.source === sourceId && e.target === targetId && e.relation === relation
                    ? { ...e, weight: e.weight + 0.1 }
                    : e
                ),
              },
            };
          }

          return {
            knowledgeGraph: {
              ...state.knowledgeGraph,
              edges: [...state.knowledgeGraph.edges, { source: sourceId, target: targetId, weight, relation }],
            },
          };
        });

        // Atualizar relatedIds nas memórias
        get().updateMemory(sourceId, {
          relatedIds: [...new Set([...(get().memories.find(m => m.id === sourceId)?.relatedIds || []), targetId])],
        });
        get().updateMemory(targetId, {
          relatedIds: [...new Set([...(get().memories.find(m => m.id === targetId)?.relatedIds || []), sourceId])],
        });
      },

      getRelatedMemories: (id) => {
        const state = get();
        const memory = state.memories.find((m) => m.id === id);
        if (!memory) return [];

        const relatedIds = new Set<string>();
        
        // Pegar memórias conectadas diretamente
        memory.relatedIds.forEach((rid) => relatedIds.add(rid));
        
        // Pegar do grafo de conhecimento
        state.knowledgeGraph.edges
          .filter((e) => e.source === id || e.target === id)
          .forEach((e) => {
            relatedIds.add(e.source === id ? e.target : e.source);
          });

        return state.memories.filter((m) => relatedIds.has(m.id));
      },

      searchMemories: (query, type) => {
        const state = get();
        const queryLower = query.toLowerCase();
        
        return state.memories
          .filter((m) => {
            if (type && m.type !== type) return false;
            
            // Busca simples por conteúdo e tags
            const contentMatch = m.content.toLowerCase().includes(queryLower);
            const tagMatch = m.tags.some((t) => t.toLowerCase().includes(queryLower));
            const summaryMatch = m.summary?.toLowerCase().includes(queryLower);
            
            return contentMatch || tagMatch || summaryMatch;
          })
          .sort((a, b) => {
            // Ordenar por importância e acesso recente
            const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance];
            if (importanceDiff !== 0) return importanceDiff;
            return b.lastAccessedAt - a.lastAccessedAt;
          });
      },

      runReflection: () => {
        const state = get();
        
        // Calcular tópicos mais frequentes
        const topicCount: Record<string, number> = {};
        state.sessions.forEach((s) => {
          s.topics.forEach((t) => {
            topicCount[t] = (topicCount[t] || 0) + 1;
          });
        });
        
        const topTopics = Object.entries(topicCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([topic]) => topic);

        set((state) => ({
          stats: {
            ...state.stats,
            topTopics,
            lastReflectionAt: Date.now(),
          },
        }));
      },

      pruneOldMemories: (maxAge) => {
        const cutoff = Date.now() - maxAge;
        set((state) => ({
          memories: state.memories.filter(
            (m) => m.importance === 'critical' || m.lastAccessedAt > cutoff
          ),
        }));
      },

      reset: () => set(initialState),
    }),
    {
      name: 'aeternum-memory',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        memories: state.memories,
        sessions: state.sessions,
        knowledgeGraph: state.knowledgeGraph,
        stats: state.stats,
      }),
    }
  )
);

// Selectors
export const selectMemories = (state: MemoryState) => state.memories;
export const selectSessions = (state: MemoryState) => state.sessions;
export const selectCurrentSession = (state: MemoryState) => 
  state.sessions.find((s) => s.id === state.currentSessionId);
export const selectStats = (state: MemoryState) => state.stats;
