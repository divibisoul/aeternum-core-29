import { authorizeCapability } from './CapabilityAuthorization';
import { getN01Capabilities, validateCapabilityGraph } from './CapabilityGraph';
import { MeshRouter } from './MeshRouter';
import { verifyAndReplayProtect } from './N01Integrity';
import type { SoulMeshEnvelope } from './SoulMeshEnvelope';

export interface N01RuntimeGateOptions { secret: string; }

export class N01RuntimeGate {
  private readonly router: MeshRouter;
  private readonly capabilities = getN01Capabilities();

  constructor(private readonly options: N01RuntimeGateOptions) {
    this.router = new MeshRouter(options.secret);
    validateCapabilityGraph(this.capabilities);
  }

  async accept(message: SoulMeshEnvelope): Promise<boolean> {
    if (!(await verifyAndReplayProtect(message, this.options.secret))) return false;
    if (message.type !== 'TASK') return true;
    const payload = message.payload as { capabilityId?: unknown; permission?: unknown };
    if (typeof payload?.capabilityId !== 'string') return false;
    return authorizeCapability({
      capabilityId: payload.capabilityId,
      source: message.source,
      target: message.target,
      requiredPermission: typeof payload.permission === 'string' ? payload.permission : undefined,
    }, this.capabilities);
  }
}
