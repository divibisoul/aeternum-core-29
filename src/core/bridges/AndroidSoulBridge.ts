import { EventBus } from '../EventBus';
import type {
  AndroidCapabilityChange,
  AndroidContextSnapshot,
  AndroidError,
  SoulNativeEvent,
} from '../contracts/SoulNativeEvents';
import { isSoulNativeEvent } from '../contracts/SoulNativeEvents';

export interface SoulNativeBridgeApi {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    SoulNativeBridge?: SoulNativeBridgeApi;
  }
}

/**
 * Runtime adapter between the Android Sentinel WebView bridge and Aeternum.
 *
 * Android owns device APIs. Core only receives normalized events and emits
 * decisions through the explicit bridge boundary.
 */
export class AndroidSoulBridge {
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener('soul:native:event', this.handleDomEvent as EventListener);
    this.post({
      event: 'android:ready',
      payload: { core: 'aeternum', contractVersion: 1 },
    });
  }

  stop(): void {
    if (!this.started) return;
    window.removeEventListener('soul:native:event', this.handleDomEvent as EventListener);
    this.started = false;
  }

  requestCapability(capability: string, correlationId = crypto.randomUUID()): void {
    this.post({
      event: 'android:capability:changed',
      payload: { capability, available: true },
      correlationId,
    });
  }

  private readonly handleDomEvent = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    if (!isSoulNativeEvent(detail)) return;
    this.route(detail);
  };

  private route(event: SoulNativeEvent): void {
    switch (event.event) {
      case 'android:ready':
      case 'android:context:update':
        EventBus.emit('telemetry:update', this.toTelemetry(event.payload as AndroidContextSnapshot));
        break;
      case 'android:capability:changed':
        EventBus.emit('module:activated', { id: `android:${(event.payload as AndroidCapabilityChange).capability}` });
        break;
      case 'android:error': {
        const error = event.payload as AndroidError;
        EventBus.emit('system:error', { error: error.message, context: `android:${error.code}` });
        break;
      }
    }
  }

  private post(input: {
    event: SoulNativeEvent['event'];
    payload: unknown;
    correlationId?: string;
  }): void {
    const message: SoulNativeEvent = {
      version: 1,
      source: 'soul-sentinel',
      event: input.event,
      timestamp: Date.now(),
      correlationId: input.correlationId ?? crypto.randomUUID(),
      payload: input.payload,
    };
    window.SoulNativeBridge?.postMessage(JSON.stringify(message));
  }

  private toTelemetry(snapshot: AndroidContextSnapshot) {
    return {
      latencyMs: 0,
      tokensPerSecond: 0,
      activeModules: 1,
      memoryUsage: 0,
      uptime: snapshot.timestamp,
    };
  }
}

export const androidSoulBridge = new AndroidSoulBridge();
