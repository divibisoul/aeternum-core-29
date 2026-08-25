export type SoulMeshConnectionState = {
  nodeId: string;
  connected: boolean;
  lastSentAt: string | null;
  lastReceivedAt: string | null;
  lastError: string | null;
};

export function connectedState(nodeId: string): SoulMeshConnectionState {
  return { nodeId, connected: true, lastSentAt: null, lastReceivedAt: null, lastError: null };
}
