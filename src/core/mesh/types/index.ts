import type { SoulMeshCapability } from '../SoulMeshCapabilities';
import type { SoulMeshKind, SoulMeshMessage, SoulNucleus } from '../SoulMeshProtocol';

export type ExecutionPolicy = 'LOCAL_FIRST' | 'REMOTE_ONLY' | 'PARALLEL';

export type CapabilityOwnership = {
  owner: SoulNucleus;
  executionPolicy: ExecutionPolicy;
};

export type MeshCapabilityDescriptor = SoulMeshCapability & CapabilityOwnership;

export type MeshPeerRegistration = {
  nucleus: Exclude<SoulNucleus, 'N01'>;
  endpoint: string;
  capabilities: readonly MeshCapabilityDescriptor[];
  protocol: 'soul-mesh/1';
  contractVersion: string;
  authToken?: string;
  metadata?: Record<string, unknown>;
  registeredAt: number;
  lastSeen: number;
};

export type MeshRegistrationRequest = Omit<MeshPeerRegistration, 'registeredAt' | 'lastSeen'>;

export type MeshRegistrationResponse = {
  accepted: boolean;
  nucleus: SoulNucleus;
  peers: readonly MeshPeerRegistration[];
  reason?: string;
};

export type MeshHeartbeat = {
  nucleus: SoulNucleus;
  timestamp: number;
  capabilities?: readonly MeshCapabilityDescriptor[];
};

export type MeshAuthContext = {
  token?: string;
  disabled?: boolean;
};

export type MeshChannelDiagnostic = {
  peer: Exclude<SoulNucleus, 'N01'>;
  outbound: 'PASS' | 'FAIL' | 'SKIPPED';
  inbound: 'PASS' | 'FAIL' | 'UNVERIFIED';
  requestMs?: number;
  error?: string;
};

export type MeshWireContract = {
  protocol: 'soul-mesh/1';
  kind: SoulMeshKind;
  source: SoulNucleus;
  target: SoulNucleus;
  capability?: string;
  correlationId: string;
  message: SoulMeshMessage;
};
