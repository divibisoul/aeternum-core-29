import type { MeshPeerRegistration } from './types';
import type { SoulNucleus } from './SoulMeshProtocol';

export interface DiscoveryAdapter {
  register(peer: MeshPeerRegistration): Promise<void>;
  resolve(nucleus: Exclude<SoulNucleus, 'N01'>): Promise<MeshPeerRegistration | undefined>;
  heartbeat(nucleus: Exclude<SoulNucleus, 'N01'>): Promise<boolean>;
  list(): Promise<MeshPeerRegistration[]>;
}

const DB_NAME = 'soul-mesh-discovery';
const DB_VERSION = 1;
const STORE_NAME = 'peers';

export class IndexedDBDiscoveryAdapter implements DiscoveryAdapter {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('INDEXED_DB_UNAVAILABLE'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_OPEN_FAILED'));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'nucleus' });
      };
      request.onsuccess = () => resolve(request.result);
    });
    return this.dbPromise;
  }

  async register(peer: MeshPeerRegistration): Promise<void> {
    const db = await this.open();
    await this.transaction(db, 'readwrite', store => store.put(peer));
  }

  async resolve(nucleus: Exclude<SoulNucleus, 'N01'>): Promise<MeshPeerRegistration | undefined> {
    const db = await this.open();
    return this.transaction(db, 'readonly', store => store.get(nucleus));
  }

  async heartbeat(nucleus: Exclude<SoulNucleus, 'N01'>): Promise<boolean> {
    const peer = await this.resolve(nucleus);
    if (!peer) return false;
    await this.register({ ...peer, lastSeen: Date.now() });
    return true;
  }

  async list(): Promise<MeshPeerRegistration[]> {
    const db = await this.open();
    return this.transaction(db, 'readonly', store => store.getAll());
  }

  private transaction<T>(db: IDBDatabase, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = operation(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_OPERATION_FAILED'));
      tx.onerror = () => reject(tx.error ?? new Error('INDEXED_DB_TRANSACTION_FAILED'));
    });
  }
}
