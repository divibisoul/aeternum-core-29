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
import { createSupabaseVectorMemory } from '../../soul-fusion/SupabaseVectorMemory';

/** Boots Aeternum as a live Soul Mesh N01 nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'N01');
  const agents = new N01AgentRegistry();
  const vectorMemory = createSupabaseVectorMemory();

  agents.register({
    id: 'N01-mesh-agent',
    name: 'N01 Mesh Agent',
    capabilities: [
      'mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'supercompute.execute',
      'memory.gemini.embedding', 'memory.semantic.vector.recall', 'memory.semantic.vector.remember',
    ],
    execute: async (message: SoulMeshMessage) => {
      if (message.capability === 'mesh.health') return { nucleus: 'N01', healthy: true, timestamp: Date.now() };

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
        return {
          nucleus: 'N01',
          capability: message.capability,
          correlationId: message.correlationId,
          memories,
        };
      }

      if (message.capability === 'memory.semantic.vector.remember') {
        const input = message.payload as {
          content?: string; agentId?: string; sessionId?: string; memoryType?: string;
          metadata?: Record<string, unknown>; importance?: number; confidence?: number;
        };
        if (!input?.content?.trim()) throw new Error('N01_MEMORY_REMEMBER_CONTENT_REQUIRED');
        const stored = await vectorMemory.remember(input.content, {
          agentId: input.agentId,
          sessionId: input.sessionId,
          memoryType: input.memoryType,
          metadata: input.metadata,
          importance: input.importance,
          confidence: input.confidence,
        });
        if (!stored) throw new Error('N01_MEMORY_REMEMBER_UNAVAILABLE');
        return {
          nucleus: 'N01',
          capability: message.capability,
          correlationId: message.correlationId,
          stored: true,
        };
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
        capabilities: [
          'mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe',
          'cognitive.intent', 'agi.process', 'ai.reasoning', 'supercompute.execute',
          'memory.gemini.embedding', 'memory.semantic.vector.recall', 'memory.semantic.vector.remember',
        ],
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
  const processorRuntime = new ProcessorRuntime(processor, { healthRegistry });
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
    continuityBridge.dispose();
    registrations.forEach((unsubscribeHandler) => unsubscribeHandler());
    unsubscribe();
    router.close();
    void transport.close();
    void runtimeReady.then(() => processorRuntime.stop());
  };
}
