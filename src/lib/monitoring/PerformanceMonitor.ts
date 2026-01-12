/**
 * LADO 4: OTIMIZAÇÃO - Monitor de Performance em Tempo Real
 * 
 * Coleta métricas de:
 * - FPS (frames por segundo)
 * - Uso de memória
 * - Latência de operações
 * - Cache hit rate
 */

import { HighPerformanceProcessor } from '../optimization/DataProcessor';

export interface PerformanceMetrics {
  fps: number;
  memory: number; // bytes
  memoryMB: number;
  latency: number; // ms médio
  cacheHitRate: number; // %
  renderTime: number; // ms
  jsHeapSize: number; // bytes
  timestamp: number;
}

interface PerformanceWarning {
  type: 'fps' | 'memory' | 'latency' | 'cache';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

/**
 * PerformanceMonitor - Monitoramento contínuo de performance
 */
class PerformanceMonitorService {
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  private currentFps = 60;
  private latencyHistory: number[] = [];
  private warnings: PerformanceWarning[] = [];
  private onMetricsUpdate: ((metrics: PerformanceMetrics) => void) | null = null;
  
  // Thresholds
  private readonly FPS_THRESHOLD = 50;
  private readonly MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly LATENCY_THRESHOLD = 100; // 100ms
  private readonly CACHE_THRESHOLD = 70; // 70%

  /**
   * Inicia o monitoramento
   */
  start(onUpdate?: (metrics: PerformanceMetrics) => void): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.onMetricsUpdate = onUpdate || null;
    
    // FPS counter via requestAnimationFrame
    this.measureFps();
    
    // Coletar métricas periodicamente
    this.intervalId = setInterval(() => {
      this.collectAndReport();
    }, 5000);
    
    console.log('[PerformanceMonitor] Monitoramento iniciado');
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('[PerformanceMonitor] Monitoramento parado');
  }

  /**
   * Mede FPS usando requestAnimationFrame
   */
  private measureFps(): void {
    if (!this.isRunning) return;
    
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      this.currentFps = Math.round(1000 / delta);
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
    
    requestAnimationFrame(() => this.measureFps());
  }

  /**
   * Registra latência de uma operação
   */
  recordLatency(ms: number): void {
    this.latencyHistory.push(ms);
    
    // Manter apenas últimas 100 medições
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Coleta métricas e reporta
   */
  private collectAndReport(): void {
    const metrics = this.getMetrics();
    
    // Verificar thresholds e gerar warnings
    this.checkThresholds(metrics);
    
    // Callback se registrado
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }

  /**
   * Retorna métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    const memory = this.getMemoryUsage();
    const cacheMetrics = HighPerformanceProcessor.getCacheMetrics();
    const avgLatency = this.latencyHistory.length > 0
      ? this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
      : 0;
    
    return {
      fps: this.currentFps,
      memory: memory.bytes,
      memoryMB: memory.mb,
      latency: Math.round(avgLatency),
      cacheHitRate: cacheMetrics.hitRate,
      renderTime: Math.round(1000 / this.currentFps),
      jsHeapSize: memory.heapSize,
      timestamp: Date.now(),
    };
  }

  /**
   * Obtém uso de memória
   */
  private getMemoryUsage(): { bytes: number; mb: number; heapSize: number } {
    // @ts-expect-error - performance.memory não está em todos os browsers
    const memory = performance.memory;
    
    if (memory) {
      return {
        bytes: memory.usedJSHeapSize || 0,
        mb: Math.round((memory.usedJSHeapSize || 0) / 1024 / 1024 * 10) / 10,
        heapSize: memory.totalJSHeapSize || 0,
      };
    }
    
    // Fallback para browsers sem performance.memory
    return { bytes: 0, mb: 0, heapSize: 0 };
  }

  /**
   * Verifica thresholds e gera warnings
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const now = Date.now();
    
    if (metrics.fps < this.FPS_THRESHOLD) {
      this.addWarning({
        type: 'fps',
        message: `FPS baixo: ${metrics.fps} (threshold: ${this.FPS_THRESHOLD})`,
        value: metrics.fps,
        threshold: this.FPS_THRESHOLD,
        timestamp: now,
      });
    }
    
    if (metrics.memory > this.MEMORY_THRESHOLD) {
      this.addWarning({
        type: 'memory',
        message: `Memória alta: ${metrics.memoryMB}MB (threshold: ${this.MEMORY_THRESHOLD / 1024 / 1024}MB)`,
        value: metrics.memory,
        threshold: this.MEMORY_THRESHOLD,
        timestamp: now,
      });
    }
    
    if (metrics.latency > this.LATENCY_THRESHOLD) {
      this.addWarning({
        type: 'latency',
        message: `Latência alta: ${metrics.latency}ms (threshold: ${this.LATENCY_THRESHOLD}ms)`,
        value: metrics.latency,
        threshold: this.LATENCY_THRESHOLD,
        timestamp: now,
      });
    }
    
    if (metrics.cacheHitRate < this.CACHE_THRESHOLD && metrics.cacheHitRate > 0) {
      this.addWarning({
        type: 'cache',
        message: `Cache hit rate baixo: ${metrics.cacheHitRate}% (threshold: ${this.CACHE_THRESHOLD}%)`,
        value: metrics.cacheHitRate,
        threshold: this.CACHE_THRESHOLD,
        timestamp: now,
      });
    }
  }

  /**
   * Adiciona warning
   */
  private addWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);
    
    // Manter apenas últimas 50 warnings
    if (this.warnings.length > 50) {
      this.warnings.shift();
    }
    
    console.warn('[PerformanceMonitor]', warning.message);
  }

  /**
   * Retorna warnings recentes
   */
  getWarnings(since?: number): PerformanceWarning[] {
    if (since) {
      return this.warnings.filter(w => w.timestamp >= since);
    }
    return [...this.warnings];
  }

  /**
   * Limpa warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Retorna status do monitor
   */
  getStatus(): {
    running: boolean;
    frameCount: number;
    warningCount: number;
    metrics: PerformanceMetrics;
  } {
    return {
      running: this.isRunning,
      frameCount: this.frameCount,
      warningCount: this.warnings.length,
      metrics: this.getMetrics(),
    };
  }
}

// Singleton
export const PerformanceMonitor = new PerformanceMonitorService();
export default PerformanceMonitor;
