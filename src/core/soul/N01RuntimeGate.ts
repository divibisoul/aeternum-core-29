import { authorizeCapability } from './CapabilityAuthorization';
import { getN01Capabilities, validateCapabilityGraph } from './CapabilityGraph';
import { MeshRouter } from './MeshRouter';
import type { SoulMeshEnvelope } from './SoulMeshEnvelope';

export interface N01RuntimeGateOptions { secret: string; }

/** Narrow execution boundary: authenticate first, then authorize requested tasks. */
export class N01RuntimeGate {
  private readonly router: MeshRouter;
  private readonly capabilities = getN01Capabilities();

  constructor(options: N01RuntimeGateOptions) {
    this.router = new MeshRouter(options.secret);
    validateCapabilityGraph(this.capabilities);
  }

  async accept(message: SoulMeshEnvelope): Promise<boolean> {
    if (!(await this.router.verify(message))) return false;
    if (message.type !== 'TASK') return true;
    const payload = message.payload as { capabilityId?: unknown };
    if (typeof payload?.capabilityId !== 'string') return false;
    return authorizeCapability({ capabilityId: payload.capabilityId, source: message.source, target: message.target }, this.capabilities);
  }
}
