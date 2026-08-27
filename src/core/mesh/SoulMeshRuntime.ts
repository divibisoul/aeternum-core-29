import { EventBus } from '../EventBus';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import { hydrateSoulMeshDiscovery } from './SoulMeshDiscoveryRuntime';
import { n01SessionAuth } from './N01SessionAuth';

/** Boots Aeternum as the N01 Soul Mesh nucleus. */
export function startSoulMeshRuntime(): () => void {
  const transport = new SoulMeshSupabaseTransport();
  const router = new SoulMeshRouter(transport, 'N01');

  router.onRequest('mesh.health', async () => ({ nucleus: 'N01', healthy: true, timestamp: Date.now() }));
  router.onRequest('mesh.capabilities', async () => ({ nucleus: 'N01', capabilities: ['mesh.health', 'mesh.capabilities'] }));
  router.onRequest('mesh.echo', async message => ({ nucleus: 'N01', echoed: message.payload, timestamp: Date.now() }));

  void Promise.all([hydrateSoulMeshDiscovery(), n01SessionAuth.hydrate()]).catch(error => {
    void EventBus.emit('soul:mesh:discovery:error' as never, { error: error instanceof Error ? error.message : String(error) } as never);
  });

  const unsubscribe = EventBus.on('soul:mesh:message', async (message) => {
    if (message && typeof message === 'object') {
      const event = message as { source?: string; kind?: string };
      if (event.source && event.kind === 'event') {
        await EventBus.emit('system:ready', { modules: [`${event.source.toLowerCase()}-mesh`] });
      }
    }
  });

  return () => { unsubscribe(); router.close(); void transport.close(); };
}
