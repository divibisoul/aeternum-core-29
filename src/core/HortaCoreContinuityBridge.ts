/**
 * HortaCoreContinuityBridge
 *
 * Ponte explícita entre:
 *   canonical EventBus -> HortaCore state index
 *   NVOD/fusion health -> HortaCore state index
 *
 * Não cria um novo barramento nem duplica a autoridade dos processadores.
 * O bridge somente materializa o estado observado no HortaCore para que as
 * frentes que já existem continuem conectadas e auditáveis.
 */
import type { AeternumEvents } from './EventBus';
import { EventBus } from './EventBus';
import { hortaCore, HortaCore } from './hortaCore';
import type { ProcessorHealth, ProcessorHealthRegistry } from './fusion/ProcessorHealthRegistry';

type ObservedEvent = keyof AeternumEvents;

const DEFAULT_EVENTS: readonly ObservedEvent[] = [
  'system:init',
  'system:ready',
  'system:error',
  'audit:warning',
  'audit:block',
  'soul:mesh:message',
  'clareira.packet.ingested',
  'clareira.packet.processed',
  'clareira.packet.dropped',
  'clareira.degraded',
  'clareira.started',
  'clareira.stopped',
];

function compactEventData(event: ObservedEvent, data: AeternumEvents[ObservedEvent]): unknown {
  if (event === 'soul:mesh:message' && data && typeof data === 'object') {
    const message = data as Record<string, unknown>;
    return {
      protocol: message.protocol,
      contractVersion: message.contractVersion,
      id: message.id,
      correlationId: message.correlationId,
      source: message.source,
      target: message.target,
      kind: message.kind,
      capability: message.capability,
      timestamp: message.timestamp,
    };
  }
  return data;
}

export class HortaCoreContinuityBridge {
  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly state: HortaCore = hortaCore,
  ) {}

  connectEventBus(events: readonly ObservedEvent[] = DEFAULT_EVENTS): () => void {
    const localCleanups = events.map((event) =>
      EventBus.on(event, (data) => {
        this.state.set(`continuity.event.${String(event)}.last`, {
          observedAt: Date.now(),
          data: compactEventData(event, data as never),
        });
        this.state.set('continuity.lastEventAt', Date.now());
      }),
    );

    const cleanup = () => {
      for (const unsubscribe of localCleanups) unsubscribe();
    };
    this.cleanups.push(cleanup);
    return cleanup;
  }

  connectHealthRegistry(registry: ProcessorHealthRegistry): () => void {
    const cleanup = registry.onUpdate((health) => {
      this.recordProcessorHealth(health, registry.aggregate());
    });
    this.cleanups.push(cleanup);
    return cleanup;
  }

  recordProcessorHealth(
    health: ProcessorHealth,
    aggregate: ReturnType<ProcessorHealthRegistry['aggregate']>,
  ): void {
    this.state.set(`continuity.fusion.processor.${health.processorId}`, {
      effectiveState: health.effectiveState,
      commissioning: health.commissioning,
      stale: health.stale,
      heartbeatAgeMs: health.heartbeatAgeMs,
      queueDepth: health.queueDepth,
      inFlight: health.inFlight,
      meanLatencyMs: health.meanLatencyMs,
      errorRate: health.errorRate,
      lastError: health.lastError,
      restarts: health.restarts,
      at: health.at,
      reasons: [...health.reasons],
    });
    this.state.set('continuity.fusion.aggregate', aggregate);
    this.state.set('continuity.lastHealthAt', Date.now());
  }

  dispose(): void {
    while (this.cleanups.length > 0) this.cleanups.pop()?.();
  }
}
