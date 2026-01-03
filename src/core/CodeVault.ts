/**
 * FASE 2: CODE VAULT
 * 
 * Banco de dados local (IndexedDB) para armazenar código validado.
 * 
 * Funções:
 * - Armazena snippets de código bem-sucedidos com tags
 * - Busca código similar baseado em descrição
 * - Mantém histórico de soluções para reutilização
 * - Evolui com o uso, não exclui conhecimento anterior
 */

import { EventBus } from './EventBus';

// Interface para um snippet de código
export interface CodeSnippet {
  id: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  category: 'component' | 'function' | 'algorithm' | 'pattern' | 'config' | 'utility' | 'other';
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
  validated: boolean;
  successRate: number;
  metadata: {
    framework?: string;
    complexity?: 'low' | 'medium' | 'high';
    dependencies?: string[];
    relatedSnippetIds?: string[];
  };
}

// Interface para resultado de busca
export interface SearchResult {
  snippet: CodeSnippet;
  relevanceScore: number;
  matchedTags: string[];
  matchedTerms: string[];
}

// Nome do banco de dados
const DB_NAME = 'aeternum-code-vault';
const DB_VERSION = 1;
const STORE_NAME = 'code_snippets';

/**
 * CodeVault - Serviço de Armazenamento de Código
 */
