import { createEnvelope, type SoulMeshEnvelope, type SoulNodeId } from './SoulMeshEnvelope';
import { NUCLEUS_ID, type TransportKind } from './HybridTransportRegistry';

export type BridgeDirection = 'JS_TO_NATIVE' | 'NATIVE_TO_JS';
export interface BridgeRequest<T = unknown> { target: Exclude<SoulNodeId, 'BROADCAST'>; capability: string; payload: T; correlationId?: string; transport?: TransportKind; }
export interface BridgeCompletion<T = unknown> { correlationId: string; source: SoulNodeId; target: SoulNodeId; payload?: T; error?: string; }

type NativeBridge = { dispatch?: (message: string) => string | void; complete?: (message: string) => void };

const pending = new Map<string, { resolve: (value: BridgeCompletion) => void; reject: (reason: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

function nativeBridge(): NativeBridge | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as Window & { SoulHybridBridge?: NativeBridge }).SoulHybridBridge;
  return candidate ?? null;
}

export function dispatchToNative<T>(request: BridgeRequest<T>, timeoutMs = 30000): Promise<BridgeCompletion> {
  const bridge = nativeBridge();
  if (!bridge?.dispatch) return Promise.reject(new Error('SOUL_HYBRID_BRIDGE_UNAVAILABLE'));
  const envelope = createEnvelope({ source: NUCLEUS_ID, target: request.target, correlationId: request.correlationId ?? crypto.randomUUID(), type: 'CAPABILITY_REQUEST', payload: { capability: request.capability, payload: request.payload, transport: request.transport ?? 'WEBVIEW_BRIDGE' } });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(envelope.correlationId); reject(new Error(`SOUL_HYBRID_BRIDGE_TIMEOUT:${envelope.correlationId}`)); }, timeoutMs);
    pending.set(envelope.correlationId, { resolve, reject, timer });
    try {
      const rawResponse = bridge.dispatch(JSON.stringify(envelope));
      if (typeof rawResponse === 'string' && rawResponse.trim()) {
        const parsed = JSON.parse(rawResponse) as BridgeCompletion;
        if (parsed.error) {
          clearTimeout(timer);
          pending.delete(envelope.correlationId);
          reject(new Error(parsed.error));
          return;
        }
        if (parsed.correlationId !== envelope.correlationId) {
          clearTimeout(timer);
          pending.delete(envelope.correlationId);
          reject(new Error('SOUL_HYBRID_BRIDGE_CORRELATION_MISMATCH'));
          return;
        }
        clearTimeout(timer);
        pending.delete(envelope.correlationId);
        resolve(parsed);
      }
    } catch (error) {
      clearTimeout(timer);
      pending.delete(envelope.correlationId);
      reject(error);
    }
  });
}

export function completeFromNative<T>(completion: BridgeCompletion<T>): boolean {
  const entry = pending.get(completion.correlationId);
  if (!entry) return false;
  clearTimeout(entry.timer);
  pending.delete(completion.correlationId);
  if (completion.error) entry.reject(new Error(completion.error)); else entry.resolve(completion);
  return true;
}

export function installNativeCompletionListener(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: MessageEvent) => {
    const data = event.data;
    if (!data) return;
    try { completeFromNative(typeof data === 'string' ? JSON.parse(data) : data as BridgeCompletion); } catch { /* ignore malformed bridge events */ }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export function createNativeCompletion<T>(correlationId: string, payload: T, source: SoulNodeId = 'N01'): BridgeCompletion<T> { return { correlationId, source, target: NUCLEUS_ID, payload }; }

export function bridgeHealth() { return { nucleus: NUCLEUS_ID, transport: 'WEBVIEW_BRIDGE' as const, available: Boolean(nativeBridge()?.dispatch), pending: pending.size, bidirectional: true }; }

export type { SoulMeshEnvelope };
