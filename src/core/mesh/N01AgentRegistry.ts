import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { N01Agent } from './N01AgentContract';

export class N01AgentRegistry {
  private readonly agents = new Map<string, N01Agent>();

  register(agent: N01Agent): void {
    this.agents.set(agent.id, agent);
  }

  find(capability: string): N01Agent | undefined {
    return [...this.agents.values()].find((agent) => agent.capabilities.includes(capability));
  }

  async execute(message: SoulMeshMessage): Promise<unknown> {
    const agent = this.find(message.capability ?? '');
    if (!agent) throw new Error(`AGENT_NOT_FOUND:${message.capability ?? ''}`);
    return agent.execute(message);
  }

  describe(): Array<Pick<N01Agent, 'id' | 'name' | 'capabilities'>> {
    return [...this.agents.values()].map(({ id, name, capabilities }) => ({ id, name, capabilities }));
  }
}
