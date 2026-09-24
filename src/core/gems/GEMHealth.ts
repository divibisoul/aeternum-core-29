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
  observed: boolean;
  dataSource: 'WEARABLE' | 'UNOBSERVED';
  cyclesCompleted: number;
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
    heartRate: 72,
    hrv: 55,
    stressLevel: 0.3,
    fatigueIndex: 0.2,
    sleepQuality: 0.75,
    alertsGenerated: 0,
    lastAnalysis: Date.now(),
    wearableConnected: false,
    observed: false,
    dataSource: 'UNOBSERVED',
    cyclesCompleted: 0,
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
    this._metrics = { ...this._metrics, ...data, wearableConnected: true, observed: true, dataSource: 'WEARABLE' };
    this.analyzeAndAlert();
  }

  private cycle(): void {
    // No sensor/wearable data means no physiological measurement.
    // Keep the loop alive for connectivity/state monitoring, but never
    // fabricate health values or emit medical alerts from invented data.
    this._metrics.lastAnalysis = Date.now();
    this._metrics.cyclesCompleted++;
    if (this._metrics.observed) {
      this.analyzeAndAlert();
    }

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
      id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
