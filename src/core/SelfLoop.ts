/**
 * FASE 5: SELF-LOOP (Ciclo de Auto-Otimização)
 * 
 * Sistema que faz a Super AGI aprender e melhorar automaticamente quando ociosa.
 * 
 * Funções:
 * - Identifica tópicos de baixa confiança
 * - Gera documentação e exemplos automaticamente
 * - Armazena conhecimento no Code Vault
 * - Monitora e otimiza o próprio desempenho
 */

import { CodeVault, type CodeSnippet } from './CodeVault';
import { EventBus } from './EventBus';
import { useMemoryStore } from '@/stores/memoryStore';

// Interface para tópico de aprendizado
export interface LearningTopic {
  id: string;
  topic: string;
  category: 'code' | 'concept' | 'pattern' | 'optimization';
  confidence: number; // 0 a 1
  priority: 'low' | 'medium' | 'high';
  lastStudied: number | null;
  studyCount: number;
  relatedSnippets: string[];
}

// Interface para tarefa de auto-aprendizado
export interface SelfLearningTask {
  id: string;
  topicId: string;
  taskType: 'generate_example' | 'generate_documentation' | 'optimize_existing' | 'study_topic';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt: number | null;
  result: string | null;
  error: string | null;
}

// Tópicos padrão para estudo
const DEFAULT_LEARNING_TOPICS: Omit<LearningTopic, 'id' | 'lastStudied' | 'studyCount' | 'relatedSnippets'>[] = [
  // JavaScript/TypeScript
  { topic: 'React Hooks avançados', category: 'code', confidence: 0.7, priority: 'high' },
  { topic: 'TypeScript generics', category: 'code', confidence: 0.6, priority: 'medium' },
  { topic: 'Otimização de performance React', category: 'optimization', confidence: 0.5, priority: 'high' },
  { topic: 'Patterns de estado com Zustand', category: 'pattern', confidence: 0.6, priority: 'medium' },
  { topic: 'Error boundaries e tratamento de erros', category: 'pattern', confidence: 0.5, priority: 'high' },
  
  // Algoritmos
  { topic: 'Algoritmos de ordenação', category: 'code', confidence: 0.7, priority: 'medium' },
  { topic: 'Estruturas de dados (árvores)', category: 'concept', confidence: 0.5, priority: 'medium' },
  { topic: 'Programação dinâmica', category: 'concept', confidence: 0.4, priority: 'low' },
  
  // Backend
  { topic: 'Edge functions Supabase', category: 'code', confidence: 0.6, priority: 'high' },
  { topic: 'Autenticação JWT', category: 'pattern', confidence: 0.7, priority: 'high' },
  { topic: 'SQL queries otimizadas', category: 'optimization', confidence: 0.5, priority: 'medium' },
  
  // UI/UX
  { topic: 'Animações com Framer Motion', category: 'code', confidence: 0.6, priority: 'medium' },
  { topic: 'Tailwind CSS avançado', category: 'code', confidence: 0.7, priority: 'medium' },
  { topic: 'Acessibilidade web (a11y)', category: 'concept', confidence: 0.4, priority: 'high' },
];

/**
 * SelfLoop - Sistema de Auto-Otimização
 */
class SelfLoopService {
  private topics: Map<string, LearningTopic> = new Map();
  private tasks: SelfLearningTask[] = [];
  private isRunning = false;
  private intervalId: number | null = null;
  private idleTimeout = 60000; // 1 minuto de ociosidade para começar
  private lastActivity = Date.now();
  
  constructor() {
    this.initializeTopics();
    this.setupActivityTracking();
  }
  
