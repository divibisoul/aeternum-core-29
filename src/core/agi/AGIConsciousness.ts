/**
 * AGI Consciousness - Sistema de Consciência Integrada
 * Integra IntentionInterpreter, ContextManager, ProactiveSuggester
 */

export interface UserIntention {
  type: 'query' | 'command' | 'feedback' | 'exploration' | 'configuration';
  content: string;
  context: string;
  urgency: 'low' | 'medium' | 'high';
  expectedResponseType: 'text' | 'action' | 'data' | 'guidance';
}

export interface ProactiveSuggestion {
  id: string;
  title: string;
  description: string;
  actionType: 'optimization' | 'exploration' | 'learning' | 'maintenance';
  priority: 'low' | 'medium' | 'high';
  estimatedBenefit: number;
}

export class IntentionInterpreter {
  private intentionPatterns: Map<string, RegExp> = new Map([
    ['query', /\b(o que|como|quando|onde|por que|qual|explain|tell me|show me|what|how|why|where)\b/i],
    ['command', /\b(execute|run|start|stop|configure|set|change|faça|rode|inicie|pare)\b/i],
    ['feedback', /\b(good|bad|better|worse|like|dislike|improve|problem|bom|ruim|melhor|pior)\b/i],
    ['exploration', /\b(explore|discover|learn|see|view|browse|explorar|descobrir|ver)\b/i],
    ['configuration', /\b(settings|config|preferences|options|setup|configurar|opções)\b/i]
  ]);

  private urgencyPatterns: Map<string, RegExp> = new Map([
    ['high', /\b(urgent|critical|immediately|asap|emergency|help|urgente|crítico|ajuda)\b/i],
    ['medium', /\b(soon|important|need|should|quickly|importante|preciso)\b/i],
    ['low', /\b(later|eventually|sometime|maybe|consider|depois|eventualmente|talvez)\b/i]
  ]);

  interpret(userInput: string, context: string = ''): UserIntention {
    let type: UserIntention['type'] = 'query';
    for (const [t, pattern] of this.intentionPatterns) {
      if (pattern.test(userInput)) { type = t as UserIntention['type']; break; }
    }

    let urgency: UserIntention['urgency'] = 'medium';
    for (const [u, pattern] of this.urgencyPatterns) {
      if (pattern.test(userInput)) { urgency = u as UserIntention['urgency']; break; }
    }

    const expectedResponseType: UserIntention['expectedResponseType'] =
      type === 'command' ? 'action' : type === 'feedback' ? 'guidance' :
      userInput.includes('data') || userInput.includes('metrics') ? 'data' : 'text';

    return { type, content: userInput, context, urgency, expectedResponseType };
  }
}

export class ContextManager {
  private contextHistory: Array<{ timestamp: number; action: string; response: string }> = [];
  private activeModules: Set<string> = new Set(['neural_processor', 'ethics_guardian']);
  private userFocus = 'general_interaction';

  updateContext(action?: string, response?: string): void {
    if (action) {
      this.contextHistory.push({ timestamp: Date.now(), action, response: response || 'pending' });
    }
    if (this.contextHistory.length > 500) this.contextHistory = this.contextHistory.slice(-250);
  }

  getRecentHistory(limit = 10) { return this.contextHistory.slice(-limit); }
  getActiveModules() { return Array.from(this.activeModules); }
  getUserFocus() { return this.userFocus; }
  setUserFocus(focus: string) { this.userFocus = focus; }
}

export class ProactiveSuggester {
  private history: ProactiveSuggestion[] = [];

  generateSuggestion(interactionCount: number, systemState: string): ProactiveSuggestion | null {
    const suggestions: ProactiveSuggestion[] = [];

    if (systemState === 'idle' && interactionCount > 20) {
      suggestions.push({
        id: `s_${Date.now()}`, title: 'Explorar Capacidades Avançadas',
        description: 'Funcionalidades avançadas de análise cognitiva disponíveis.',
        actionType: 'exploration', priority: 'medium', estimatedBenefit: 0.7
      });
    }

    if (interactionCount > 10) {
      suggestions.push({
        id: `s_${Date.now()}`, title: 'Otimizar Experiência',
        description: 'Personalizar respostas baseado em padrões de uso.',
        actionType: 'optimization', priority: 'high', estimatedBenefit: 0.8
      });
    }

    if (suggestions.length === 0) return null;
    suggestions.sort((a, b) => b.estimatedBenefit - a.estimatedBenefit);
    const best = suggestions[0];
    this.history.push(best);
    return best;
  }

  getHistory() { return [...this.history]; }
}

export class AGIConsciousness {
  public intentionInterpreter: IntentionInterpreter;
  public contextManager: ContextManager;
  public proactiveSuggester: ProactiveSuggester;
  private interactionCount = 0;
  private _isRunning = false;
  private consciousnessInterval: number | null = null;

  constructor() {
    this.intentionInterpreter = new IntentionInterpreter();
    this.contextManager = new ContextManager();
    this.proactiveSuggester = new ProactiveSuggester();
  }

  startConsciousnessLoop(intervalMs = 5000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.consciousnessInterval = window.setInterval(() => {
      // Background consciousness cycle - proactive suggestions, context updates
      this.proactiveSuggester.generateSuggestion(this.interactionCount, 'idle');
    }, intervalMs);
  }

  stopConsciousnessLoop(): void {
    if (this.consciousnessInterval) clearInterval(this.consciousnessInterval);
    this.consciousnessInterval = null;
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }

  processInput(userInput: string): UserIntention {
    this.interactionCount++;
    const intention = this.intentionInterpreter.interpret(userInput);
    this.contextManager.updateContext(userInput);
    return intention;
  }

  registerResponse(response: string): void {
    this.contextManager.updateContext(undefined, response);
  }

  getMetrics() {
    return {
      interactionCount: this.interactionCount,
      isRunning: this._isRunning,
      activeModules: this.contextManager.getActiveModules(),
      userFocus: this.contextManager.getUserFocus(),
      recentSuggestions: this.proactiveSuggester.getHistory().length
    };
  }
}
