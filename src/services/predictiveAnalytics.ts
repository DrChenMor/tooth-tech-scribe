
import { supabase } from '@/integrations/supabase/client';
import { AISuggestion } from './aiAgents';

export interface PredictionModel {
  name: string;
  type: 'engagement' | 'quality' | 'trending' | 'viral';
  accuracy: number;
  lastTrained: string;
  version: string;
}

export interface EngagementPrediction {
  article_id: string;
  predicted_views_24h: number;
  predicted_views_7d: number;
  predicted_views_30d: number;
  confidence: number;
  factors: Array<{
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

export interface TrendingPrediction {
  article_id: string;
  trending_probability: number;
  peak_time_prediction: string;
  viral_potential: number;
  optimal_promotion_window: {
    start: string;
    end: string;
  };
  recommended_actions: string[];
}

export interface QualityPrediction {
  article_id: string;
  quality_score: number;
  improvement_potential: number;
  suggested_improvements: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
    effort: number;
  }>;
}

export interface CrossAgentInsight {
  insight_type: 'consensus' | 'conflict' | 'complement';
  agents_involved: string[];
  confidence: number;
  description: string;
  recommended_action: string;
  supporting_evidence: string[];
}

export interface PredictiveAnalyticsContext {
  articles: any[];
  suggestions: AISuggestion[];
  timeframe: 'daily' | 'weekly' | 'monthly';
  focus_areas: string[];
}

class PredictiveAnalyticsService {
  private models: Map<string, PredictionModel> = new Map();
  private predictionCache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    const models: PredictionModel[] = [
      {
        name: 'engagement-predictor-v2',
        type: 'engagement',
        accuracy: 0.82,
        lastTrained: new Date().toISOString(),
        version: '2.1.0'
      },
      {
        name: 'trending-analyzer-v1',
        type: 'trending',
        accuracy: 0.75,
        lastTrained: new Date().toISOString(),
        version: '1.3.0'
      },
      {
        name: 'viral-detector-v1',
        type: 'viral',
        accuracy: 0.68,
        lastTrained: new Date().toISOString(),
        version: '1.1.0'
      },
      {
        name: 'quality-assessor-v2',
        type: 'quality',
        accuracy: 0.85,
        lastTrained: new Date().toISOString(),
        version: '2.0.0'
      }
    ];

    models.forEach(model => this.models.set(model.name, model));
  }

  async predictEngagement(articles: any[]): Promise<EngagementPrediction[]> {
    const cacheKey = 'engagement_predictions';
    const cached = this.getCachedPrediction(cacheKey);
    if (cached) return cached;

    const predictions: EngagementPrediction[] = [];

    for (const article of articles) {
      const prediction = await this.generateEngagementPrediction(article, articles);
      predictions.push(prediction);
    }

    this.cachePrediction(cacheKey, predictions);
    return predictions;
  }

  async predictTrending(articles: any[]): Promise<TrendingPrediction[]> {
    const cacheKey = 'trending_predictions';
    const cached = this.getCachedPrediction(cacheKey);
    if (cached) return cached;

    const predictions: TrendingPrediction[] = [];

    for (const article of articles) {
      const prediction = await this.generateTrendingPrediction(article, articles);
      predictions.push(prediction);
    }

    this.cachePrediction(cacheKey, predictions);
    return predictions;
  }

  async predictQuality(articles: any[]): Promise<QualityPrediction[]> {
    const cacheKey = 'quality_predictions';
    const cached = this.getCachedPrediction(cacheKey);
    if (cached) return cached;

    const predictions: QualityPrediction[] = [];

    for (const article of articles) {
      const prediction = await this.generateQualityPrediction(article);
      predictions.push(prediction);
    }

    this.cachePrediction(cacheKey, predictions);
    return predictions;
  }

