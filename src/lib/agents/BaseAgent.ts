import { getAIAnalysis, AVAILABLE_MODELS } from '@/services/aiModelService';

export interface AgentConfig {
  // Core AI settings
  ai_model?: string;
  prompt_template?: string;
  
  // Behavior settings
  confidence_threshold?: number;
  priority_weight?: 'conservative' | 'balanced' | 'aggressive';
  max_suggestions?: number;
  learning_enabled?: boolean;
  
  // Scheduling settings
  auto_run_enabled?: boolean;
  run_frequency?: 'hourly' | 'every_4_hours' | 'daily' | 'weekly';
  preferred_run_time?: string;
  analysis_window_hours?: number;
  
  // Trigger settings
  trigger_on_new_content?: boolean;
  trigger_on_view_threshold?: boolean;
  view_threshold?: number;
  custom_triggers?: string;
  
  // Collaboration settings
  collaboration_enabled?: boolean;
  collaboration_mode?: 'sequential' | 'parallel' | 'consensus';
  collaboration_partners?: string;
  collaboration_boost?: number;
  
  // Filtering settings
  category_filter?: string;
  min_content_age?: number;
  max_content_age?: number;
  content_length_filter?: 'all' | 'short' | 'medium' | 'long';
  custom_filters?: string;
  
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

  shouldRunAutomatically(): boolean {
    return this.config.auto_run_enabled || false;
  }

  getRunFrequency(): string {
    return this.config.run_frequency || 'manual';
  }

  shouldTriggerOnNewContent(): boolean {
    return this.config.trigger_on_new_content || false;
  }

  shouldTriggerOnViewThreshold(views: number): boolean {
    if (!this.config.trigger_on_view_threshold) return false;
    return views >= (this.config.view_threshold || 100);
  }

  isCollaborationEnabled(): boolean {
    return this.config.collaboration_enabled || false;
  }

  getCollaborationPartners(): string[] {
    if (!this.config.collaboration_partners) return [];
    return this.config.collaboration_partners.split(',').map(p => p.trim());
  }

  protected filterContentByConfig(articles: any[]): any[] {
    let filtered = [...articles];

    // Category filter
    if (this.config.category_filter) {
      const allowedCategories = this.config.category_filter.split(',').map(c => c.trim().toLowerCase());
      filtered = filtered.filter(article => 
        allowedCategories.includes(article.category?.toLowerCase())
      );
    }

    // Content age filter
    const now = Date.now();
    const minAgeMs = (this.config.min_content_age || 0) * 60 * 60 * 1000;
    const maxAgeMs = (this.config.max_content_age || 30) * 24 * 60 * 60 * 1000;

    filtered = filtered.filter(article => {
      const ageMs = now - new Date(article.created_at).getTime();
      return ageMs >= minAgeMs && ageMs <= maxAgeMs;
    });

    // Content length filter
    if (this.config.content_length_filter && this.config.content_length_filter !== 'all') {
      filtered = filtered.filter(article => {
        const wordCount = article.content?.split(' ').length || 0;
        switch (this.config.content_length_filter) {
          case 'short': return wordCount < 500;
          case 'medium': return wordCount >= 500 && wordCount <= 2000;
          case 'long': return wordCount > 2000;
          default: return true;
        }
      });
    }

    return filtered;
  }

  protected applyAdvancedFiltering(suggestions: AgentSuggestion[]): AgentSuggestion[] {
    let filtered = [...suggestions];

    // Apply confidence threshold
    const threshold = this.config.confidence_threshold || 0.7;
    filtered = filtered.filter(s => s.confidence_score >= threshold);

    // Apply max suggestions limit
    const maxSuggestions = this.config.max_suggestions || 5;
    if (filtered.length > maxSuggestions) {
      // Sort by confidence and priority, take top N
      filtered = filtered
        .sort((a, b) => {
          const aScore = a.confidence_score * (6 - a.priority); // Higher priority = lower number
          const bScore = b.confidence_score * (6 - b.priority);
          return bScore - aScore;
        })
        .slice(0, maxSuggestions);
    }

    // Apply priority weight adjustments
    if (this.config.priority_weight) {
      filtered = filtered.map(suggestion => {
        let adjustedConfidence = suggestion.confidence_score;
        
        switch (this.config.priority_weight) {
          case 'conservative':
            adjustedConfidence *= 0.8; // More conservative
            break;
          case 'aggressive':
            adjustedConfidence = Math.min(1, adjustedConfidence * 1.2); // More aggressive
            break;
          // 'balanced' keeps original confidence
        }
        
        return { ...suggestion, confidence_score: adjustedConfidence };
      });
    }

    return filtered;
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
      const analysisData = JSON.parse(result.analysis);
      return analysisData;
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      if (error instanceof SyntaxError) {
        throw new Error("AI returned an invalid response format. Please check the AI's output or prompt.");
      }
      throw error;
    }
  }

  protected generateConfidenceScore(factors: number[]): number {
    if (factors.length === 0) return 0;
    
    const weights = factors.map((_, i) => 1 / (i + 1));
    const weightedSum = factors.reduce((sum, factor, i) => sum + factor * weights[i], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    return Math.max(0, Math.min(1, weightedSum / totalWeight));
  }

  protected calculatePriority(urgency: number, impact: number, confidence: number = 1): number {
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
    
    const viewsPerDay = ageInDays > 0 ? views / ageInDays : views;
    const engagementScore = Math.min(1, viewsPerDay / 100);
    
    return engagementScore;
  }

  protected calculateFreshnessScore(article: any): number {
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return Math.exp(-ageInDays / 30);
  }

  protected calculateQualityScore(article: any): AnalysisMetrics['quality_score'] {
    let score = 0.2;
    
    const contentLength = article.content?.length || 0;
    if (contentLength > 2000) score += 0.3;
    else if (contentLength > 1000) score += 0.2;
    else if (contentLength > 500) score += 0.1;
    
    if (article.excerpt && article.excerpt.length > 100) score += 0.2;
    if (article.image_url) score += 0.15;
    if (article.category) score += 0.1;
    
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 60) score += 0.05;
    
    return Math.min(1, score);
  }

  protected calculateTrendingScore(article: any, allArticles: any[]): number {
    const views = article.views || 0;
    const avgViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0) / allArticles.length;
    
    const relativePopularity = avgViews > 0 ? views / avgViews : 0;
    const trendingScore = Math.min(1, relativePopularity / 2);
    
    return trendingScore;
  }

  protected calculateSEOScore(article: any): number {
    let score = 0.1;
    
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 60) score += 0.3;
    
    if (article.excerpt && article.excerpt.length >= 120 && article.excerpt.length <= 160) {
      score += 0.3;
    }
    
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
