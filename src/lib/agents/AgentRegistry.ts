
import { BaseAgent, AgentConfig } from './BaseAgent';
import { TrendingContentAgent } from './TrendingContentAgent';
import { SummarizationAgent } from './SummarizationAgent';
import { ContentGapAgent } from './ContentGapAgent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();
  private agentTypes: Map<string, typeof BaseAgent> = new Map();

  private constructor() {
    this.registerAgentTypes();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private registerAgentTypes(): void {
    this.agentTypes.set('trending-content-agent', TrendingContentAgent as any);
    this.agentTypes.set('summarization-agent', SummarizationAgent as any);
    this.agentTypes.set('content-gap-agent', ContentGapAgent as any);
  }

  createAgent(name: string, type: string, config: AgentConfig = {}): BaseAgent | null {
    const AgentClass = this.agentTypes.get(type);
    if (!AgentClass) {
      console.error(`Agent type ${type} not found`);
      return null;
    }

    const agent = new AgentClass(name, type, config);
    this.agents.set(name, agent);
    return agent;
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  getAvailableAgentTypes(): string[] {
    return Array.from(this.agentTypes.keys());
  }
}
