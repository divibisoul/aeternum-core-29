/**
 * Adapter that commissions the existing N01 mesh agent inside the generic
 * fusion runtime without duplicating its capability implementation.
 *
 * The N01AgentRegistry remains the capability owner. This adapter only maps
 * the internal NVOD fusion envelope to the canonical Soul Mesh message.
 */
import type { FusionEnvelope } from './FusionEnvelope';
import type { Processor } from './ProcessorContract';
import type { N01Agent } from '../mesh/N01AgentContract';
import { N01AgentRegistry } from '../mesh/N01AgentRegistry';
import { SOUL_MESH_CONTRACT_VERSION, SOUL_MESH_PROTOCOL, type SoulMeshMessage } from '../mesh/SoulMeshProtocol';

export class N01AgentProcessor implements Processor {
  readonly descriptor;
  private readonly registry: N01AgentRegistry;

  constructor(registry: N01AgentRegistry, agentId: string) {
    const agent = registry.describe().find((item) => item.id === agentId);
    if (!agent) throw new Error(`N01_AGENT_NOT_FOUND:${agentId}`);
    if (!agent.capabilities.length) throw new Error(`N01_AGENT_CAPABILITIES_REQUIRED:${agentId}`);

    this.registry = registry;
    this.descriptor = {
      id: agent.id,
      name: agent.name,
      analogy: 'existing N01 mesh agent behind the generic fusion runtime',
      purpose: 'Execute the existing N01 mesh capabilities without taking ownership away from the native agent registry.',
      authority: 'UNSPECIFIED' as const,
      capabilities: [...agent.capabilities],
      commissioning: 'OPERATIONAL' as const,
      nucleus: 'N01' as const,
      idempotentCapabilities: agent.capabilities.filter((capability) => capability === 'mesh.health' || capability === 'mesh.capabilities' || capability === 'mesh.describe'),
    };
  }

  handle(envelope: FusionEnvelope): Promise<unknown> | unknown {
    if (envelope.target && envelope.target !== 'N01') {
      throw new Error(`N01_FUSION_TARGET_MISMATCH:${envelope.target}`);
    }
    if (envelope.kind !== 'request') {
      throw new Error(`N01_FUSION_UNSUPPORTED_KIND:${envelope.kind}`);
    }

    const message: SoulMeshMessage = {
      protocol: SOUL_MESH_PROTOCOL,
      contractVersion: SOUL_MESH_CONTRACT_VERSION,
      id: envelope.id,
      correlationId: envelope.correlationId,
      source: 'N01',
      target: 'N01',
      kind: 'request',
      capability: envelope.capability,
      payload: envelope.payload,
      timestamp: envelope.timestamp,
      meta: {
        traceId: envelope.traceId,
        version: 'nvod-fusion/1',
      },
    };
    return this.registry.execute(message);
  }
}

export type { N01Agent };
