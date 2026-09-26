/**
 * wormholeRegistry — registro de módulos por assinatura.
 * COMPÕE com o ModuleRegistry existente do N01:
 *   - Se ModuleRegistry já registra módulos por id, wormhole DELEGA
 *     o registro a ele e mantém apenas a assinatura (capabilities,
 *     dependencies) que o ModuleRegistry talvez não tenha.
 *   - Se ModuleRegistry não existir neste ponto, wormhole funciona
 *     standalone. NÃO duplica tabela de módulos.
 */

export interface ModuleSignature {
  id: string;
  type: 'engine' | 'component' | 'service' | 'core' | 'capability' | 'orchestrator';
  version: string;
  capabilities: string[];
  dependencies: string[];
  registeredAt: number;
}

let externalRegistry: { register?: Function } | null = null;

class WormholeRegistry {
  private registry: Map<string, any> = new Map();
  private signatures: Map<string, ModuleSignature> = new Map();
  private connections: Map<string, string[]> = new Map();

  register(id: string, component: any, sig?: Partial<ModuleSignature>): void {
    this.registry.set(id, component);
    const full: ModuleSignature = {
      id,
      type: sig?.type ?? 'component',
      version: sig?.version ?? '1.0.0',
      capabilities: sig?.capabilities ?? [],
      dependencies: sig?.dependencies ?? [],
      registeredAt: Date.now(),
    };
    this.signatures.set(id, full);
    externalRegistry?.register?.(id, component, full);
  }

  get<T = any>(id: string): T | undefined { return this.registry.get(id); }
  has(id: string): boolean { return this.registry.has(id); }
  list(): string[] { return Array.from(this.registry.keys()); }
  getSignature(id: string): ModuleSignature | undefined { return this.signatures.get(id); }

  connect(sourceId: string, targetId: string): void {
    if (!this.connections.has(sourceId)) this.connections.set(sourceId, []);
    const arr = this.connections.get(sourceId)!;
    if (!arr.includes(targetId)) arr.push(targetId);
  }

  getConnections(id: string): string[] { return this.connections.get(id) ?? []; }

  findByType(type: ModuleSignature['type']): string[] {
    const out: string[] = [];
    this.signatures.forEach((s, id) => { if (s.type === type) out.push(id); });
    return out;
  }

  findByCapability(cap: string): string[] {
    const out: string[] = [];
    this.signatures.forEach((s, id) => { if (s.capabilities.includes(cap)) out.push(id); });
    return out;
  }

  unregister(id: string): void {
    this.registry.delete(id);
    this.signatures.delete(id);
    this.connections.delete(id);
  }
}

export const wormhole = new WormholeRegistry();
