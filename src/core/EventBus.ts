/**
 * NERVO VAGO - Global Event Bus (Pub/Sub)
 * Fully typed async event bus for decoupled component communication.
 */
export interface AeternumEvents {
  'system:init': { timestamp: number; blueprintVersion?: string; nodes?: number; channels?: number };
  'system:ready': { modules: string[]; vagus?: boolean; homeostasis?: boolean };
  'system:error': { error: string; context?: string };
  'module:registered': { id: string; name: string };
  'module:unregistered': { id: string };
  'module:activated': { id: string };
  'module:deactivated': { id: string };
  'module:error': { id: string; error: string };
  'orchestrator:start': { taskId: string; prompt: string };
  'orchestrator:persona:start': { taskId: string; persona: string };
  'orchestrator:persona:end': { taskId: string; persona: string; result: unknown };
  'orchestrator:complete': { taskId: string; result: unknown };
  'orchestrator:error': { taskId: string; error: string };
  'telemetry:update': TelemetryData;
  'telemetry:latency': { latencyMs: number };
  'telemetry:tokens': { tokensPerSecond: number };
  'chat:message:sent': { content: string; sessionId: string };
  'chat:message:received': { content: string; sessionId: string };
  'chat:stream:start': { sessionId: string };
  'chat:stream:chunk': { content: string; sessionId: string };
  'chat:stream:end': { sessionId: string };
  'auth:login': { userId: string };
  'auth:logout': void;
  'auth:session:expired': void;
  'apikey:configured': { provider: string };
  'apikey:removed': { provider: string };
  'apikey:validation:start': { provider: string };
  'apikey:validation:success': { provider: string };
  'apikey:validation:error': { provider: string; error: string };
  'audit:warning': { message: string; severity: 'low' | 'medium' | 'high' };
  'audit:block': { message: string; reason: string };
  'memory:stored': { id: string; type: string };
  'memory:retrieved': { count: number };
  'nav:module:select': { moduleId: string };
  'nav:settings:open': void;
  'soul:mesh:message': unknown;
}
export interface TelemetryData { latencyMs: number; tokensPerSecond: number; activeModules: number; memoryUsage: number; uptime: number; stateCriticality?: number; nodeId?: string; stale?: boolean; energyScore?: number; deviceBatteryPercent?: number; deviceCharging?: boolean; }
type EventCallback<T> = (data: T) => void | Promise<void>;
type UnsubscribeFn = () => void;
interface Subscription { id: number; callback: EventCallback<unknown>; once: boolean; }
class EventBusImpl {
  private listeners = new Map<keyof AeternumEvents, Subscription[]>();
  private subscriptionId = 0;
  private eventLog: Array<{ event: string; data: unknown; timestamp: number }> = [];
  private maxLogSize = 100;
  on<K extends keyof AeternumEvents>(event: K, callback: EventCallback<AeternumEvents[K]>): UnsubscribeFn { return this.addListener(event, callback, false); }
  once<K extends keyof AeternumEvents>(event: K, callback: EventCallback<AeternumEvents[K]>): UnsubscribeFn { return this.addListener(event, callback, true); }
  async emit<K extends keyof AeternumEvents>(event: K, data: AeternumEvents[K]): Promise<void> {
    this.logEvent(event, data); const listeners = this.listeners.get(event); if (!listeners?.length) return;
    const copy = [...listeners]; await Promise.allSettled(copy.map(async (sub) => { try { await sub.callback(data); } catch (error) { console.error(`[EventBus] ${String(event)}`, error); if (event !== 'system:error') await this.emit('system:error', { error: error instanceof Error ? error.message : 'Unknown error', context: `EventBus listener for ${String(event)}` }); } }));
    this.listeners.set(event, listeners.filter(sub => !sub.once || !copy.includes(sub)));
  }
  off<K extends keyof AeternumEvents>(event: K): void { this.listeners.delete(event); }
  clear(): void { this.listeners.clear(); }
  getLog(): Array<{ event: string; data: unknown; timestamp: number }> { return [...this.eventLog]; }
  listenerCount<K extends keyof AeternumEvents>(event: K): number { return this.listeners.get(event)?.length ?? 0; }
  private addListener<K extends keyof AeternumEvents>(event: K, callback: EventCallback<AeternumEvents[K]>, once: boolean): UnsubscribeFn { const id = ++this.subscriptionId; const subscription = { id, callback: callback as EventCallback<unknown>, once }; if (!this.listeners.has(event)) this.listeners.set(event, []); this.listeners.get(event)!.push(subscription); return () => { const subs = this.listeners.get(event); if (subs) { const index = subs.findIndex(s => s.id === id); if (index > -1) subs.splice(index, 1); } }; }
  private logEvent(event: string, data: unknown): void { this.eventLog.push({ event, data, timestamp: Date.now() }); if (this.eventLog.length > this.maxLogSize) this.eventLog.shift(); if (import.meta.env.DEV) console.log(`[EventBus] ${event}`, data); }
}
export const EventBus = new EventBusImpl();
import { useEffect } from 'react';
export function useEventBus<K extends keyof AeternumEvents>(event: K, callback: EventCallback<AeternumEvents[K]>, deps: React.DependencyList = []): void { useEffect(() => { const unsubscribe = EventBus.on(event, callback); return unsubscribe; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]); }
