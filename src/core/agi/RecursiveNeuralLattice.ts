/**
 * Recursive Neural Lattice - Modular Evolvable Neural Architecture
 */

export interface LatticeMetrics {
  nodeCount: number;
  connectionCount: number;
  globalFitness: number;
  evolutionCycle: number;
  plasticity: number;
  coherence: number;
}

interface LatticeNode {
  id: string;
  type: 'input' | 'processing' | 'memory' | 'output' | 'meta';
  connections: Map<string, { weight: number; strength: number }>;
  activation: number;
  fitness: number;
  plasticity: number;
}

export class RecursiveNeuralLattice {
  private nodes: Map<string, LatticeNode> = new Map();
  private evolutionCycle = 0;
  private globalFitness = 0.5;
  private evolutionInterval: number | null = null;
  private _isRunning = false;

  constructor() {
    this.initializeLattice();
  }

  private initializeLattice(): void {
    const types: Array<{ prefix: string; type: LatticeNode['type']; count: number }> = [
      { prefix: 'input', type: 'input', count: 4 },
      { prefix: 'proc', type: 'processing', count: 8 },
      { prefix: 'mem', type: 'memory', count: 4 },
      { prefix: 'out', type: 'output', count: 3 },
      { prefix: 'meta', type: 'meta', count: 3 }
    ];

    for (const { prefix, type, count } of types) {
      for (let i = 0; i < count; i++) {
        this.nodes.set(`${prefix}_${i}`, {
          id: `${prefix}_${i}`, type,
          connections: new Map(), activation: 0,
          fitness: 0.5, plasticity: 0.7 + Math.random() * 0.3
        });
      }
    }

    // Create connections
    const ids = Array.from(this.nodes.keys());
    for (const id of ids) {
      const connCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < connCount; i++) {
        const target = ids[Math.floor(Math.random() * ids.length)];
        if (target !== id) {
          this.nodes.get(id)!.connections.set(target, {
            weight: Math.random() - 0.5, strength: Math.random() * 0.5 + 0.25
          });
        }
      }
    }
  }

  startEvolution(intervalMs = 5000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.evolutionInterval = window.setInterval(() => this.evolve(), intervalMs);
  }

  stopEvolution(): void {
    if (this.evolutionInterval) clearInterval(this.evolutionInterval);
    this.evolutionInterval = null;
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }

  private evolve(): void {
    this.evolutionCycle++;
    let totalFitness = 0;

    this.nodes.forEach(node => {
      const connScore = Math.min(1, node.connections.size / 6);
      node.fitness = (connScore + node.plasticity + Math.abs(node.activation)) / 3;
      totalFitness += node.fitness;

      // Mutate
      if (node.fitness < 0.4 && Math.random() < 0.15) {
        node.connections.forEach(conn => {
          conn.weight += (Math.random() - 0.5) * 0.1;
          conn.weight = Math.max(-1, Math.min(1, conn.weight));
        });
      }

      node.plasticity = Math.max(0.1, Math.min(1.0, node.plasticity + (Math.random() - 0.5) * 0.05));
    });

    this.globalFitness = totalFitness / this.nodes.size;
  }

  processInput(input: number[]): number[] {
    // Activate input nodes
    const inputNodes = Array.from(this.nodes.values()).filter(n => n.type === 'input');
    input.forEach((val, i) => {
      if (inputNodes[i]) inputNodes[i].activation = val;
    });

    // Propagate through processing
    const processingNodes = Array.from(this.nodes.values()).filter(n => n.type === 'processing');
    for (const node of processingNodes) {
      let sum = 0;
      node.connections.forEach((conn, targetId) => {
        const target = this.nodes.get(targetId);
        if (target) sum += target.activation * conn.weight;
      });
      node.activation = Math.tanh(sum);
    }

    // Read output
    const outputNodes = Array.from(this.nodes.values()).filter(n => n.type === 'output');
    return outputNodes.map(n => n.activation);
  }

  getMetrics(): LatticeMetrics {
    let totalConns = 0, totalPlasticity = 0;
    this.nodes.forEach(n => { totalConns += n.connections.size; totalPlasticity += n.plasticity; });
    return {
      nodeCount: this.nodes.size,
      connectionCount: totalConns,
      globalFitness: this.globalFitness,
      evolutionCycle: this.evolutionCycle,
      plasticity: totalPlasticity / this.nodes.size,
      coherence: this.globalFitness * 0.8 + (totalPlasticity / this.nodes.size) * 0.2
    };
  }
}
