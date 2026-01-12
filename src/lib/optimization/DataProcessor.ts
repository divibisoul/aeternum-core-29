/**
 * LADO 2: PERFORMANCE - Otimização Algorítmica + Cache
 * 
 * Processador de dados de alta performance com:
 * - Cache em memória com TTL
 * - Processamento paralelo
 * - Lookup maps O(1)
 * - Stale-while-revalidate
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * HighPerformanceProcessor - Processador otimizado
 */
export class HighPerformanceProcessor {
  private static cache = new Map<string, CacheEntry<unknown>>();
  private static cacheHits = 0;
  private static cacheMisses = 0;

  /**
   * Cria lookup map O(1) para items com id
   */
  static createLookupMap<T extends { id: string }>(items: T[]): Map<string, T> {
    return new Map(items.map(item => [item.id, item]));
  }

  /**
   * Cria lookup map por chave customizada
   */
  static createLookupMapByKey<T, K extends keyof T>(
    items: T[],
    key: K
  ): Map<T[K], T> {
    return new Map(items.map(item => [item[key], item]));
  }

  /**
   * Processamento paralelo de batches com yield
   */
  static async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(processor);
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Yield para não bloquear a thread principal
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  /**
   * Cache com stale-while-revalidate
   */
  static async getWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 60000 // 1 minuto
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      this.cacheHits++;
      
      // Revalida em background sem bloquear
      if (now - cached.timestamp > cached.ttl * 0.8) {
        this.revalidateInBackground(key, fetcher, ttl);
      }
      
      return cached.data;
    }
    
    this.cacheMisses++;
    
    const freshData = await fetcher();
    this.cache.set(key, {
      data: freshData,
      timestamp: Date.now(),
      ttl
    });
    
    return freshData;
  }

  /**
   * Revalidação em background
   */
  private static async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    setTimeout(async () => {
      try {
        const freshData = await fetcher();
        this.cache.set(key, {
          data: freshData,
          timestamp: Date.now(),
          ttl
        });
      } catch (error) {
        console.warn('[DataProcessor] Background revalidation failed:', error);
      }
    }, 0);
  }

  /**
   * Invalida cache por chave ou padrão
   */
  static invalidateCache(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
    } else {
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Retorna métricas do cache
   */
  static getCacheMetrics(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? Math.round((this.cacheHits / total) * 100) : 0,
    };
  }

  /**
   * Debounce function
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  /**
   * Memoização de funções puras
   */
  static memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = getKey(...args);
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      const result = fn(...args) as ReturnType<T>;
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Chunk array para processamento
   */
  static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Deep compare para memoização
   */
  static deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const keysA = Object.keys(aObj);
      const keysB = Object.keys(bObj);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!this.deepEqual(aObj[key], bObj[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}

export default HighPerformanceProcessor;