  async generateCrossAgentInsights(suggestions: AISuggestion[]): Promise<CrossAgentInsight[]> {
    const insights: CrossAgentInsight[] = [];

    // Group suggestions by target
    const suggestionGroups = suggestions.reduce((groups, suggestion) => {
      const key = `${suggestion.target_type}_${suggestion.target_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(suggestion);
      return groups;
    }, {} as Record<string, AISuggestion[]>);

    // Analyze each group for insights
    for (const [target, groupSuggestions] of Object.entries(suggestionGroups)) {
      if (groupSuggestions.length > 1) {
        const groupInsights = await this.analyzeGroupConsensus(groupSuggestions);
        insights.push(...groupInsights);
      }
    }

    // Find complementary suggestions across different targets
    const complementaryInsights = await this.findComplementarySuggestions(suggestions);
    insights.push(...complementaryInsights);

    return insights;
  }

  private async generateEngagementPrediction(article: any, allArticles: any[]): Promise<EngagementPrediction> {
    const currentViews = article.views || 0;
    const ageInDays = Math.max(1, Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = currentViews / ageInDays;

    // Factor analysis
    const factors = this.analyzeEngagementFactors(article, allArticles);
    const trendMultiplier = this.calculateTrendMultiplier(article, allArticles);
    const seasonalMultiplier = this.calculateSeasonalMultiplier(article);

    // Predictions with decay
    const predicted24h = Math.round(dailyAverage * trendMultiplier * seasonalMultiplier * 0.1);
    const predicted7d = Math.round(predicted24h * 6.5); // Slightly less than 7x due to decay
    const predicted30d = Math.round(predicted7d * 4.0); // Significant decay over time

    // Confidence based on article age and data quality
    const confidence = Math.max(0.3, Math.min(0.9, 
      (ageInDays >= 3 ? 0.8 : 0.5) * (currentViews > 50 ? 1.0 : 0.7)
    ));

    return {
      article_id: article.id?.toString() || '',
      predicted_views_24h: predicted24h,
      predicted_views_7d: predicted7d,
      predicted_views_30d: predicted30d,
      confidence,
      factors
    };
  }

  private async generateTrendingPrediction(article: any, allArticles: any[]): Promise<TrendingPrediction> {
    const engagementVelocity = this.calculateEngagementVelocity(article);
    const socialFactors = this.analyzeSocialFactors(article);
    const competitiveContext = this.analyzeCompetitiveContext(article, allArticles);

    const trendingProbability = (engagementVelocity * 0.4 + socialFactors * 0.4 + competitiveContext * 0.2);
    const viralPotential = this.calculateViralPotential(article);

    // Peak time prediction based on current trajectory
    const hoursTo峰 = this.estimateHoursToPeak(article, engagementVelocity);
    const peakTime = new Date(Date.now() + hoursTo峰 * 60 * 60 * 1000);

    // Optimal promotion window (before peak)
    const promotionStart = new Date(Date.now() + Math.max(0, hoursTo峰 - 6) * 60 * 60 * 1000);
    const promotionEnd = new Date(peakTime.getTime() + 2 * 60 * 60 * 1000);

    const recommendedActions = this.generateRecommendedActions(trendingProbability, viralPotential);

    return {
      article_id: article.id?.toString() || '',
      trending_probability: trendingProbability,
      peak_time_prediction: peakTime.toISOString(),
      viral_potential: viralPotential,
      optimal_promotion_window: {
        start: promotionStart.toISOString(),
        end: promotionEnd.toISOString()
      },
      recommended_actions: recommendedActions
    };
  }

  private async generateQualityPrediction(article: any): Promise<QualityPrediction> {
    const currentQuality = this.assessCurrentQuality(article);
    const improvementAreas = this.identifyImprovementAreas(article);
    const improvementPotential = this.calculateImprovementPotential(currentQuality, improvementAreas);

    return {
      article_id: article.id?.toString() || '',
      quality_score: currentQuality,
      improvement_potential: improvementPotential,
      suggested_improvements: improvementAreas
    };
  }

  private analyzeEngagementFactors(article: any, allArticles: any[]): Array<{factor: string; weight: number; impact: 'positive' | 'negative' | 'neutral'}> {
    const factors = [];

    // Title analysis
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 70) {
      factors.push({ factor: 'Optimal title length', weight: 0.15, impact: 'positive' as const });
    }

    // Content length
    const contentLength = article.content?.length || 0;
    if (contentLength >= 1000) {
      factors.push({ factor: 'Comprehensive content', weight: 0.2, impact: 'positive' as const });
    }

    // Visual elements
    if (article.image_url) {
      factors.push({ factor: 'Visual content present', weight: 0.1, impact: 'positive' as const });
    }

    // Freshness
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays <= 7) {
      factors.push({ factor: 'Recent publication', weight: 0.15, impact: 'positive' as const });
    } else if (ageInDays > 30) {
      factors.push({ factor: 'Aging content', weight: -0.1, impact: 'negative' as const });
    }

    // Category performance
    const categoryPerformance = this.analyzeCategoryPerformance(article.category, allArticles);
    factors.push({ 
      factor: `${article.category} category performance`, 
      weight: categoryPerformance * 0.1, 
      impact: categoryPerformance > 0.5 ? 'positive' as const : 'negative' as const 
    });

    return factors;
  }

  private calculateTrendMultiplier(article: any, allArticles: any[]): number {
    const views = article.views || 0;
    const avgViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0) / allArticles.length;
    return avgViews > 0 ? Math.max(0.5, Math.min(2.0, views / avgViews)) : 1.0;
  }

  private calculateSeasonalMultiplier(article: any): number {
    const month = new Date().getMonth() + 1;
    const dayOfWeek = new Date().getDay();
    
    // Weekend boost for lifestyle content
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) && 
                        article.category?.toLowerCase() === 'lifestyle' ? 1.2 : 1.0;
    
    // Holiday season boost
    const holidayBoost = (month === 12 || month === 1) ? 1.1 : 1.0;
    
    return weekendBoost * holidayBoost;
  }

  private calculateEngagementVelocity(article: any): number {
    const views = article.views || 0;
    const ageInHours = Math.max(1, Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60)));
    const velocity = views / ageInHours;
    return Math.min(1.0, velocity / 10); // Normalize to 0-1
  }

  private analyzeSocialFactors(article: any): number {
    let score = 0.2; // Base score

    const title = article.title?.toLowerCase() || '';
    
    // Viral-friendly elements
    if (title.includes('how to') || title.includes('guide')) score += 0.2;
    if (title.includes('?')) score += 0.15;
    if (title.match(/\d+/)) score += 0.2; // Numbers in title
    if (article.image_url) score += 0.15;
    
    // Emotional triggers
    const emotionalWords = ['amazing', 'incredible', 'secret', 'revealed', 'shocking'];
    const emotionalCount = emotionalWords.filter(word => title.includes(word)).length;
    score += Math.min(0.2, emotionalCount * 0.05);

    return Math.min(1.0, score);
  }

  private analyzeCompetitiveContext(article: any, allArticles: any[]): number {
    // Analyze competition in same category
    const sameCategory = allArticles.filter(a => 
      a.category === article.category && 
      a.id !== article.id &&
      Math.abs(new Date(a.created_at).getTime() - new Date(article.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000)
    );

    const competitionLevel = sameCategory.length / 10; // Normalize
    return Math.max(0.2, 1.0 - competitionLevel); // Less competition = higher score
  }

  private calculateViralPotential(article: any): number {
    const socialFactors = this.analyzeSocialFactors(article);
    const engagementVelocity = this.calculateEngagementVelocity(article);
    return (socialFactors * 0.6 + engagementVelocity * 0.4);
  }

  private estimateHoursToPeak(article: any, velocity: number): number {
    // Articles with higher velocity peak sooner
    if (velocity > 0.8) return 6;
    if (velocity > 0.5) return 12;
    if (velocity > 0.2) return 24;
    return 48;
  }

  private generateRecommendedActions(trendingProbability: number, viralPotential: number): string[] {
    const actions = [];

    if (trendingProbability > 0.7) {
      actions.push('Feature in homepage hero section');
      actions.push('Push notification to subscribers');
    }

    if (viralPotential > 0.6) {
      actions.push('Optimize for social media sharing');
      actions.push('Create social media teasers');
    }

    if (trendingProbability > 0.5) {
      actions.push('Include in newsletter');
      actions.push('Cross-promote in related articles');
    }

    return actions;
  }

  private assessCurrentQuality(article: any): number {
    let score = 0.1; // Base score

    // Content length
    const contentLength = article.content?.length || 0;
    if (contentLength > 1500) score += 0.25;
    else if (contentLength > 800) score += 0.15;
    else if (contentLength > 400) score += 0.05;

    // Structure elements
    if (article.excerpt && article.excerpt.length > 100) score += 0.15;
    if (article.image_url) score += 0.15;
    if (article.category) score += 0.1;

    // Title optimization
    const titleLength = article.title?.length || 0;
    if (titleLength >= 30 && titleLength <= 70) score += 0.15;

    // Freshness
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays <= 30) score += 0.05;

    return Math.min(1.0, score);
  }

  private identifyImprovementAreas(article: any): Array<{area: string; priority: 'high' | 'medium' | 'low'; impact: number; effort: number}> {
    const improvements = [];

    // Content length
    const contentLength = article.content?.length || 0;
    if (contentLength < 800) {
      improvements.push({
        area: 'Content depth and length',
        priority: 'high' as const,
        impact: 0.8,
        effort: 0.7
      });
    }

    // Missing excerpt
    if (!article.excerpt || article.excerpt.length < 100) {
      improvements.push({
        area: 'Article excerpt/summary',
        priority: 'medium' as const,
        impact: 0.6,
        effort: 0.3
      });
    }

    // Missing image
    if (!article.image_url) {
      improvements.push({
        area: 'Visual content (featured image)',
        priority: 'medium' as const,
        impact: 0.7,
        effort: 0.4
      });
    }

    // Title optimization
    const titleLength = article.title?.length || 0;
    if (titleLength < 30 || titleLength > 70) {
      improvements.push({
        area: 'Title optimization for SEO',
        priority: 'low' as const,
        impact: 0.4,
        effort: 0.2
      });
    }

    return improvements;
  }

  private calculateImprovementPotential(currentQuality: number, improvements: any[]): number {
    const totalImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0);
    const maxImprovement = Math.min(0.4, totalImpact * 0.1); // Cap at 0.4 improvement
    return Math.min(1.0, currentQuality + maxImprovement);
  }

  private analyzeCategoryPerformance(category: string, allArticles: any[]): number {
    const categoryArticles = allArticles.filter(a => a.category === category);
    if (categoryArticles.length === 0) return 0.5;

    const avgViews = categoryArticles.reduce((sum, a) => sum + (a.views || 0), 0) / categoryArticles.length;
    const overallAvg = allArticles.reduce((sum, a) => sum + (a.views || 0), 0) / allArticles.length;
    
    return overallAvg > 0 ? Math.min(1.0, avgViews / overallAvg) : 0.5;
  }

  private async analyzeGroupConsensus(suggestions: AISuggestion[]): Promise<CrossAgentInsight[]> {
    const insights: CrossAgentInsight[] = [];

    if (suggestions.length < 2) return insights;

    // Check for consensus (similar suggestions from different agents)
    const consensusGroups = this.findConsensusSuggestions(suggestions);
    for (const group of consensusGroups) {
      insights.push({
        insight_type: 'consensus',
        agents_involved: group.map(s => s.agent_id),
        confidence: this.calculateConsensusConfidence(group),
        description: `Multiple agents agree on ${group[0].target_type} optimization`,
        recommended_action: 'Prioritize implementation due to agent consensus',
        supporting_evidence: group.map(s => s.reasoning.substring(0, 100) + '...')
      });
    }

    // Check for conflicts (contradictory suggestions)
    const conflicts = this.findConflictingSuggestions(suggestions);
    for (const conflict of conflicts) {
      insights.push({
        insight_type: 'conflict',
        agents_involved: conflict.map(s => s.agent_id),
        confidence: 0.8,
        description: `Agents disagree on approach for ${conflict[0].target_type}`,
        recommended_action: 'Requires human review to resolve conflicting recommendations',
        supporting_evidence: conflict.map(s => `${s.agent_id}: ${s.reasoning.substring(0, 80)}...`)
      });
    }

    return insights;
  }

  private async findComplementarySuggestions(suggestions: AISuggestion[]): Promise<CrossAgentInsight[]> {
    const insights: CrossAgentInsight[] = [];

    // Look for suggestions that work well together
    const complementaryPairs = this.identifyComplementaryPairs(suggestions);
    
    for (const pair of complementaryPairs) {
      insights.push({
        insight_type: 'complement',
        agents_involved: pair.map(s => s.agent_id),
        confidence: 0.75,
        description: `Suggestions complement each other for enhanced impact`,
        recommended_action: 'Implement together for synergistic effect',
        supporting_evidence: [
          `${pair[0].agent_id}: ${pair[0].target_type} optimization`,
          `${pair[1].agent_id}: ${pair[1].target_type} enhancement`
        ]
      });
    }

    return insights;
  }

  private findConsensusSuggestions(suggestions: AISuggestion[]): AISuggestion[][] {
    const groups: AISuggestion[][] = [];
    const processed = new Set<string>();

    for (const suggestion of suggestions) {
      if (processed.has(suggestion.id)) continue;

      const similar = suggestions.filter(s => 
        s.id !== suggestion.id &&
        s.target_type === suggestion.target_type &&
        s.target_id === suggestion.target_id &&
        this.calculateSimilarity(suggestion, s) > 0.7
      );

      if (similar.length > 0) {
        const group = [suggestion, ...similar];
        groups.push(group);
        group.forEach(s => processed.add(s.id));
      }
    }

    return groups;
  }

  private findConflictingSuggestions(suggestions: AISuggestion[]): AISuggestion[][] {
    const conflicts: AISuggestion[][] = [];
    
    for (let i = 0; i < suggestions.length; i++) {
      for (let j = i + 1; j < suggestions.length; j++) {
        const s1 = suggestions[i];
        const s2 = suggestions[j];
        
        if (s1.target_type === s2.target_type && 
            s1.target_id === s2.target_id &&
            this.areConflicting(s1, s2)) {
          conflicts.push([s1, s2]);
        }
      }
    }

    return conflicts;
  }

  private identifyComplementaryPairs(suggestions: AISuggestion[]): AISuggestion[][] {
    const pairs: AISuggestion[][] = [];

    // Example: Content optimization + trending promotion
    const contentSuggestions = suggestions.filter(s => s.target_type === 'article');
    const promotionSuggestions = suggestions.filter(s => s.target_type === 'hero_section');

    for (const content of contentSuggestions) {
      for (const promotion of promotionSuggestions) {
        if (content.target_id === promotion.target_id) {
          pairs.push([content, promotion]);
        }
      }
    }

    return pairs;
  }

  private calculateSimilarity(s1: AISuggestion, s2: AISuggestion): number {
    // Simple similarity based on reasoning text overlap
    const words1 = s1.reasoning.toLowerCase().split(' ');
    const words2 = s2.reasoning.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private areConflicting(s1: AISuggestion, s2: AISuggestion): boolean {
    // Check for conflicting actions in suggestion data
    const action1 = s1.suggestion_data.action;
    const action2 = s2.suggestion_data.action;
    
    const conflictingActions = [
      ['feature_trending_content', 'remove_from_featured'],
      ['increase_priority', 'decrease_priority'],
      ['promote_content', 'archive_content']
    ];

    return conflictingActions.some(([a1, a2]) => 
      (action1 === a1 && action2 === a2) || (action1 === a2 && action2 === a1)
    );
  }

  private calculateConsensusConfidence(suggestions: AISuggestion[]): number {
    const avgConfidence = suggestions.reduce((sum, s) => sum + (s.confidence_score || 0.5), 0) / suggestions.length;
    const consensusBoost = Math.min(0.3, suggestions.length * 0.1);
    return Math.min(1.0, avgConfidence + consensusBoost);
  }

  private getCachedPrediction(key: string): any {
    const cached = this.predictionCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private cachePrediction(key: string, data: any): void {
    this.predictionCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getModelInfo(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  getModelAccuracy(modelName: string): number {
    const model = this.models.get(modelName);
    return model ? model.accuracy : 0;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
