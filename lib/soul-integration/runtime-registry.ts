export type SoulNucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type SoulTransport = 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME';
export type RuntimeState = 'DISCOVERING' | 'READY' | 'DEGRADED' | 'OFFLINE';

export interface SoulRuntimeDescriptor {
  nucleus: SoulNucleusId;
  endpoint?: string;
  transports: SoulTransport[];
  capabilities: string[];
  state: RuntimeState;
  lastVerifiedAt?: string;
}

export interface CapabilityRoute {
  capability: string;
  owner: SoulNucleusId;
  transports: SoulTransport[];
  parallelizable: boolean;
}

const NUCLEI: SoulNucleusId[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];

export class SoulRuntimeRegistry {
  private readonly runtimes = new Map<SoulNucleusId, SoulRuntimeDescriptor>();
  private readonly capabilities = new Map<string, CapabilityRoute>();

  register(runtime: SoulRuntimeDescriptor): void {
    if (!NUCLEI.includes(runtime.nucleus)) throw new Error(`INVALID_NUCLEUS:${runtime.nucleus}`);
    this.runtimes.set(runtime.nucleus, { ...runtime, transports: [...runtime.transports], capabilities: [...runtime.capabilities] });
    for (const capability of runtime.capabilities) {
      this.capabilities.set(capability, {
        capability,
        owner: runtime.nucleus,
        transports: [...runtime.transports],
        parallelizable: true,
      });
    }
  }

  getRuntime(nucleus: SoulNucleusId): SoulRuntimeDescriptor | undefined {
    return this.runtimes.get(nucleus);
  }

  resolve(capability: string): CapabilityRoute | undefined {
    return this.capabilities.get(capability);
  }

  snapshot(): { runtimes: SoulRuntimeDescriptor[]; capabilities: CapabilityRoute[] } {
    return {
      runtimes: [...this.runtimes.values()].map((r) => ({ ...r, transports: [...r.transports], capabilities: [...r.capabilities] })),
      capabilities: [...this.capabilities.values()].map((c) => ({ ...c, transports: [...c.transports] })),
    };
  }

  topology(): { inChannels: number; outChannels: number; directionalChannels: number; complete: boolean } {
    const n = NUCLEI.length;
    const perNode = n - 1;
    const outChannels = n * perNode;
    const inChannels = n * perNode;
    return { inChannels, outChannels, directionalChannels: inChannels + outChannels, complete: inChannels === 30 && outChannels === 30 };
  }
}
