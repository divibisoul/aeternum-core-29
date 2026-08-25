/**
 * Contract for the Android Sentinel <-> Aeternum Core connection.
 *
 * This is the boundary: Android reports perception/telemetry; Core decides
 * what to do. Android is not reimplemented here.
 */
export type SoulNativeEventName =
  | 'android:ready'
  | 'android:context:update'
  | 'android:capability:changed'
  | 'android:error';

export interface AndroidContextSnapshot {
  timestamp: number;
  batteryPercent?: number;
  isCharging?: boolean;
  screenOn?: boolean;
  foregroundPackage?: string;
  usageAccessGranted?: boolean;
}

export interface SoulNativeEvent<T = unknown> {
  version: 1;
  source: 'soul-sentinel';
  event: SoulNativeEventName;
  timestamp: number;
  correlationId: string;
  payload: T;
}

export interface AndroidCapabilityChange {
  capability: string;
  available: boolean;
  reason?: string;
}

export interface AndroidError {
  code: string;
  message: string;
}

export function isSoulNativeEvent(value: unknown): value is SoulNativeEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 &&
    v.source === 'soul-sentinel' &&
    typeof v.event === 'string' &&
    typeof v.timestamp === 'number' &&
    typeof v.correlationId === 'string' &&
    'payload' in v;
}
