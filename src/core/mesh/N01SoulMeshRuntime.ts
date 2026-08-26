import { AeternumAGI } from '../agi';
import { EventBus } from '../EventBus';
import { IntentAnalyzer } from '../cognitive/IntentAnalyzer';
import { ModuleRegistry } from '../ModuleRegistry';
import { SoulMeshCapabilityRegistry } from './SoulMeshCapabilityRegistry';
import { createSoulMeshRouter } from './createSoulMeshRouter';
import type { SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';
import { configuredPeers } from './SoulMeshPeerEndpoints';

export type N01MeshRuntimeOptions = {
  timeoutMs?: number;
  reasoning?: (input: { prompt: string; context?: unknown }) => Promise<unknown>;
};

/**
 * Binds N01's existing cognitive/runtime systems to the Mesh without copying
 * or replacing their implementations.
 */
export class N01SoulMeshRuntime {
  readonly capabilities = new SoulMeshCapabilityRegistry();
  readonly router;
  private readonly unregisters: Array<() => void> = [];
  private readonly options: N01MeshRuntimeOptions;

  constructor(transport: SoulMeshTransport, options: N01MeshRuntimeOptions = {}) {
    this.options = options;
    this.router = createSoulMeshRouter('N01', transport);
    this.registerCoreHandlers();
  }

  private registerCoreHandlers(): void {
    this.unregisters.push(this.router.onRequest('mesh.handshake', async (message) => ({
      protocol: message.protocol,
      nucleus: 'N01' as SoulNucleus,
      acceptedNuclei: ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'],
      timestamp: Date.now(),
    })));

    this.unregisters.push(this.router.onRequest('mesh.health', async () => ({
      nucleus: 'N01',
      status: 'online',
      configuredPeers: configuredPeers(),
      modules: ModuleRegistry.getAll().length,
      activeModule: ModuleRegistry.getActiveId(),
      agi: AeternumAGI.getInstance().getFullMetrics().overall,
      timestamp: Date.now(),
    })));

    this.unregisters.push(this.router.onRequest('mesh.capabilities', async () => ({
      nucleus: 'N01',
      capabilities: this.capabilities.get('N01'),
      timestamp: Date.now(),
    })));

    this.unregisters.push(this.router.onRequest('cognitive.intent', async (message) => {
      const payload = message.payload as { query?: unknown };
      const query = typeof payload?.query === 'string' ? payload.query : '';
      if (!query) throw new Error('cognitive.intent requires payload.query');
      return IntentAnalyzer.analyze(query);
    }));

    this.unregisters.push(this.router.onRequest('agi.process', async (message) => {
      const payload = message.payload as { input?: unknown };
      const input = typeof payload?.input === 'string' ? payload.input : '';
      if (!input) throw new Error('agi.process requires payload.input');
      const agi = AeternumAGI.getInstance();
      const result = agi.processInput(input);
      return {
        nucleus: 'N01',
        intention: result.intention,
        latticeOutput: result.latticeOutput,
        godelState: result.godelState,
        evolutionMetrics: result.evolutionMetrics,
        nipResult: result.nipResult,
        quantumResult: result.quantumResult,
        connectivityMetrics: result.connectivityMetrics,
        saiicMetrics: result.saiicMetrics,
        resourceMetrics: result.resourceMetrics,
      };
    }));

    this.unregisters.push(this.router.onRequest('ai.reasoning', async (message) => {
      const payload = message.payload as { prompt?: unknown; context?: unknown };
      const prompt = typeof payload?.prompt === 'string' ? payload.prompt : '';
      if (!prompt) throw new Error('ai.reasoning requires payload.prompt');
      if (!this.options.reasoning) {
        throw new Error('AI reasoning provider is not attached to N01 runtime');
      }
      return this.options.reasoning({ prompt, context: payload.context });
    }));

    EventBus.on('system:ready', () => {
      void this.broadcastMeshEvent('mesh.health', { nucleus: 'N01', status: 'ready' });
    });
  }

  async requestPeer(peer: Exclude<SoulNucleus, 'N01'>, capability: string, payload: unknown) {
    return this.router.request(peer, capability, payload);
  }

  async broadcastMeshEvent(capability: string, payload: unknown): Promise<void> {
    const peers: Exclude<SoulNucleus, 'N01'>[] = ['N02', 'N03', 'N04', 'N05', 'N06'];
    await Promise.allSettled(peers.map(peer => this.router.sendEvent(peer, capability, payload)));
  }

  close(): void {
    this.unregisters.forEach(unregister => unregister());
    this.unregisters.length = 0;
    this.router.close();
  }
}
