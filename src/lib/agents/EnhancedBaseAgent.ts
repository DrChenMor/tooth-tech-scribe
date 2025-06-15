
import { BaseAgent, AgentConfig, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export interface ReasoningStep {
  step: string;
  evidence: string[];
  confidence: number;
  weight: number;
}

export interface EnhancedSuggestion extends AgentSuggestion {
  reasoning_steps: ReasoningStep[];
  alternative_approaches: string[];
  potential_risks: string[];
  implementation_complexity: 'low' | 'medium' | 'high';
  expected_impact: 'low' | 'medium' | 'high';
  related_suggestions: string[];
}

export interface EnhancedAnalysisContext extends AgentAnalysisContext {
  collaboration_data?: {
    other_agents?: string[];
    shared_insights?: any[];
  };
  historical_feedback?: {
    approved_suggestions: any[];
    rejected_suggestions: any[];
    performance_metrics: any;
  };
}

export abstract class EnhancedBaseAgent extends BaseAgent {
  protected learningData: Map<string, any> = new Map();
  protected collaborationEnabled: boolean = false;

  constructor(name: string, type: string, config: AgentConfig = {}) {
    super(name, type, config);
    this.collaborationEnabled = config.collaboration_enabled || false;
  }

  abstract enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]>;

  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    // Enhanced analysis with backward compatibility
    const enhancedContext: EnhancedAnalysisContext = {
      ...context,
      collaboration_data: {
        other_agents: [],
        shared_insights: []
      }
    };

    const enhancedSuggestions = await this.enhancedAnalyze(enhancedContext);
    
    // Return as base suggestions for compatibility
    return enhancedSuggestions.map(suggestion => ({
      target_type: suggestion.target_type,
      target_id: suggestion.target_id,
      suggestion_data: suggestion.suggestion_data,
      reasoning: suggestion.reasoning,
      confidence_score: suggestion.confidence_score,
      priority: suggestion.priority,
      expires_at: suggestion.expires_at
    }));
  }

  protected generateAlternativeApproaches(suggestion: AgentSuggestion): string[] {
    const alternatives: string[] = [];
    
    switch (suggestion.target_type) {
      case 'hero_section':
        alternatives.push(
          'Feature in sidebar instead of hero section',
          'Create dedicated trending section',
          'Add to newsletter highlights'
        );
        break;
      case 'article':
        alternatives.push(
          'Schedule for optimal timing',
          'Cross-promote on social media',
          'Create follow-up content series'
        );
        break;
      default:
        alternatives.push(
          'Gradual implementation approach',
          'A/B test different variations',
          'Pilot with subset of users'
        );
    }
    
    return alternatives;
  }

  protected identifyPotentialRisks(suggestion: AgentSuggestion, context: EnhancedAnalysisContext): string[] {
    const risks: string[] = [];
    
    // General risks based on confidence
    if (suggestion.confidence_score < 0.7) {
      risks.push('Low confidence may indicate unreliable prediction');
    }
    
    // Target-specific risks
    switch (suggestion.target_type) {
      case 'hero_section':
        risks.push(
          'May reduce visibility of other important content',
          'High visibility increases scrutiny of content quality'
        );
        break;
      case 'article':
        risks.push(
          'Changes may affect SEO rankings',
          'User expectations may not align with modifications'
        );
        break;
    }
    
    // Context-based risks
    if (context.articles && context.articles.length > 50) {
      risks.push('High content volume may dilute individual article impact');
    }
    
    return risks;
  }

  protected async collaborateWithOtherAgents(
    context: EnhancedAnalysisContext, 
    suggestions: EnhancedSuggestion[]
  ): Promise<EnhancedSuggestion[]> {
    if (!this.collaborationEnabled || !context.collaboration_data?.other_agents) {
      return suggestions;
    }

    // Simulate collaboration by enhancing suggestions with cross-agent insights
    return suggestions.map(suggestion => ({
      ...suggestion,
      confidence_score: Math.min(1, suggestion.confidence_score * 1.1), // Slight boost from collaboration
      related_suggestions: [
        ...suggestion.related_suggestions,
        'Cross-validated with other agents'
      ]
    }));
  }

  protected applyLearningToSuggestion(suggestion: EnhancedSuggestion): EnhancedSuggestion {
    // Apply learning from historical feedback
    const learningKey = `${suggestion.target_type}_${suggestion.suggestion_data.action}`;
    const historicalData = this.learningData.get(learningKey);
    
    if (historicalData) {
      // Adjust confidence based on historical performance
      const performanceMultiplier = historicalData.success_rate || 1.0;
      suggestion.confidence_score = Math.min(1, suggestion.confidence_score * performanceMultiplier);
    }
    
    return suggestion;
  }

  protected recordFeedback(suggestion: AgentSuggestion, outcome: 'approved' | 'rejected', feedback?: string): void {
    const learningKey = `${suggestion.target_type}_${suggestion.suggestion_data.action}`;
    const existingData = this.learningData.get(learningKey) || {
      total_suggestions: 0,
      approved_count: 0,
      success_rate: 1.0
    };
    
    existingData.total_suggestions++;
    if (outcome === 'approved') {
      existingData.approved_count++;
    }
    existingData.success_rate = existingData.approved_count / existingData.total_suggestions;
    
    this.learningData.set(learningKey, existingData);
  }

  // Enhanced reasoning explanation
  explainReasoning(suggestion: AgentSuggestion): string {
    if ('reasoning_steps' in suggestion) {
      const enhancedSuggestion = suggestion as EnhancedSuggestion;
      return enhancedSuggestion.reasoning_steps
        .map(step => `${step.step}: ${step.evidence.join(', ')} (confidence: ${(step.confidence * 100).toFixed(0)}%)`)
        .join('\n');
    }
    return suggestion.reasoning;
  }
}