  /**
   * Inicializa tópicos de aprendizado
   */
  private initializeTopics(): void {
    // Carregar tópicos do localStorage se existirem
    const stored = localStorage.getItem('aeternum-self-loop-topics');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        for (const topic of parsed) {
          this.topics.set(topic.id, topic);
        }
        console.log('[SelfLoop] Loaded', this.topics.size, 'learning topics');
        return;
      } catch {
        console.warn('[SelfLoop] Failed to parse stored topics');
      }
    }
    
    // Usar tópicos padrão
    for (const topic of DEFAULT_LEARNING_TOPICS) {
      const id = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.topics.set(id, {
        ...topic,
        id,
        lastStudied: null,
        studyCount: 0,
        relatedSnippets: [],
      });
    }
    
    this.saveTopics();
    console.log('[SelfLoop] Initialized with', this.topics.size, 'default topics');
  }
  
  /**
   * Configura rastreamento de atividade
   */
  private setupActivityTracking(): void {
    // Rastrear eventos do EventBus que indicam atividade
    EventBus.on('chat:message:sent', () => this.markActivity());
    EventBus.on('chat:message:received', () => this.markActivity());
    EventBus.on('orchestrator:start', () => this.markActivity());
  }
  
  /**
   * Marca atividade (reseta timer de ociosidade)
   */
  markActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Inicia o ciclo de auto-otimização
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[SelfLoop] Starting self-optimization cycle');
    
    // Verificar ociosidade a cada 30 segundos
    this.intervalId = window.setInterval(() => {
      this.checkIdleAndProcess();
    }, 30000);
  }
  
  /**
   * Para o ciclo
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('[SelfLoop] Stopped self-optimization cycle');
  }
  
  /**
   * Verifica ociosidade e processa se apropriado
   */
  private async checkIdleAndProcess(): Promise<void> {
    const idleTime = Date.now() - this.lastActivity;
    
    if (idleTime < this.idleTimeout) {
      return; // Não está ocioso o suficiente
    }
    
    // Encontrar tópico de baixa confiança para estudar
    const topicToStudy = this.selectTopicForStudy();
    
    if (!topicToStudy) {
      console.log('[SelfLoop] No topics need study at this time');
      return;
    }
    
    console.log('[SelfLoop] Idle detected, studying topic:', topicToStudy.topic);
    
    // Criar tarefa de estudo
    await this.createStudyTask(topicToStudy);
  }
  
  /**
   * Seleciona o próximo tópico para estudo
   */
  private selectTopicForStudy(): LearningTopic | null {
    const topics = Array.from(this.topics.values());
    
    // Filtrar tópicos de baixa confiança
    const lowConfidence = topics.filter(t => t.confidence < 0.7);
    
    if (lowConfidence.length === 0) {
      return null;
    }
    
    // Ordenar por prioridade e confiança
    lowConfidence.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Menor confiança primeiro
      return a.confidence - b.confidence;
    });
    
    // Retornar o que não foi estudado recentemente
    const oneHourAgo = Date.now() - 3600000;
    const notRecentlyStudied = lowConfidence.find(t => 
      !t.lastStudied || t.lastStudied < oneHourAgo
    );
    
    return notRecentlyStudied || lowConfidence[0];
  }
  
  /**
   * Cria uma tarefa de estudo para um tópico
   */
  private async createStudyTask(topic: LearningTopic): Promise<SelfLearningTask> {
    const task: SelfLearningTask = {
      id: `task_${Date.now()}`,
      topicId: topic.id,
      taskType: this.selectTaskType(topic),
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
      result: null,
      error: null,
    };
    
    this.tasks.push(task);
    
    // Emitir evento
    EventBus.emit('orchestrator:start', { 
      taskId: task.id, 
      prompt: `[SELF-LOOP] Studying: ${topic.topic}` 
    });
    
    // Atualizar tópico
    topic.lastStudied = Date.now();
    topic.studyCount++;
    this.topics.set(topic.id, topic);
    this.saveTopics();
    
    return task;
  }
  
  /**
   * Seleciona tipo de tarefa baseado no tópico
   */
  private selectTaskType(topic: LearningTopic): SelfLearningTask['taskType'] {
    if (topic.category === 'code') {
      return 'generate_example';
    }
    if (topic.category === 'optimization') {
      return 'optimize_existing';
    }
    if (topic.relatedSnippets.length === 0) {
      return 'generate_example';
    }
    return 'generate_documentation';
  }
  
  /**
   * Gera prompt para tarefa de auto-aprendizado
   */
  generateStudyPrompt(task: SelfLearningTask): string {
    const topic = this.topics.get(task.topicId);
    if (!topic) return '';
    
    const prompts: Record<SelfLearningTask['taskType'], string> = {
      generate_example: `Escreva um exemplo de código prático e completo sobre: "${topic.topic}".

REQUISITOS:
- Código FUNCIONAL e testável
- Comentários explicando partes importantes
- Inclua edge cases e tratamento de erros
- Use as melhores práticas atuais
- Forneça 2-3 exemplos de complexidade crescente

Responda APENAS com código. Sem explicações extensas.`,

      generate_documentation: `Crie uma documentação técnica concisa sobre: "${topic.topic}".

REQUISITOS:
- Explique o conceito em 2-3 parágrafos
- Liste 3-5 casos de uso práticos
- Inclua exemplos de código mínimos
- Mencione erros comuns a evitar
- Forneça links/referências relevantes se aplicável

Seja DIRETO e prático.`,

      optimize_existing: `Analise e otimize código relacionado a: "${topic.topic}".

REQUISITOS:
- Identifique padrões que podem ser melhorados
- Sugira otimizações de performance
- Mostre antes/depois com código
- Explique brevemente cada otimização
- Foque em mudanças de alto impacto

Código > Explicação.`,

      study_topic: `Explique de forma clara e prática: "${topic.topic}".

REQUISITOS:
- Definição concisa
- Por que é importante
- Quando usar (e quando NÃO usar)
- Exemplo simples de aplicação
- Recursos para aprofundamento

Mantenha objetivo e útil.`,
    };
    
    return prompts[task.taskType];
  }
  
  /**
   * Completa uma tarefa com resultado
   */
  async completeTask(taskId: string, result: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;
    
    // Atualizar confiança do tópico
    const topic = this.topics.get(task.topicId);
    if (topic) {
      // Aumentar confiança gradualmente
      topic.confidence = Math.min(1, topic.confidence + 0.1);
      this.topics.set(topic.id, topic);
      this.saveTopics();
    }
    
    // Armazenar no memoryStore
    try {
      const memoryStore = useMemoryStore.getState();
      memoryStore.addMemory({
        type: 'procedural',
        content: `[Self-Loop] ${topic?.topic || 'Unknown'}: ${result.substring(0, 500)}`,
        importance: 'medium',
        tags: ['self-loop', 'auto-learning', topic?.category || 'general'],
        relatedIds: [],
      });
    } catch (error) {
      console.warn('[SelfLoop] Failed to store in memory:', error);
    }
    
    console.log('[SelfLoop] Task completed:', taskId);
    EventBus.emit('orchestrator:complete', { taskId, result: { success: true } });
  }
  
  /**
   * Marca tarefa como falha
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = error;
    
    console.warn('[SelfLoop] Task failed:', taskId, error);
    EventBus.emit('orchestrator:error', { taskId, error });
  }
  
  /**
   * Adiciona um novo tópico de aprendizado
   */
  addTopic(
    topic: string,
    category: LearningTopic['category'],
    priority: LearningTopic['priority'] = 'medium',
    initialConfidence: number = 0.5
  ): string {
    const id = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTopic: LearningTopic = {
      id,
      topic,
      category,
      confidence: initialConfidence,
      priority,
      lastStudied: null,
      studyCount: 0,
      relatedSnippets: [],
    };
    
    this.topics.set(id, newTopic);
    this.saveTopics();
    
    console.log('[SelfLoop] Added new learning topic:', topic);
    return id;
  }
  
  /**
   * Atualiza confiança de um tópico
   */
  updateConfidence(topicId: string, newConfidence: number): void {
    const topic = this.topics.get(topicId);
    if (topic) {
      topic.confidence = Math.max(0, Math.min(1, newConfidence));
      this.topics.set(topicId, topic);
      this.saveTopics();
    }
  }
  
  /**
   * Obtém todos os tópicos
   */
  getTopics(): LearningTopic[] {
    return Array.from(this.topics.values());
  }
  
  /**
   * Obtém tópicos de baixa confiança
   */
  getLowConfidenceTopics(threshold: number = 0.6): LearningTopic[] {
    return this.getTopics().filter(t => t.confidence < threshold);
  }
  
  /**
   * Obtém tarefas recentes
   */
  getRecentTasks(limit: number = 10): SelfLearningTask[] {
    return this.tasks.slice(-limit);
  }
  
  /**
   * Salva tópicos no localStorage
   */
  private saveTopics(): void {
    const topics = Array.from(this.topics.values());
    localStorage.setItem('aeternum-self-loop-topics', JSON.stringify(topics));
  }
  
  /**
   * Obtém estatísticas do SelfLoop
   */
  getStats(): {
    totalTopics: number;
    avgConfidence: number;
    topicsStudied: number;
    tasksCompleted: number;
    tasksFailed: number;
  } {
    const topics = this.getTopics();
    const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
    const failedTasks = this.tasks.filter(t => t.status === 'failed').length;
    const topicsStudied = topics.filter(t => t.studyCount > 0).length;
    const avgConfidence = topics.length > 0 
      ? topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length 
      : 0;
    
    return {
      totalTopics: topics.length,
      avgConfidence,
      topicsStudied,
      tasksCompleted: completedTasks,
      tasksFailed: failedTasks,
    };
  }
}

// Singleton
export const SelfLoop = new SelfLoopService();

export default SelfLoop;
