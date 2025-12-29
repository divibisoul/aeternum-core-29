/**
 * ORCHESTRATOR STORE - Orquestrador Map-Reduce da Super AGI
 * 
 * Implementa o Orquestrador de Fluxo de Trabalho e Agência
 * conforme Módulo 2: Framework do Chatbot de Super AGI
 * 
 * Características:
 * - Planejamento Autônomo
 * - Orquestração de Módulos Paralelos
 * - Síntese Cognitiva
 */

import { create } from 'zustand';

// Módulos cognitivos (personas) da Super AGI
export interface CognitiveModule {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  specialty: string[];
}

// Status de processamento de um módulo
export type ModuleStatus = 'idle' | 'processing' | 'complete' | 'error';

// Resultado de um módulo cognitivo
export interface ModuleResult {
  moduleId: string;
  perspective: string;
  insights: string[];
  confidence: number;
  processingTimeMs: number;
}

// Tarefa para o orquestrador
export interface OrchestratorTask {
  id: string;
  input: string;
  status: 'pending' | 'mapping' | 'reducing' | 'complete' | 'error';
  startedAt: number;
  completedAt?: number;
  moduleResults: ModuleResult[];
  synthesis?: string;
  error?: string;
}

// Estado do orquestrador
export interface OrchestratorState {
  // Módulos cognitivos disponíveis
  modules: CognitiveModule[];
  
  // Status de cada módulo
  moduleStatus: Record<string, ModuleStatus>;
  
  // Tarefa atual
  currentTask: OrchestratorTask | null;
  
  // Histórico de tarefas
  taskHistory: OrchestratorTask[];
  
  // Métricas
  metrics: {
    totalTasks: number;
    averageProcessingTimeMs: number;
    successRate: number;
  };

  // Actions
  initializeModules: () => void;
  startTask: (input: string) => string;
  updateModuleStatus: (moduleId: string, status: ModuleStatus) => void;
  addModuleResult: (taskId: string, result: ModuleResult) => void;
  completeTask: (taskId: string, synthesis: string) => void;
  failTask: (taskId: string, error: string) => void;
  getActiveModules: () => CognitiveModule[];
  reset: () => void;
}

// Módulos cognitivos pré-definidos (baseados nas 4 perspectivas)
const DEFAULT_MODULES: CognitiveModule[] = [
  {
    id: 'analytical',
    name: 'Analítico',
    nameEn: 'Analytical',
    description: 'Dados, fatos, lógica, evidências, estrutura',
    icon: '🔬',
    color: 'neon-green',
    specialty: ['data', 'logic', 'facts', 'structure', 'analysis'],
  },
  {
    id: 'creative',
    name: 'Criativo',
    nameEn: 'Creative',
    description: 'Possibilidades, inovação, alternativas não-óbvias',
    icon: '💡',
    color: 'neon-blue',
    specialty: ['innovation', 'alternatives', 'possibilities', 'synthesis'],
  },
  {
    id: 'ethical',
    name: 'Ético',
    nameEn: 'Ethical',
    description: 'Implicações, consequências, valores, impacto',
    icon: '⚖️',
    color: 'neon-purple',
    specialty: ['ethics', 'impact', 'values', 'consequences', 'responsibility'],
  },
  {
    id: 'practical',
    name: 'Prático',
    nameEn: 'Practical',
    description: 'Aplicabilidade, ação, implementação, viabilidade',
    icon: '🛠️',
    color: 'neon-orange',
    specialty: ['implementation', 'action', 'feasibility', 'execution'],
  },
];

// Módulos de capacidade computacional (podem ser ativados conforme necessidade)
const CAPABILITY_MODULES: CognitiveModule[] = [
  {
    id: 'coding',
    name: 'Codificação',
    nameEn: 'Coding',
    description: 'Geração, otimização e depuração de código',
    icon: '💻',
    color: 'neon-cyan',
    specialty: ['code', 'programming', 'algorithms', 'architecture'],
  },
  {
    id: 'calculation',
    name: 'Cálculo',
    nameEn: 'Calculation',
    description: 'Simulações, modelagem, otimização numérica',
    icon: '📊',
    color: 'neon-yellow',
    specialty: ['math', 'simulation', 'optimization', 'statistics'],
  },
  {
    id: 'data',
    name: 'Dados',
    nameEn: 'Data',
    description: 'Processamento e análise de dados massivos',
    icon: '📈',
    color: 'neon-pink',
    specialty: ['data', 'patterns', 'insights', 'prediction'],
  },
];

