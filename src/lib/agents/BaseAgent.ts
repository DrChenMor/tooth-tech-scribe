
export interface AgentConfig {
  [key: string]: any;
}

export interface AgentSuggestion {
  target_type: string;
  target_id?: string;
  suggestion_data: Record<string, any>;
  reasoning: string;
  confidence_score: number;
  priority: number;
  expires_at?: Date;
}

export interface AgentAnalysisContext {
  articles?: any[];
  analytics?: any;
  userFeedback?: any;
  [key: string]: any;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected name: string;
  protected type: string;

  constructor(name: string, type: string, config: AgentConfig = {}) {
    this.name = name;
    this.type = type;
    this.config = config;
  }

  abstract analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]>;
  
  abstract explainReasoning(suggestion: AgentSuggestion): string;

  getName(): string {
    return this.name;
  }

  getType(): string {
    return this.type;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  protected generateConfidenceScore(factors: number[]): number {
    if (factors.length === 0) return 0;
    const average = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    return Math.max(0, Math.min(1, average));
  }

  protected calculatePriority(urgency: number, impact: number): number {
    // Convert urgency and impact (0-1) to priority (1-5, where 1 is highest)
    const score = urgency * impact;
    if (score >= 0.8) return 1;
    if (score >= 0.6) return 2;
    if (score >= 0.4) return 3;
    if (score >= 0.2) return 4;
    return 5;
  }
}
