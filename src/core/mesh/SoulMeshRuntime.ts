import { EventBus } from '../EventBus';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import { N01AgentRegistry } from './N01AgentRegistry';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import { executeSuperComputePlan, createSuperComputePlan, summarizeSuperCompute, type SuperComputeTask } from './SoulSuperCompute';
import { sendTo } from '../soul-mesh/peerClient';
import { ProjetoClareira } from '../neural/ProjetoClareira';

/** Boots Aeternum as a live Soul Mesh N01 nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'N01');
  const agents = new N01AgentRegistry();

  agents.register({
    id: 'N01-mesh-agent',
    name: 'N01 Mesh Agent',
    capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'supercompute.execute', 'neural.clareira.status', 'neural.clareira.stimulus', 'neural.clareira.decision'],
    execute: async (message: SoulMeshMessage) => {
      if (message.capability === 'mesh.health') return { nucleus: 'N01', healthy: true, timestamp: Date.now() };

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
        capabilities: ['mesh.handshake', 'mesh.health', 'mesh.capabilities', 'mesh.describe', 'cognitive.intent', 'agi.process', 'ai.reasoning', 'supercompute.execute', 'neural.clareira.status', 'neural.clareira.stimulus', 'neural.clareira.decision'],
        peers: ['N02', 'N03', 'N04', 'N05', 'N06'],
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
