
import { BaseAgent, AgentConfig, AgentSuggestion, AgentAnalysisContext, AnalysisMetrics } from './BaseAgent';

export interface CollaborationContext {
  otherAgentSuggestions: AgentSuggestion[];
  sharedMetrics: Record<string, any>;
  consensusThreshold: number;
}

export interface EnhancedAnalysisContext extends AgentAnalysisContext {
  historicalData?: any[];
  userBehaviorPatterns?: any;
  marketTrends?: any;
  competitorAnalysis?: any;
  collaboration?: CollaborationContext;
}

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

export abstract class EnhancedBaseAgent extends BaseAgent {
  protected learningData: Record<string, any> = {};
  protected collaborationHistory: Map<string, any[]> = new Map();

  constructor(name: string, type: string, config: AgentConfig = {}) {
    super(name, type, {
      learning_enabled: true,
      collaboration_enabled: true,
      reasoning_depth: 'deep',
      ...config
    });
  }

  abstract enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]>;

  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const enhancedContext = context as EnhancedAnalysisContext;
    return await this.enhancedAnalyze(enhancedContext);
  }

  protected generateReasoningSteps(
    decision: string,
    evidenceFactors: Array<{ factor: string; evidence: string[]; confidence: number; weight: number }>
  ): ReasoningStep[] {
    return evidenceFactors.map(factor => ({
      step: `Analysis of ${factor.factor}`,
      evidence: factor.evidence,
      confidence: factor.confidence,
      weight: factor.weight
    }));
  }

  protected assessImplementationComplexity(suggestion: AgentSuggestion): 'low' | 'medium' | 'high' {
    const dataSize = JSON.stringify(suggestion.suggestion_data).length;
    const hasMultipleSteps = suggestion.reasoning.split('.').length > 3;
    const requiresIntegration = suggestion.target_type !== 'article';

    if (dataSize > 1000 || hasMultipleSteps || requiresIntegration) return 'high';
    if (dataSize > 500 || hasMultipleSteps) return 'medium';
    return 'low';
  }

  protected assessExpectedImpact(metrics: AnalysisMetrics): 'low' | 'medium' | 'high' {
    const avgScore = (
      metrics.engagement_score + 
      metrics.quality_score + 
      metrics.trending_score + 
      metrics.seo_score
    ) / 4;

    if (avgScore >= 0.7) return 'high';
    if (avgScore >= 0.4) return 'medium';
    return 'low';
  }

  protected identifyPotentialRisks(suggestion: AgentSuggestion, context: EnhancedAnalysisContext): string[] {
    const risks: string[] = [];

    // Content-related risks
    if (suggestion.target_type === 'article') {
      if (suggestion.confidence_score < 0.6) {
        risks.push('Low confidence may indicate uncertain content quality');
      }
      if (suggestion.priority === 1) {
        risks.push('High priority changes may require immediate review');
      }
    }

    // Timing risks
    if (suggestion.expires_at && suggestion.expires_at < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      risks.push('Time-sensitive suggestion with short expiry window');
    }

    // Resource risks
    const complexity = this.assessImplementationComplexity(suggestion);
    if (complexity === 'high') {
      risks.push('High implementation complexity may require significant resources');
    }

    return risks;
  }

  protected generateAlternativeApproaches(suggestion: AgentSuggestion): string[] {
    const alternatives: string[] = [];
    
    switch (suggestion.target_type) {
      case 'article':
        alternatives.push('Gradual content improvement over multiple iterations');
        alternatives.push('A/B testing different content variations');
        alternatives.push('Community feedback integration before implementation');
        break;
      case 'hero_section':
        alternatives.push('Seasonal rotation of featured content');
        alternatives.push('User-personalized hero content');
        alternatives.push('Performance-based automatic rotation');
        break;
      default:
        alternatives.push('Phased implementation approach');
        alternatives.push('User testing before full rollout');
    }

    return alternatives;
  }

  protected async collaborateWithOtherAgents(
    context: EnhancedAnalysisContext,
    preliminarySuggestions: EnhancedSuggestion[]
  ): Promise<EnhancedSuggestion[]> {
    if (!context.collaboration || !this.config.collaboration_enabled) {
      return preliminarySuggestions;
    }

    const { otherAgentSuggestions, consensusThreshold } = context.collaboration;
    
    // Find overlapping suggestions
    const enhancedSuggestions = preliminarySuggestions.map(suggestion => {
      const relatedSuggestions = otherAgentSuggestions
        .filter(other => 
          other.target_type === suggestion.target_type && 
          other.target_id === suggestion.target_id
        )
        .map(other => `${other.agent_id}: ${other.reasoning.substring(0, 100)}...`);

      // Boost confidence if multiple agents agree
      let adjustedConfidence = suggestion.confidence_score;
      if (relatedSuggestions.length > 0) {
        const consensusBoost = Math.min(0.2, relatedSuggestions.length * 0.1);
        adjustedConfidence = Math.min(1, adjustedConfidence + consensusBoost);
      }

      return {
        ...suggestion,
        confidence_score: adjustedConfidence,
        related_suggestions: relatedSuggestions,
        reasoning_steps: [
          ...suggestion.reasoning_steps,
          {
            step: 'Cross-agent collaboration analysis',
            evidence: relatedSuggestions.length > 0 ? 
              [`Found ${relatedSuggestions.length} related suggestions from other agents`] : 
              ['No overlapping suggestions found from other agents'],
            confidence: relatedSuggestions.length > 0 ? 0.8 : 0.5,
            weight: 0.2
          }
        ]
      };
    });

    return enhancedSuggestions;
  }

  protected learnFromFeedback(suggestion: AgentSuggestion, feedback: 'approved' | 'rejected', notes?: string): void {
    if (!this.config.learning_enabled) return;

    const learningKey = `${suggestion.target_type}_${this.type}`;
    if (!this.learningData[learningKey]) {
      this.learningData[learningKey] = { approved: 0, rejected: 0, patterns: [] };
    }

    this.learningData[learningKey][feedback]++;
    
    if (notes) {
      this.learningData[learningKey].patterns.push({
        feedback,
        notes,
        confidence: suggestion.confidence_score,
        priority: suggestion.priority,
        timestamp: new Date().toISOString()
      });
    }
  }

  protected applyLearningToSuggestion(suggestion: EnhancedSuggestion): EnhancedSuggestion {
    if (!this.config.learning_enabled) return suggestion;

    const learningKey = `${suggestion.target_type}_${this.type}`;
    const learning = this.learningData[learningKey];

    if (learning && learning.approved + learning.rejected > 5) {
      const approvalRate = learning.approved / (learning.approved + learning.rejected);
      
      // Adjust confidence based on historical performance
      let confidenceAdjustment = 0;
      if (approvalRate > 0.8) confidenceAdjustment = 0.1;
      else if (approvalRate < 0.4) confidenceAdjustment = -0.1;

      const adjustedConfidence = Math.max(0, Math.min(1, suggestion.confidence_score + confidenceAdjustment));

      return {
        ...suggestion,
        confidence_score: adjustedConfidence,
        reasoning_steps: [
          ...suggestion.reasoning_steps,
          {
            step: 'Historical performance adjustment',
            evidence: [`Agent has ${(approvalRate * 100).toFixed(1)}% approval rate for ${suggestion.target_type} suggestions`],
            confidence: 0.9,
            weight: 0.15
          }
        ]
      };
    }

    return suggestion;
  }
}
