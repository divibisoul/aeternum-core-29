import type { N01PeerId } from './N01Channels';
import type { N01SessionTokenRecord } from './N01SessionAuth';

export interface N01PeerRegistrationRequest {
  peerId: N01PeerId;
  endpoint: string;
  capabilities: string[];
}

export interface N01PeerRegistrationRecord extends N01PeerRegistrationRequest {
  token: string;
  registeredAt: number;
  lastHeartbeatAt: number;
}

export interface N01RegistrationStore {
  save(record: N01PeerRegistrationRecord): Promise<void>;
  get(peerId: N01PeerId): Promise<N01PeerRegistrationRecord | null>;
  list(): Promise<N01PeerRegistrationRecord[]>;
}

export function createRegistrationRecord(
  request: N01PeerRegistrationRequest,
  session: N01SessionTokenRecord,
): N01PeerRegistrationRecord {
  const now = Date.now();
  return {
    ...request,
    token: session.token,
    registeredAt: now,
    lastHeartbeatAt: now,
  };
}
