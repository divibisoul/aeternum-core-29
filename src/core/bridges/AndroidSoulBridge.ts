import { EventBus } from '../EventBus';
import type {
  AndroidCapabilityChange,
  AndroidContextSnapshot,
  AndroidError,
  SoulNativeEvent,
} from '../contracts/SoulNativeEvents';
import { isSoulNativeEvent } from '../contracts/SoulNativeEvents';

/**
 * Runtime adapter for Sentinel -> Aeternum perception.
 * Android owns device APIs; Core consumes normalized events.
 * Core -> Android commands are deliberately a separate contract and are not
 * enabled by this connection.
 */
export class AndroidSoulBridge {
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener('soul:native:event', this.handleDomEvent as EventListener);
  }

  stop(): void {
    if (!this.started) return;
    window.removeEventListener('soul:native:event', this.handleDomEvent as EventListener);
    this.started = false;
  }

  private readonly handleDomEvent = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    if (!isSoulNativeEvent(detail)) return;
    this.route(detail);
  };

  private route(event: SoulNativeEvent): void {
    switch (event.event) {
      case 'android:ready':
        EventBus.emit('telemetry:update', this.toTelemetry({ timestamp: event.timestamp }));
        break;
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
