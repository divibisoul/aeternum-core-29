import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION, SOUL_MESH_PROTOCOL } from './SoulMeshProtocol';
import { EventBus } from '../EventBus';

export type SoulMeshRequestHandler = (message: SoulMeshMessage) => unknown | Promise<unknown>;
export interface SoulMeshTrafficObserver {
  beforeSend?(message:SoulMeshMessage):unknown;
  afterSend?(message:SoulMeshMessage,receipt:unknown,error?:unknown):void;
  onReceive?(message:SoulMeshMessage):void;
}

/** Bidirectional nucleus router. Requests are executed locally and answered; events are published internally. */
export class SoulMeshRouter {
  private readonly pending = new Map<string, { resolve: (message: SoulMeshMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readonly handlers = new Map<string, SoulMeshRequestHandler>();
  private readonly unsubscribe: () => void;
  private trafficObserver?: SoulMeshTrafficObserver;

  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus, private readonly timeoutMs = 30000) {
    this.unsubscribe = transport.onMessage(async (message) => this.handle(message));
  }

  setTrafficObserver(observer?: SoulMeshTrafficObserver):void{this.trafficObserver=observer;}
  private beginTransmit(message:SoulMeshMessage):unknown{return this.trafficObserver?.beforeSend?.(message);}
  private finishTransmit(message:SoulMeshMessage,receipt:unknown,error?:unknown):void{try{this.trafficObserver?.afterSend?.(message,receipt,error);}catch(observerError){console.error('[SoulMeshRouter] traffic observer error',observerError);}}
  async request<T = unknown>(target: SoulNucleus, capability: string, payload: T, correlationId?: string): Promise<SoulMeshMessage> {
    const requestCorrelationId = correlationId?.trim() || crypto.randomUUID();
    if (!requestCorrelationId) throw new Error('Soul Mesh correlationId is required');
    const message: SoulMeshMessage<T> = {
      protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION,
      id: crypto.randomUUID(), correlationId: requestCorrelationId, source: this.local, target,
      kind: 'request', capability, payload, timestamp: Date.now(),
    };
    let receipt:unknown;
    try{receipt=this.beginTransmit(message);}catch(error){return Promise.reject(error instanceof Error?error:new Error(String(error)));}
    return new Promise<SoulMeshMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(requestCorrelationId); reject(new Error(`Soul Mesh request timeout: ${target}/${capability}`)); }, this.timeoutMs);
      this.pending.set(requestCorrelationId, { resolve, reject, timer });
      void this.transport.send(message).then(
        ()=>this.finishTransmit(message,receipt),
        (error)=>{this.finishTransmit(message,receipt,error);clearTimeout(timer);this.pending.delete(requestCorrelationId);reject(error instanceof Error?error:new Error(String(error)));}
      );
    });
  }

  onRequest(capability: string, handler: SoulMeshRequestHandler): () => void {
    this.handlers.set(capability, handler);
    return () => { if (this.handlers.get(capability) === handler) this.handlers.delete(capability); };
  }

  async sendEvent(target: SoulNucleus, capability: string, payload: unknown): Promise<void> {
    const message:SoulMeshMessage={protocol:SOUL_MESH_PROTOCOL,contractVersion:SOUL_MESH_CONTRACT_VERSION,id:crypto.randomUUID(),correlationId:crypto.randomUUID(),source:this.local,target,kind:'event',capability,payload,timestamp:Date.now()};
    const receipt=this.beginTransmit(message); try{await this.transport.send(message);this.finishTransmit(message,receipt);}catch(error){this.finishTransmit(message,receipt,error);throw error;}
  }

  private async handle(message: SoulMeshMessage): Promise<void> {
    if (message.target !== this.local) return;
    try{this.trafficObserver?.onReceive?.(message);}catch(observerError){console.error('[SoulMeshRouter] receive traffic observer error',observerError);}
    if (message.kind === 'response' || message.kind === 'error') {
      const pending = this.pending.get(message.correlationId);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.correlationId);
      if (message.kind === 'error') pending.reject(new Error(String((message.payload as { error?: unknown })?.error ?? 'Soul Mesh error')));
      else pending.resolve(message);
      return;
    }
    if (message.kind === 'request') {
      const handler = message.capability ? this.handlers.get(message.capability) : undefined;
      if (!handler) {
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { error: `Capability not registered: ${message.capability ?? 'unknown'}` }, timestamp: Date.now() });
        return;
      }
      try {
        const result = await handler(message);
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'response', capability: message.capability, payload: result, timestamp: Date.now() });
      } catch (error) {
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() });
      }
      return;
    }
    await EventBus.emit('soul:mesh:message' as never, message as never).catch(() => undefined);
  }

  close(): void { this.unsubscribe(); for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Soul Mesh router closed')); } this.pending.clear(); this.handlers.clear(); this.trafficObserver=undefined; }
}
