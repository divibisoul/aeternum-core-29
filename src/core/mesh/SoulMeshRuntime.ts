import { EventBus } from '../EventBus';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import { N01AgentRegistry } from './N01AgentRegistry';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import { executeSuperComputePlan, createSuperComputePlan, summarizeSuperCompute, type SuperComputeTask } from './SoulSuperCompute';
import { sendTo } from '../soul-mesh/peerClient';
import { createFusionEnvelope } from '../fusion/FusionEnvelope';
import { N01AgentProcessor } from '../fusion/N01AgentProcessor';
import { ProcessorHealthRegistry } from '../fusion/ProcessorHealthRegistry';
import { ProcessorRuntime } from '../fusion/ProcessorRuntime';
import { HortaCoreContinuityBridge } from '../HortaCoreContinuityBridge';
import { HortaCoreMeshBridge } from './HortaCoreMeshBridge';
import { storeRgoStageInHortaCore, type RgoStagePayload } from '../rgo/RgoHortaCore';
import { createSupabaseVectorMemory } from '../../soul-fusion/SupabaseVectorMemory';
import { recoveredAeternumCapabilityBridge } from '../../../lib/aeternum/RecoveredAeternumCapabilityBridge';
import { runLettaCode, type LettaRequest } from './LettaCodeAdapter';
import { canonicalOwnerForExternalProvider, describeN01ExternalCapabilityFabric, resolveN01ExternalProvider } from '../fusion/N01ExternalCapabilityFabric';

