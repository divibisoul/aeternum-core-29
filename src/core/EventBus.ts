/**
 * NERVO VAGO - Global Event Bus (Pub/Sub)
 * 
 * Fully typed async event bus for decoupled component communication.
 * Components never import each other directly - they communicate through events.
 */

// Event type definitions
export interface AeternumEvents {
  // System events
  'system:init': { timestamp: number };
  'system:ready': { modules: string[] };
  'system:error': { error: string; context?: string };

  // Module events
  'module:registered': { id: string; name: string };
  'module:unregistered': { id: string };
  'module:activated': { id: string };
  'module:deactivated': { id: string };
  'module:error': { id: string; error: string };

  // Orchestrator events
  'orchestrator:start': { taskId: string; prompt: string };
  'orchestrator:persona:start': { taskId: string; persona: string };
  'orchestrator:persona:end': { taskId: string; persona: string; result: unknown };
  'orchestrator:complete': { taskId: string; result: unknown };
  'orchestrator:error': { taskId: string; error: string };

  // Telemetry events
  'telemetry:update': TelemetryData;
  'telemetry:latency': { latencyMs: number };
  'telemetry:tokens': { tokensPerSecond: number };

  // Chat events
  'chat:message:sent': { content: string; sessionId: string };
  'chat:message:received': { content: string; sessionId: string };
  'chat:stream:start': { sessionId: string };
  'chat:stream:chunk': { content: string; sessionId: string };
  'chat:stream:end': { sessionId: string };

  // Auth events
  'auth:login': { userId: string };
  'auth:logout': void;
  'auth:session:expired': void;

  // API Key events
  'apikey:configured': { provider: string };
  'apikey:removed': { provider: string };
  'apikey:validation:start': { provider: string };
  'apikey:validation:success': { provider: string };
  'apikey:validation:error': { provider: string; error: string };

  // Audit events
  'audit:warning': { message: string; severity: 'low' | 'medium' | 'high' };
  'audit:block': { message: string; reason: string };

  // Memory events
  'memory:stored': { id: string; type: string };
  'memory:retrieved': { count: number };

  // Navigation events
  'nav:module:select': { moduleId: string };
  'nav:settings:open': void;
}

export interface TelemetryData {
  latencyMs: number;
  tokensPerSecond: number;
  activeModules: number;
  memoryUsage: number;
  uptime: number;
}

type EventCallback<T> = (data: T) => void | Promise<void>;
type UnsubscribeFn = () => void;

interface Subscription {
  id: number;
  callback: EventCallback<unknown>;
  once: boolean;
}

class EventBusImpl {
  private listeners = new Map<keyof AeternumEvents, Subscription[]>();
  private subscriptionId = 0;
  private eventLog: Array<{ event: string; data: unknown; timestamp: number }> = [];
  private maxLogSize = 100;

  /**
   * Subscribe to an event
   */
  on<K extends keyof AeternumEvents>(
    event: K,
    callback: EventCallback<AeternumEvents[K]>
  ): UnsubscribeFn {
    return this.addListener(event, callback, false);
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof AeternumEvents>(
    event: K,
    callback: EventCallback<AeternumEvents[K]>
  ): UnsubscribeFn {
    return this.addListener(event, callback, true);
  }

  /**
   * Emit an event
   */
  async emit<K extends keyof AeternumEvents>(
    event: K,
    data: AeternumEvents[K]
  ): Promise<void> {
    // Log the event
    this.logEvent(event, data);

    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) return;

    // Create a copy to avoid issues if listeners modify the array
    const listenersCopy = [...listeners];
    
    // Execute all callbacks (async)
    const promises = listenersCopy.map(async (sub) => {
      try {
        await sub.callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${String(event)}:`, error);
        // Emit error but don't cause infinite loop
        if (event !== 'system:error') {
          this.emit('system:error', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            context: `EventBus listener for ${String(event)}`
          });
        }
      }
    });

    await Promise.allSettled(promises);

    // Remove one-time listeners
    const remaining = listeners.filter(sub => !sub.once || !listenersCopy.includes(sub));
    this.listeners.set(event, remaining);
  }

  /**
   * Remove all listeners for an event
   */
  off<K extends keyof AeternumEvents>(event: K): void {
    this.listeners.delete(event);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get event log for debugging
   */
  getLog(): Array<{ event: string; data: unknown; timestamp: number }> {
    return [...this.eventLog];
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof AeternumEvents>(event: K): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  private addListener<K extends keyof AeternumEvents>(
    event: K,
    callback: EventCallback<AeternumEvents[K]>,
    once: boolean
  ): UnsubscribeFn {
    const id = ++this.subscriptionId;
    const subscription: Subscription = {
      id,
      callback: callback as EventCallback<unknown>,
      once,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(subscription);

    // Return unsubscribe function
    return () => {
      const subs = this.listeners.get(event);
      if (subs) {
        const index = subs.findIndex(s => s.id === id);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  private logEvent(event: string, data: unknown): void {
    this.eventLog.push({
      event,
      data,
      timestamp: Date.now(),
    });

    // Keep log size bounded
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`[EventBus] ${event}`, data);
    }
  }
}

// Singleton instance
export const EventBus = new EventBusImpl();

// React hook for event subscription
import { useEffect } from 'react';

export function useEventBus<K extends keyof AeternumEvents>(
  event: K,
  callback: EventCallback<AeternumEvents[K]>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = EventBus.on(event, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
