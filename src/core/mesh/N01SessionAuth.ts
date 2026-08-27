import type { N01PeerId } from './N01Channels';

export interface N01SessionTokenRecord {
  peerId: N01PeerId;
  token: string;
  createdAt: number;
  expiresAt?: number;
}

const TOKEN_BYTES = 32;

function bytesToToken(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function generatePeerSessionToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytesToToken(bytes);
  }
  throw new Error('Cryptographically secure random generator unavailable');
}

export class N01SessionAuth {
  private readonly sessions = new Map<N01PeerId, N01SessionTokenRecord>();

  issue(peerId: N01PeerId, expiresAt?: number): N01SessionTokenRecord {
    const record = { peerId, token: generatePeerSessionToken(), createdAt: Date.now(), expiresAt };
    this.sessions.set(peerId, record);
    return record;
  }

  get(peerId: N01PeerId): N01SessionTokenRecord | undefined { return this.sessions.get(peerId); }

  revoke(peerId: N01PeerId): void { this.sessions.delete(peerId); }

  verify(peerId: N01PeerId, token: string): boolean {
    const record = this.sessions.get(peerId);
    if (!record || record.token !== token) return false;
    return !record.expiresAt || record.expiresAt > Date.now();
  }
}