// Função para gerar ID único
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Estado inicial
const initialState = {
  modules: [...DEFAULT_MODULES, ...CAPABILITY_MODULES],
  moduleStatus: {} as Record<string, ModuleStatus>,
  currentTask: null as OrchestratorTask | null,
  taskHistory: [] as OrchestratorTask[],
  metrics: {
    totalTasks: 0,
    averageProcessingTimeMs: 0,
    successRate: 1.0,
  },
};

export const useOrchestratorStore = create<OrchestratorState>()((set, get) => ({
  ...initialState,

  initializeModules: () => {
    const moduleStatus: Record<string, ModuleStatus> = {};
    get().modules.forEach((m) => {
      moduleStatus[m.id] = 'idle';
    });
    set({ moduleStatus });
  },

  startTask: (input: string) => {
    const id = generateId();
    const task: OrchestratorTask = {
      id,
      input,
      status: 'mapping',
      startedAt: Date.now(),
      moduleResults: [],
    };

    // Iniciar todos os módulos cognitivos
    const moduleStatus: Record<string, ModuleStatus> = {};
    DEFAULT_MODULES.forEach((m) => {
      moduleStatus[m.id] = 'processing';
    });

    set((state) => ({
      currentTask: task,
      moduleStatus: { ...state.moduleStatus, ...moduleStatus },
    }));

    return id;
  },

  updateModuleStatus: (moduleId: string, status: ModuleStatus) => {
    set((state) => ({
      moduleStatus: { ...state.moduleStatus, [moduleId]: status },
    }));
  },

  addModuleResult: (taskId: string, result: ModuleResult) => {
    set((state) => {
      if (state.currentTask?.id !== taskId) return state;

      const moduleResults = [...state.currentTask.moduleResults, result];
      const allComplete = DEFAULT_MODULES.every((m) =>
        moduleResults.some((r) => r.moduleId === m.id)
      );

      return {
        currentTask: {
          ...state.currentTask,
          moduleResults,
          status: allComplete ? 'reducing' : state.currentTask.status,
        },
        moduleStatus: { ...state.moduleStatus, [result.moduleId]: 'complete' },
      };
    });
  },

  completeTask: (taskId: string, synthesis: string) => {
    set((state) => {
      if (state.currentTask?.id !== taskId) return state;

      const completedTask: OrchestratorTask = {
        ...state.currentTask,
        status: 'complete',
        completedAt: Date.now(),
        synthesis,
      };

      const processingTime = completedTask.completedAt! - completedTask.startedAt;
      const totalTasks = state.metrics.totalTasks + 1;
      const avgTime = 
        (state.metrics.averageProcessingTimeMs * state.metrics.totalTasks + processingTime) / 
        totalTasks;

      // Reset module status
      const moduleStatus: Record<string, ModuleStatus> = {};
      state.modules.forEach((m) => {
        moduleStatus[m.id] = 'idle';
      });

      return {
        currentTask: null,
        taskHistory: [...state.taskHistory.slice(-99), completedTask], // Keep last 100
        moduleStatus,
        metrics: {
          totalTasks,
          averageProcessingTimeMs: avgTime,
          successRate: 
            (state.metrics.successRate * state.metrics.totalTasks + 1) / totalTasks,
        },
      };
    });
  },

  failTask: (taskId: string, error: string) => {
    set((state) => {
      if (state.currentTask?.id !== taskId) return state;

      const failedTask: OrchestratorTask = {
        ...state.currentTask,
        status: 'error',
        completedAt: Date.now(),
        error,
      };

      const totalTasks = state.metrics.totalTasks + 1;

      // Reset module status
      const moduleStatus: Record<string, ModuleStatus> = {};
      state.modules.forEach((m) => {
        moduleStatus[m.id] = 'idle';
      });

      return {
        currentTask: null,
        taskHistory: [...state.taskHistory.slice(-99), failedTask],
        moduleStatus,
        metrics: {
          ...state.metrics,
          totalTasks,
          successRate: 
            (state.metrics.successRate * state.metrics.totalTasks) / totalTasks,
        },
      };
    });
  },

  getActiveModules: () => {
    const state = get();
    return state.modules.filter((m) => state.moduleStatus[m.id] === 'processing');
  },

  reset: () => set(initialState),
}));

// Selectors
export const selectModules = (state: OrchestratorState) => state.modules;
export const selectModuleStatus = (state: OrchestratorState) => state.moduleStatus;
export const selectCurrentTask = (state: OrchestratorState) => state.currentTask;
export const selectMetrics = (state: OrchestratorState) => state.metrics;

// Hook para acessar módulos cognitivos padrão
export const useCognitiveModules = () => {
  return DEFAULT_MODULES;
};

// Hook para acessar módulos de capacidade
export const useCapabilityModules = () => {
  return CAPABILITY_MODULES;
};
