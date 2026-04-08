/**
 * Darwin Machine - Open-Ended Evolution of Self-Improving Agents
 */

export interface EvolutionaryAgent {
  id: string;
  fitness: number;
  age: number;
  generation: number;
  capabilities: Map<string, number>;
}

export class DarwinMachine {
  private population: Map<string, EvolutionaryAgent> = new Map();
  private generation = 0;
  private evolutionInterval: number | null = null;
  private _isRunning = false;

  constructor() {
    this.initializePopulation(20);
  }

  private initializePopulation(size: number): void {
    for (let i = 0; i < size; i++) {
      const agent: EvolutionaryAgent = {
        id: `agent_${i}`, fitness: 0.5, age: 0, generation: 0,
        capabilities: new Map([
          ['learning', 0.5 + Math.random() * 0.3],
          ['reasoning', 0.4 + Math.random() * 0.4],
          ['creativity', 0.3 + Math.random() * 0.5],
          ['adaptation', 0.6 + Math.random() * 0.2]
        ])
      };
      this.population.set(agent.id, agent);
    }
  }

  startEvolution(intervalMs = 10000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.evolutionInterval = window.setInterval(() => this.executeEvolutionCycle(), intervalMs);
  }

  stopEvolution(): void {
    if (this.evolutionInterval) clearInterval(this.evolutionInterval);
    this.evolutionInterval = null;
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }

  private executeEvolutionCycle(): void {
    this.generation++;
    // Evaluate fitness
    for (const agent of this.population.values()) {
      const capAvg = Array.from(agent.capabilities.values()).reduce((s, v) => s + v, 0) / agent.capabilities.size;
      agent.fitness = capAvg + (Math.random() - 0.5) * 0.1;
      agent.age++;
    }

    // Selection & mutation
    const agents = Array.from(this.population.values()).sort((a, b) => b.fitness - a.fitness);
    const survivors = agents.slice(0, Math.floor(agents.length * 0.6));

    // Mutate survivors
    for (const agent of survivors) {
      agent.capabilities.forEach((value, key) => {
        if (Math.random() < 0.1) {
          agent.capabilities.set(key, Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.2)));
        }
      });
    }
  }

  getMetrics() {
    const agents = Array.from(this.population.values());
    const avgFitness = agents.reduce((s, a) => s + a.fitness, 0) / agents.length;
    const bestFitness = Math.max(...agents.map(a => a.fitness));
    return { generation: this.generation, populationSize: this.population.size, avgFitness, bestFitness, isRunning: this._isRunning };
  }

  getBestAgent(): EvolutionaryAgent | null {
    let best: EvolutionaryAgent | null = null;
    for (const agent of this.population.values()) {
      if (!best || agent.fitness > best.fitness) best = agent;
    }
    return best;
  }
}