class CodeVaultService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  constructor() {
    this.initPromise = this.initialize();
  }
  
  /**
   * Inicializa o IndexedDB
   */
  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar suporte a IndexedDB
      if (!window.indexedDB) {
        console.warn('[CodeVault] IndexedDB not supported, using memory fallback');
        resolve();
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('[CodeVault] Error opening database:', event);
        reject(new Error('Failed to open CodeVault database'));
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('[CodeVault] Database initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object store se não existir
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Criar índices para busca eficiente
          store.createIndex('language', 'language', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('validated', 'validated', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('useCount', 'useCount', { unique: false });
          
          console.log('[CodeVault] Object store created');
        }
      };
    });
  }
  
  /**
   * Garante que o DB está inicializado
   */
  private async ensureInitialized(): Promise<boolean> {
    await this.initPromise;
    return this.db !== null;
  }
  
  /**
   * Armazena um novo snippet de código
   */
  async storeCodeSnippet(
    code: string,
    language: string,
    description: string,
    tags: string[],
    options: Partial<Omit<CodeSnippet, 'id' | 'code' | 'language' | 'description' | 'tags' | 'createdAt' | 'lastUsedAt' | 'useCount'>> = {}
  ): Promise<string> {
    const isReady = await this.ensureInitialized();
    
    const id = `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const snippet: CodeSnippet = {
      id,
      code,
      language: language.toLowerCase(),
      description,
      tags: tags.map(t => t.toLowerCase()),
      category: options.category || 'other',
      createdAt: now,
      lastUsedAt: now,
      useCount: 0,
      validated: options.validated ?? false,
      successRate: options.successRate ?? 1.0,
      metadata: options.metadata || {},
    };
    
    if (isReady && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(snippet);
        
        request.onsuccess = () => {
          console.log('[CodeVault] Snippet stored:', id);
          EventBus.emit('memory:stored', { id, type: 'code' });
          resolve(id);
        };
        
        request.onerror = (event) => {
          console.error('[CodeVault] Error storing snippet:', event);
          reject(new Error('Failed to store code snippet'));
        };
      });
    }
    
    // Fallback para localStorage
    const stored = this.getLocalStorageSnippets();
    stored.push(snippet);
    localStorage.setItem('aeternum-code-vault-fallback', JSON.stringify(stored));
    console.log('[CodeVault] Snippet stored in fallback:', id);
    
    return id;
  }
  
  /**
   * Busca snippets similares baseado em descrição e tags
   */
  async findSimilarCode(
    query: string,
    options: {
      language?: string;
      category?: string;
      maxResults?: number;
      minRelevance?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { maxResults = 5, minRelevance = 0.3 } = options;
    const isReady = await this.ensureInitialized();
    
    // Tokenizar a query
    const queryTerms = this.tokenize(query);
    
    // Obter todos os snippets
    const allSnippets = isReady && this.db 
      ? await this.getAllFromDB()
      : this.getLocalStorageSnippets();
    
    // Calcular relevância para cada snippet
    const results: SearchResult[] = [];
    
    for (const snippet of allSnippets) {
      // Filtrar por linguagem e categoria se especificado
      if (options.language && snippet.language !== options.language.toLowerCase()) {
        continue;
      }
      if (options.category && snippet.category !== options.category) {
        continue;
      }
      
      // Calcular score de relevância
      const { score, matchedTags, matchedTerms } = this.calculateRelevance(snippet, queryTerms);
      
      if (score >= minRelevance) {
        results.push({
          snippet,
          relevanceScore: score,
          matchedTags,
          matchedTerms,
        });
      }
    }
    
    // Ordenar por relevância e uso
    results.sort((a, b) => {
      // Priorizar por relevância
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
      
      // Empate: priorizar por taxa de sucesso
      const successDiff = b.snippet.successRate - a.snippet.successRate;
      if (Math.abs(successDiff) > 0.1) return successDiff;
      
      // Empate: priorizar por uso recente
      return b.snippet.lastUsedAt - a.snippet.lastUsedAt;
    });
    
    // Atualizar lastUsedAt dos resultados retornados
    const topResults = results.slice(0, maxResults);
    for (const result of topResults) {
      await this.updateSnippetUsage(result.snippet.id);
    }
    
    EventBus.emit('memory:retrieved', { count: topResults.length });
    
    return topResults;
  }
  
  /**
   * Marca um snippet como validado (executou sem erros)
   */
  async markAsValidated(id: string, success: boolean = true): Promise<void> {
    const isReady = await this.ensureInitialized();
    
    if (isReady && this.db) {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const snippet = request.result as CodeSnippet;
        if (snippet) {
          // Atualizar taxa de sucesso
          const totalAttempts = snippet.useCount + 1;
          const successCount = snippet.successRate * snippet.useCount + (success ? 1 : 0);
          snippet.successRate = successCount / totalAttempts;
          snippet.validated = true;
          snippet.useCount = totalAttempts;
          snippet.lastUsedAt = Date.now();
          
          store.put(snippet);
          console.log('[CodeVault] Snippet validated:', id, 'success rate:', snippet.successRate);
        }
      };
    } else {
      // Fallback
      const stored = this.getLocalStorageSnippets();
      const index = stored.findIndex(s => s.id === id);
      if (index !== -1) {
        stored[index].validated = true;
        stored[index].useCount++;
        stored[index].lastUsedAt = Date.now();
        localStorage.setItem('aeternum-code-vault-fallback', JSON.stringify(stored));
      }
    }
  }
  
  /**
   * Obtém um snippet por ID
   */
  async getSnippet(id: string): Promise<CodeSnippet | null> {
    const isReady = await this.ensureInitialized();
    
    if (isReady && this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          resolve(null);
        };
      });
    }
    
    const stored = this.getLocalStorageSnippets();
    return stored.find(s => s.id === id) || null;
  }
  
  /**
   * Obtém estatísticas do vault
   */
  async getStats(): Promise<{
    totalSnippets: number;
    validatedCount: number;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
    averageSuccessRate: number;
  }> {
    const isReady = await this.ensureInitialized();
    const snippets = isReady && this.db 
      ? await this.getAllFromDB()
      : this.getLocalStorageSnippets();
    
    const byLanguage: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let validatedCount = 0;
    let totalSuccessRate = 0;
    
    for (const snippet of snippets) {
      byLanguage[snippet.language] = (byLanguage[snippet.language] || 0) + 1;
      byCategory[snippet.category] = (byCategory[snippet.category] || 0) + 1;
      if (snippet.validated) validatedCount++;
      totalSuccessRate += snippet.successRate;
    }
    
    return {
      totalSnippets: snippets.length,
      validatedCount,
      byLanguage,
      byCategory,
      averageSuccessRate: snippets.length > 0 ? totalSuccessRate / snippets.length : 0,
    };
  }
  
  /**
   * Tokeniza uma string para busca
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }
  
  /**
   * Calcula a relevância de um snippet para uma query
   */
  private calculateRelevance(
    snippet: CodeSnippet,
    queryTerms: string[]
  ): { score: number; matchedTags: string[]; matchedTerms: string[] } {
    const matchedTags: string[] = [];
    const matchedTerms: string[] = [];
    let score = 0;
    
    // Tokenizar descrição e código do snippet
    const descriptionTerms = this.tokenize(snippet.description);
    const codeTerms = this.tokenize(snippet.code);
    
    for (const term of queryTerms) {
      // Match em tags (peso maior)
      if (snippet.tags.some(tag => tag.includes(term) || term.includes(tag))) {
        matchedTags.push(term);
        score += 0.3;
      }
      
      // Match na descrição
      if (descriptionTerms.some(dt => dt.includes(term) || term.includes(dt))) {
        matchedTerms.push(term);
        score += 0.2;
      }
      
      // Match no código
      if (codeTerms.some(ct => ct.includes(term) || term.includes(ct))) {
        matchedTerms.push(term);
        score += 0.1;
      }
    }
    
    // Normalizar score
    const maxScore = queryTerms.length * 0.6;
    const normalizedScore = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
    
    // Boost para snippets validados
    const validationBoost = snippet.validated ? 0.1 : 0;
    
    return {
      score: normalizedScore + validationBoost,
      matchedTags: [...new Set(matchedTags)],
      matchedTerms: [...new Set(matchedTerms)],
    };
  }
  
  /**
   * Atualiza uso de um snippet
   */
  private async updateSnippetUsage(id: string): Promise<void> {
    const isReady = await this.ensureInitialized();
    
    if (isReady && this.db) {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const snippet = request.result as CodeSnippet;
        if (snippet) {
          snippet.lastUsedAt = Date.now();
          snippet.useCount++;
          store.put(snippet);
        }
      };
    }
  }
  
  /**
   * Obtém todos os snippets do IndexedDB
   */
  private async getAllFromDB(): Promise<CodeSnippet[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        resolve([]);
      };
    });
  }
  
  /**
   * Fallback para localStorage
   */
  private getLocalStorageSnippets(): CodeSnippet[] {
    try {
      const stored = localStorage.getItem('aeternum-code-vault-fallback');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// Singleton
export const CodeVault = new CodeVaultService();

export default CodeVault;
