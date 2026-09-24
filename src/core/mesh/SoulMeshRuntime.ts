import { EventBus } from '../EventBus';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import { N01AgentRegistry } from './N01AgentRegistry';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { SuperComputeTask } from './SoulSuperCompute';
import { sendTo } from '../soul-mesh/peerClient';

/** Boots Aeternum as a live Soul Mesh N01 nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'N01');
  const agents = new N01AgentRegistry();

  agents.register({
    id: 'N01-mesh-agent',
    name: 'N01 Mesh Agent',
    capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'supercompute.execute', 'sara.hortacore.assess'],
    execute: async (message: SoulMeshMessage) => {
      if (message.capability === 'mesh.health') return { nucleus: 'N01', healthy: true, timestamp: Date.now() };

      if (message.capability === 'supercompute.execute') {
        const input = message.payload as { tasks?: SuperComputeTask[]; device?: string; operation?: string };
        if (!Array.isArray(input?.tasks) || input.tasks.length === 0) throw new Error('SUPERCOMPUTE_TASKS_REQUIRED');

        const tasks = input.tasks.map((task, index) => ({
          id: task.id,
          capability: task.capability,
          payload: {
            target: task.target,
            input: task.input,
            dependsOn: task.dependsOn ?? [],
            ...(input.operation ? { operation: input.operation } : {}),
          },
          required: true,
        }));

        const response = await sendTo('N07', 'supergpu.parallel', {
          tasks,
          ...(input.device ? { device: input.device } : {}),
        });
        return {
          planId: message.correlationId,
          delegatedTo: 'N07',
          capability: 'supergpu.parallel',
          parentCorrelationId: message.correlationId,
          results: response.payload,
          compatibility: { sourceCapability: 'supercompute.execute', owner: 'N07' },
        };
      }

      return {
        nucleus: 'N01',
        protocol: 'soul-mesh/1',
        contractVersion: '1.1.0',
        capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'cognitive.intent', 'agi.process', 'ai.reasoning', 'supercompute.execute', 'sara.hortacore.assess'],
        peers: ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'],
        agent: 'N01-mesh-agent',
        timestamp: Date.now(),
      };
    },
  });

  const meshAgentHandler = (message: SoulMeshMessage) => agents.execute(message);
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
    registrations.forEach((unsubscribeHandler) => unsubscribeHandler());
    unsubscribe();
    router.close();
    void transport.close();
  };
}