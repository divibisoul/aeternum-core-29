/**
 * GEM-Health: Módulo Ativo de Monitoramento de Saúde
 * 
 * Loop contínuo de primeiro plano que:
 * - Monitora métricas de saúde (HRV, stress, fadiga)
 * - Detecta anomalias em tempo real
 * - Gera alertas proativos
 * - Integra com wearables via companion app
 */

import { EventBus } from '@/core/EventBus';

export interface HealthMetrics {
  heartRate: number;
  hrv: number;
  stressLevel: number;
  fatigueIndex: number;
  sleepQuality: number;
  alertsGenerated: number;
  lastAnalysis: number;
  wearableConnected: boolean;
  cyclesCompleted: number;
  observed: boolean;
  dataSource: 'NONE' | 'WEARABLE';
}

interface HealthAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export class GEMHealth {
  private _running = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _metrics: HealthMetrics = {
    heartRate: 0,
    hrv: 0,
    stressLevel: 0,
    fatigueIndex: 0,
    sleepQuality: 0,
    alertsGenerated: 0,
    lastAnalysis: Date.now(),
    wearableConnected: false,
    cyclesCompleted: 0,
    observed: false,
    dataSource: 'NONE',
  };
  private _alerts: HealthAlert[] = [];
  private _history: HealthMetrics[] = [];

  get isRunning() { return this._running; }
  get metrics() { return { ...this._metrics }; }
  get alerts() { return [...this._alerts]; }

  start(intervalMs = 5000): void {
    if (this._running) return;
    this._running = true;
    console.log('[GEM-Health] Iniciando monitoramento contínuo de saúde');

    this._interval = setInterval(() => this.cycle(), intervalMs);
    this.cycle();
  }

  stop(): void {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }

  /**
   * Receive real data from companion Android app
   */
  ingestWearableData(data: Partial<HealthMetrics>): void {
    const safeData: Partial<HealthMetrics> = {};
    for (const key of ['heartRate','hrv','stressLevel','fatigueIndex','sleepQuality'] as const) {
      const value = data[key];
      if (value != null && Number.isFinite(value)) safeData[key] = value;
    }
    this._metrics = {
      ...this._metrics,
      ...safeData,
      wearableConnected: true,
      observed: Object.keys(safeData).length > 0,
      dataSource: Object.keys(safeData).length > 0 ? 'WEARABLE' : this._metrics.dataSource,
    };
    this.analyzeAndAlert();
  }

  private cycle(): void {
    // Sem wearable: somente registra ciclo/tempo. Nenhuma fisiologia é fabricada.
    this._metrics.lastAnalysis = Date.now();
    this._metrics.cyclesCompleted++;
    this.analyzeAndAlert();

    // Keep history bounded
    this._history.push({ ...this._metrics });
    if (this._history.length > 100) this._history.shift();
  }

  private analyzeAndAlert(): void {
    if (!this._metrics.observed) return;
    const { heartRate, hrv, stressLevel, fatigueIndex } = this._metrics;

    // HRV anomaly detection
    if (hrv < 20) {
      this.emitAlert('critical', 'hrv', hrv, 20, 'HRV criticamente baixo - risco cardiovascular');
    } else if (hrv < 30) {
      this.emitAlert('warning', 'hrv', hrv, 30, 'HRV abaixo do normal');
    }

    // Heart rate anomaly
    if (heartRate > 120) {
      this.emitAlert('warning', 'heartRate', heartRate, 120, 'Frequência cardíaca elevada');
    }

    // Stress threshold
    if (stressLevel > 0.8) {
      this.emitAlert('warning', 'stress', stressLevel, 0.8, 'Nível de stress elevado');
    }

    // Fatigue
    if (fatigueIndex > 0.7) {
      this.emitAlert('info', 'fatigue', fatigueIndex, 0.7, 'Fadiga detectada - sugere-se pausa');
    }
  }

  private emitAlert(type: HealthAlert['type'], metric: string, value: number, threshold: number, message: string): void {
    // Debounce: don't repeat same alert within 60s
    const recent = this._alerts.find(a => a.metric === metric && Date.now() - a.timestamp < 60000);
    if (recent) return;

    const alert: HealthAlert = {
      id: `health_${Date.now()}_${crypto.randomUUID()}`,
      type, metric, value, threshold, message,
      timestamp: Date.now(),
    };
    this._alerts.push(alert);
    if (this._alerts.length > 50) this._alerts.shift();
    this._metrics.alertsGenerated++;

    EventBus.emit('audit:warning', { 
      message: `[GEM-Health] ${message} (${metric}: ${value.toFixed(2)})`,
      severity: type === 'critical' ? 'high' : type === 'warning' ? 'medium' : 'low',
    });
  }

  getReport() {
    return {
      metrics: this._metrics,
      alerts: this._alerts.slice(-10),
      trend: this._history.length > 1 ? {
        stressTrend: this._history[this._history.length - 1].stressLevel - this._history[Math.max(0, this._history.length - 10)].stressLevel,
        fatigueTrend: this._history[this._history.length - 1].fatigueIndex - this._history[Math.max(0, this._history.length - 10)].fatigueIndex,
      } : null,
    };
  }
}
