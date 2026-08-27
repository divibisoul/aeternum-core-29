import type { N01PeerId } from './N01Channels';

export interface N01SessionTokenRecord {
  peerId: N01PeerId;
  token: string;
  createdAt: number;
  expiresAt?: number;
}

export interface N01SessionTokenStore {
  save(record: N01SessionTokenRecord): Promise<void>;
  get(peerId: N01PeerId): Promise<N01SessionTokenRecord | undefined>;
  list(): Promise<N01SessionTokenRecord[]>;
  remove(peerId: N01PeerId): Promise<void>;
}

const TOKEN_BYTES = 32;
const DB_NAME = 'soul-mesh-n01-auth';
const DB_VERSION = 1;
const STORE_NAME = 'peer-tokens';

function bytesToToken(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function generatePeerSessionToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  if (!globalThis.crypto?.getRandomValues) throw new Error('Cryptographically secure random generator unavailable');
  globalThis.crypto.getRandomValues(bytes);
  return bytesToToken(bytes);
}

export class IndexedDBSessionTokenStore implements N01SessionTokenStore {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('INDEXED_DB_UNAVAILABLE')); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error ?? new Error('AUTH_DB_OPEN_FAILED'));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'peerId' });
      };
      request.onsuccess = () => resolve(request.result);
    });
    return this.dbPromise;
  }

  async save(record: N01SessionTokenRecord): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('AUTH_DB_SAVE_FAILED'));
    });
  }

  async get(peerId: N01PeerId): Promise<N01SessionTokenRecord | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(peerId);
      request.onsuccess = () => resolve(request.result as N01SessionTokenRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error('AUTH_DB_GET_FAILED'));
    });
  }

  async list(): Promise<N01SessionTokenRecord[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as N01SessionTokenRecord[]);
      request.onerror = () => reject(request.error ?? new Error('AUTH_DB_LIST_FAILED'));
    });
  }

  async remove(peerId: N01PeerId): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(peerId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('AUTH_DB_REMOVE_FAILED'));
    });
  }
}

export class N01SessionAuth {
  private readonly sessions = new Map<N01PeerId, N01SessionTokenRecord>();
  constructor(private readonly store?: N01SessionTokenStore) {}

  async hydrate(): Promise<void> {
    if (!this.store) return;
    for (const session of await this.store.list()) this.sessions.set(session.peerId, session);
  }

  async issue(peerId: N01PeerId, expiresAt?: number): Promise<N01SessionTokenRecord> {
    const record = { peerId, token: generatePeerSessionToken(), createdAt: Date.now(), expiresAt };
    this.sessions.set(peerId, record);
    await this.store?.save(record);
    return record;
  }

  get(peerId: N01PeerId): N01SessionTokenRecord | undefined { return this.sessions.get(peerId); }

  async revoke(peerId: N01PeerId): Promise<void> {
    this.sessions.delete(peerId);
    await this.store?.remove(peerId);
  }

  verify(peerId: N01PeerId, token: string): boolean {
    const record = this.sessions.get(peerId);
    if (!record || record.token !== token) return false;
    return !record.expiresAt || record.expiresAt > Date.now();
  }
}

export const n01SessionAuth = new N01SessionAuth(
  typeof indexedDB === 'undefined' ? undefined : new IndexedDBSessionTokenStore(),
);
