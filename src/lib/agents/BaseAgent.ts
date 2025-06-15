import { getAIAnalysis, AVAILABLE_MODELS } from '@/services/aiModelService';

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

export interface AnalysisMetrics {
  engagement_score: number;
  freshness_score: number;
  quality_score: number;
  trending_score: number;
  seo_score: number;
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

  protected async performAIAnalysis(prompt: string): Promise<any> {
    if (!this.config.ai_model) {
      throw new Error("AI model is not configured for this agent.");
    }
    
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === this.config.ai_model);
    if (!modelInfo) {
      throw new Error(`Configuration for model ${this.config.ai_model} not found.`);
    }

    const agentConfigWithProvider = {
      ...this.config,
      provider: modelInfo.provider,
    };

    try {
      const result = await getAIAnalysis(prompt, agentConfigWithProvider);
      // The edge function returns a JSON string in the 'analysis' property
      const analysisData = JSON.parse(result.analysis);
      return analysisData;
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      if (error instanceof SyntaxError) {
        // This means the AI response was not valid JSON
        throw new Error("AI returned an invalid response format. Please check the AI's output or prompt.");
      }
      throw error;
    }
  }

  protected generateConfidenceScore(factors: number[]): number {
    if (factors.length === 0) return 0;
    
    // Use weighted harmonic mean for more conservative scoring
    const weights = factors.map((_, i) => 1 / (i + 1)); // Decreasing weights
    const weightedSum = factors.reduce((sum, factor, i) => sum + factor * weights[i], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    return Math.max(0, Math.min(1, weightedSum / totalWeight));
  }

  protected calculatePriority(urgency: number, impact: number, confidence: number = 1): number {
    // Enhanced priority calculation considering confidence
    const score = urgency * impact * confidence;
    if (score >= 0.8) return 1;
    if (score >= 0.6) return 2;
    if (score >= 0.4) return 3;
    if (score >= 0.2) return 4;
    return 5;
  }

  protected calculateEngagementScore(article: any): number {
    const views = article.views || 0;
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    // Engagement score based on views per day with decay
    const viewsPerDay = ageInDays > 0 ? views / ageInDays : views;
    const engagementScore = Math.min(1, viewsPerDay / 100); // Normalize to 0-1
    
    return engagementScore;
  }

  protected calculateFreshnessScore(article: any): number {
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    // Freshness score with exponential decay
    return Math.exp(-ageInDays / 30); // 30-day half-life
  }

  protected calculateQualityScore(article: any): AnalysisMetrics['quality_score'] {
    let score = 0.2; // Base score
    
    // Content length factor (more sophisticated)
    const contentLength = article.content?.length || 0;
    if (contentLength > 2000) score += 0.3;
    else if (contentLength > 1000) score += 0.2;
    else if (contentLength > 500) score += 0.1;
    
    // Structure factors
    if (article.excerpt && article.excerpt.length > 100) score += 0.2;
    if (article.image_url) score += 0.15;
    if (article.category) score += 0.1;
    
    // SEO factors
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 60) score += 0.05; // Optimal title length
    
    return Math.min(1, score);
  }

  protected calculateTrendingScore(article: any, allArticles: any[]): number {
    const views = article.views || 0;
    const avgViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0) / allArticles.length;
    
    // Trending based on views relative to average
    const relativePopularity = avgViews > 0 ? views / avgViews : 0;
    const trendingScore = Math.min(1, relativePopularity / 2); // Normalize
    
    return trendingScore;
  }

  protected calculateSEOScore(article: any): number {
    let score = 0.1; // Base score
    
    // Title optimization
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 60) score += 0.3;
    
    // Excerpt optimization
    if (article.excerpt && article.excerpt.length >= 120 && article.excerpt.length <= 160) {
      score += 0.3;
    }
    
    // Content structure
    if (article.content && article.content.length > 800) score += 0.2;
    if (article.image_url) score += 0.1;
    
    return Math.min(1, score);
  }

  protected generateComprehensiveMetrics(article: any, allArticles: any[]): AnalysisMetrics {
    return {
      engagement_score: this.calculateEngagementScore(article),
      freshness_score: this.calculateFreshnessScore(article),
      quality_score: this.calculateQualityScore(article),
      trending_score: this.calculateTrendingScore(article, allArticles),
      seo_score: this.calculateSEOScore(article)
    };
  }
}