/** Boots Aeternum as a live Soul Mesh N01 nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'N01');
  const hortaMeshBridge = new HortaCoreMeshBridge();
  router.setTrafficObserver(hortaMeshBridge);
  const agents = new N01AgentRegistry();
  const vectorMemory = createSupabaseVectorMemory();

  agents.register({
    id: 'N01-mesh-agent',
    name: 'N01 Mesh Agent',
    capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'supercompute.execute', 'rgo.hortacore.store', 'memory.gemini.embedding', 'memory.semantic.vector.recall', 'memory.semantic.vector.remember', 'memory.identity.letta-code@1.0.0', 'aeternum.architecture.guide', 'aeternum.blueprint.create', 'aeternum.neuralforge.create', 'external.capability.execute', 'external.capability.execute@1.0.0', 'external.capability.resolve@1.0.0', 'external.capability.fabric.describe@1.0.0'],
    execute: async (message: SoulMeshMessage) => {
      if (message.capability === 'mesh.health') return { nucleus: 'N01', healthy: true, timestamp: Date.now() };

      if (message.capability === 'aeternum.architecture.guide' || message.capability === 'aeternum.blueprint.create' || message.capability === 'aeternum.neuralforge.create') {
        return recoveredAeternumCapabilityBridge.execute(message.capability, message.payload);
      }

      if (message.capability === 'external.capability.resolve@1.0.0') {
        const input = message.payload;
        const provider = input && typeof input === 'object' && !Array.isArray(input)
          ? String((input as { provider?: unknown }).provider ?? '').trim()
          : '';
        if (!provider) throw new Error('N01_EXTERNAL_PROVIDER_REQUIRED');
        return { nucleus: 'N01', capability: message.capability, provider: resolveN01ExternalProvider(provider), correlationId: message.correlationId };
      }

      if (message.capability === 'external.capability.execute' || message.capability === 'external.capability.execute@1.0.0') {
        const input = message.payload;
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
          throw new Error('N01_EXTERNAL_CAPABILITY_PAYLOAD_REQUIRED');
        }
        const value = input as { provider?: unknown; capability?: unknown; payload?: unknown; workloads?: unknown[]; candidate?: Record<string, unknown>; strategy?: unknown; operation?: unknown };
        const provider = typeof value.provider === 'string' ? value.provider.trim() : '';
        if (!provider) throw new Error('N01_EXTERNAL_PROVIDER_REQUIRED');
        const source = resolveN01ExternalProvider(provider);
        const operation = typeof value.operation === 'string' ? value.operation.trim() : (typeof value.capability === 'string' ? value.capability.trim() : '');
        if (!operation) throw new Error('N01_EXTERNAL_OPERATION_REQUIRED');

        if (source.owner === 'N01' && provider === 'letta-code') {
          return runLettaCode((value.payload ?? {}) as LettaRequest);
        }

        const delegated = {
          payload: value.payload ?? {},
          metadata: {
            external_provider: provider,
            external_revision: source.revision,
            external_source: source.source,
            external_capabilities_json: JSON.stringify(source.capabilities),
            prefrontal_orbital: 'true',
            workloads_json: JSON.stringify(Array.isArray(value.workloads) ? value.workloads : []),
            candidate_json: JSON.stringify(value.candidate ?? { capability: operation, provider }),
            strategy: typeof value.strategy === 'string' ? value.strategy : 'n01-external-capability-federation',
          },
        };
        const owner = canonicalOwnerForExternalProvider(provider);
        if (owner === 'N01') throw new Error('N01_EXTERNAL_OWNER_ADAPTER_REQUIRED:' + provider);
        const response = await sendTo(owner as any, operation, delegated, 30000, message.correlationId);
        return response.payload;
      }

      if (message.capability === 'external.capability.fabric.describe@1.0.0') {
        return describeN01ExternalCapabilityFabric();
      }

      if (message.capability === 'memory.identity.letta-code@1.0.0') {
        return runLettaCode((message.payload ?? {}) as LettaRequest);
      }

      if (message.capability === 'rgo.hortacore.store') {
        const stage = message.payload as RgoStagePayload;
        const stored = storeRgoStageInHortaCore(stage);
        return { nucleus: 'N01', capability: message.capability, ...stored, persisted: true, timestamp: Date.now() };
      }



      if (message.capability === 'memory.gemini.embedding') {
        const input = message.payload as { text?: string };
        const embedding = await vectorMemory.embedText(input?.text ?? '');
        if (!embedding) throw new Error('N01_GEMINI_EMBEDDING_UNAVAILABLE');
        return {
          nucleus: 'N01',
          capability: message.capability,
          correlationId: message.correlationId,
          model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2',
          dimensions: embedding.length,
          embedding,
        };
      }

      if (message.capability === 'memory.semantic.vector.recall') {
        const input = message.payload as { text?: string; sessionId?: string; threshold?: number; limit?: number };
        if (!input?.text?.trim()) throw new Error('N01_MEMORY_RECALL_TEXT_REQUIRED');
        const memories = await vectorMemory.recall(input.text, {
          sessionId: input.sessionId,
          threshold: input.threshold,
          limit: input.limit,
        });
        return { nucleus: 'N01', capability: message.capability, correlationId: message.correlationId, memories };
      }

      if (message.capability === 'memory.semantic.vector.remember') {
        const input = message.payload as {
          content?: string; agentId?: string; sessionId?: string; memoryType?: string;
          metadata?: Record<string, unknown>; importance?: number; confidence?: number;
        };
        if (!input?.content?.trim()) throw new Error('N01_MEMORY_REMEMBER_CONTENT_REQUIRED');
        const stored = await vectorMemory.remember(input.content, {
          agentId: input.agentId, sessionId: input.sessionId, memoryType: input.memoryType,
          metadata: input.metadata, importance: input.importance, confidence: input.confidence,
        });
        if (!stored) throw new Error('N01_MEMORY_REMEMBER_UNAVAILABLE');
        return { nucleus: 'N01', capability: message.capability, correlationId: message.correlationId, stored: true };
      }

      if (message.capability === 'supercompute.execute') {
        const input = message.payload as { tasks?: SuperComputeTask[] };
        if (!Array.isArray(input?.tasks)) throw new Error('SUPERCOMPUTE_TASKS_REQUIRED');
        if (input.tasks.some((task) => task.target === 'N07')) throw new Error('N07_NOT_COMMISSIONED');
        const plan = createSuperComputePlan(input.tasks);
        const results = await executeSuperComputePlan(plan, {
          execute: async (task) => {
            if (task.target === 'N01') throw new Error('SUPERCOMPUTE_LOCAL_TASK_NOT_ROUTED');
            const response = await sendTo(task.target, task.capability, task.input);
            return response.payload;
          },
        });
        return { planId: plan.id, results, summary: summarizeSuperCompute(results) };
      }

      return {
        nucleus: 'N01',
        protocol: 'soul-mesh/1',
        contractVersion: '1.1.0',
        capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'cognitive.intent', 'agi.process', 'ai.reasoning', 'supercompute.execute', 'rgo.hortacore.store', 'memory.gemini.embedding', 'memory.semantic.vector.recall', 'memory.semantic.vector.remember', 'memory.identity.letta-code@1.0.0', 'aeternum.architecture.guide', 'aeternum.blueprint.create', 'aeternum.neuralforge.create', 'external.capability.execute', 'external.capability.execute@1.0.0'],
        peers: ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'],
        agent: 'N01-mesh-agent',
        timestamp: Date.now(),
      };
    },
  });

  // Commission the existing native N01 agent through the additive fusion
  // infrastructure. No capability implementation is copied or replaced.
  const processor = new N01AgentProcessor(agents, 'N01-mesh-agent');
  const healthRegistry = new ProcessorHealthRegistry();
  const continuityBridge = new HortaCoreContinuityBridge();
  continuityBridge.connectEventBus();
  continuityBridge.connectHealthRegistry(healthRegistry);
  const processorRuntime = new ProcessorRuntime(processor, { healthRegistry, heartbeatIntervalMs: 10_000 });
  const runtimeReady = processorRuntime.start();

  const meshAgentHandler = async (message: SoulMeshMessage) => {
    await runtimeReady;
    if (!message.capability) throw new Error('N01_MESH_CAPABILITY_REQUIRED');
    const envelope = createFusionEnvelope({
      source: message.source,
      target: 'N01',
      capability: message.capability,
      payload: message.payload,
      kind: 'request',
      correlationId: message.correlationId,
      causationId: message.id,
      traceId: message.meta?.traceId ?? message.correlationId,
      now: message.timestamp,
    });
    return processorRuntime.execute(envelope);
  };
  const registrations = [
    router.onRequest('mesh.handshake', meshAgentHandler),
    router.onRequest('mesh.health', meshAgentHandler),
    router.onRequest('mesh.capabilities', meshAgentHandler),
    router.onRequest('mesh.describe', meshAgentHandler),
    router.onRequest('supercompute.execute', meshAgentHandler),
    router.onRequest('rgo.hortacore.store', meshAgentHandler),
    router.onRequest('memory.gemini.embedding', meshAgentHandler),
    router.onRequest('memory.semantic.vector.recall', meshAgentHandler),
    router.onRequest('memory.semantic.vector.remember', meshAgentHandler),
    router.onRequest('memory.identity.letta-code@1.0.0', meshAgentHandler),
    router.onRequest('aeternum.architecture.guide', meshAgentHandler),
    router.onRequest('aeternum.blueprint.create', meshAgentHandler),
    router.onRequest('aeternum.neuralforge.create', meshAgentHandler),
    router.onRequest('external.capability.execute', meshAgentHandler),
    router.onRequest('external.capability.execute@1.0.0', 'external.capability.resolve@1.0.0', 'external.capability.fabric.describe@1.0.0', meshAgentHandler),
  ];

  const unsubscribe = EventBus.on('soul:mesh:message', async (message) => {
    if (message && typeof message === 'object') {
      const event = message as { source?: string; kind?: string };
      if (event.source === 'nexus' && event.kind === 'event') {
        await EventBus.emit('system:ready', { modules: ['nexus-mesh', 'supercompute'] });
      }
    }
  });

  return () => {
    router.setTrafficObserver();
    continuityBridge.dispose();
    registrations.forEach((unsubscribeHandler) => unsubscribeHandler());
    unsubscribe();
    router.close();
    void transport.close();
    void runtimeReady.then(() => processorRuntime.stop());
  };
}
