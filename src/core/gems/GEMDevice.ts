/**
 * GEM-Device: Módulo Ativo de Gerenciamento Android
 * 
 * Loop contínuo de primeiro plano que:
 * - Monitora status do dispositivo (CPU, RAM, bateria)
 * - Envia comandos de otimização via companion app (WebSocket)
 * - Gerencia conexão Shizuku + ADB Wi-Fi
 * - Opera como bridge entre web app e Android
 */

import { EventBus } from '@/core/EventBus';

export interface DeviceStatus {
  connected: boolean;
  connectionType: 'none' | 'websocket' | 'adb-wifi';
  shizukuActive: boolean;
  adbWifiActive: boolean;
  ipAddress: string | null;
  port: number | null;
  cpu: number;
  ramUsedMb: number;
  ramTotalMb: number;
  batteryPct: number;
  temperature: number;
  runningProcesses: number;
}

export interface DeviceMetrics {
  isRunning: boolean;
  connected: boolean;
  shizukuActive: boolean;
  optimizationCycles: number;
  ramFreedMb: number;
  cpuReductionPct: number;
  actionsExecuted: number;
  lastOptimization: number;
  cyclesCompleted: number;
}

export interface DeviceAction {
  id: string;
  type: 'force_stop' | 'clear_cache' | 'freeze' | 'optimize_network' | 'custom_shell';
  target?: string;
  command?: string;
  status: 'pending' | 'sent' | 'success' | 'failed';
  result?: string;
  timestamp: number;
}

const WHITELIST = [
  'com.android.systemui',
  'com.google.android.gms',
  'android',
  'com.android.phone',
  'com.android.settings',
  'com.android.providers.settings',
];

export class GEMDevice {
  private _running = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _ws: WebSocket | null = null;
  private _status: DeviceStatus = {
    connected: false,
    connectionType: 'none',
    shizukuActive: false,
    adbWifiActive: false,
    ipAddress: null,
    port: null,
    cpu: 0,
    ramUsedMb: 0,
    ramTotalMb: 0,
    batteryPct: 100,
    temperature: 25,
    runningProcesses: 0,
  };
  private _actions: DeviceAction[] = [];
  private _optimizationCycles = 0;
  private _ramFreedMb = 0;
  private _cpuReductionPct = 0;
  private _actionsExecuted = 0;
  private _cyclesCompleted = 0;
  private _lastOptimization = 0;

  get isRunning() { return this._running; }
  get status() { return { ...this._status }; }
  get connected() { return this._status.connected; }

  start(intervalMs = 5000): void {
    if (this._running) return;
    this._running = true;
    console.log('[GEM-Device] Iniciando gerenciamento Android contínuo');
    this._interval = setInterval(() => this.cycle(), intervalMs);
    this.cycle();
  }

  stop(): void {
    this.disconnect();
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }

  /**
   * Connect to companion Android app via WebSocket
   */
  connect(ip: string, port: number): void {
    if (this._ws) this.disconnect();

    try {
      const url = `ws://${ip}:${port}`;
      console.log(`[GEM-Device] Conectando a ${url}...`);
      this._ws = new WebSocket(url);

      this._ws.onopen = () => {
        this._status.connected = true;
        this._status.connectionType = 'websocket';
        this._status.ipAddress = ip;
        this._status.port = port;
        console.log('[GEM-Device] Conectado ao companion app');
        this.sendCommand({ type: 'status_request' });
        this.sendCommand({ type: 'shizuku_check' });
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {}
      };

      this._ws.onclose = () => {
        this._status.connected = false;
        this._status.connectionType = 'none';
        console.log('[GEM-Device] Desconectado do companion app');
      };

      this._ws.onerror = () => {
        this._status.connected = false;
      };
    } catch (e) {
      console.warn('[GEM-Device] Falha na conexão:', e);
    }
  }

  disconnect(): void {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._status.connected = false;
    this._status.connectionType = 'none';
  }

  /**
   * Send command to companion app
   */
  sendCommand(cmd: Record<string, unknown>): void {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    this._ws.send(JSON.stringify(cmd));
  }

  /**
   * Execute a device action
   */
  executeAction(type: DeviceAction['type'], target?: string, command?: string): string {
    // Safety check
    if (target && WHITELIST.includes(target)) {
      console.warn(`[GEM-Device] Ação bloqueada: ${target} está na whitelist`);
      return '';
    }

    const action: DeviceAction = {
      id: `act_${Date.now()}_${crypto.randomUUID()}`,
      type, target, command,
      status: 'pending',
      timestamp: Date.now(),
    };

    this._actions.push(action);
    if (this._actions.length > 100) this._actions.shift();

    if (this._status.connected) {
      action.status = 'sent';
      this.sendCommand({
        type: 'execute_action',
        action: type,
        target,
        command,
        actionId: action.id,
      });
    }

    return action.id;
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'status_update':
        this._status.cpu = data.cpu ?? this._status.cpu;
        this._status.ramUsedMb = data.ramUsedMb ?? this._status.ramUsedMb;
        this._status.ramTotalMb = data.ramTotalMb ?? this._status.ramTotalMb;
        this._status.batteryPct = data.batteryPct ?? this._status.batteryPct;
        this._status.temperature = data.temperature ?? this._status.temperature;
        this._status.runningProcesses = data.runningProcesses ?? this._status.runningProcesses;
        break;

      case 'shizuku_status':
        this._status.shizukuActive = data.active ?? false;
        break;

      case 'adb_status':
        this._status.adbWifiActive = data.active ?? false;
        break;

      case 'action_result':
        const action = this._actions.find(a => a.id === data.actionId);
        if (action) {
          action.status = data.success ? 'success' : 'failed';
          action.result = data.result;
          if (data.success) {
            this._actionsExecuted++;
            this._optimizationCycles++;
            this._lastOptimization = Date.now();
          }
          if (Number.isFinite(data.ramFreedMb)) this._ramFreedMb += Number(data.ramFreedMb);
          if (Number.isFinite(data.cpuReductionPct)) this._cpuReductionPct += Number(data.cpuReductionPct);
        }
        break;
    }
  }

  private cycle(): void {
    this._cyclesCompleted++;

    // Somente solicita uma nova leitura quando há conexão real.
    if (this._status.connected) {
      this.sendCommand({ type: 'status_request' });
    }
  }

  getMetrics(): DeviceMetrics {
    return {
      isRunning: this._running,
      connected: this._status.connected,
      shizukuActive: this._status.shizukuActive,
      optimizationCycles: this._optimizationCycles,
      ramFreedMb: this._ramFreedMb,
      cpuReductionPct: this._cpuReductionPct,
      actionsExecuted: this._actionsExecuted,
      lastOptimization: this._lastOptimization,
      cyclesCompleted: this._cyclesCompleted,
    };
  }

  getActions(): DeviceAction[] {
    return [...this._actions].reverse().slice(0, 20);
  }

  static getWhitelist(): string[] {
    return [...WHITELIST];
  }
}
