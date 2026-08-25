import { EventBus } from '../EventBus';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';

/** Boots Aeternum as a live Soul Mesh nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'aeternum');

  router.onRequest('mesh.health', async () => ({ nucleus: 'aeternum', healthy: true, timestamp: Date.now() }));
  router.onRequest('mesh.capabilities', async () => ({
    nucleus: 'aeternum',
    capabilities: ['mesh.health', 'mesh.capabilities'],
  }));

  const unsubscribe = EventBus.on('soul:mesh:message', async (message) => {
    if (message && typeof message === 'object') {
      const event = message as { source?: string; kind?: string };
      if (event.source === 'nexus' && event.kind === 'event') {
        await EventBus.emit('system:ready', { modules: ['nexus-mesh'] });
      }
    }
  });

  return () => { unsubscribe(); router.close(); void transport.close(); };
}
