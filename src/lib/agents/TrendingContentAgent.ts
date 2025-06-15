
import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class TrendingContentAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    const publishedArticles = articles.filter(article => article.status === 'published');
    
    // Calculate comprehensive metrics for all articles
    const articlesWithMetrics = publishedArticles.map(article => ({
      ...article,
      metrics: this.generateComprehensiveMetrics(article, publishedArticles)
    }));

    // Advanced trending algorithm
    const trendingArticles = this.identifyTrendingContent(articlesWithMetrics);
    
    const minViews = this.config.min_views_threshold || 50;
    const validTrendingArticles = trendingArticles.filter(article => 
      (article.views || 0) >= minViews
    );

    if (validTrendingArticles.length > 0) {
      // Feature top trending article
      const topArticle = validTrendingArticles[0];
      const confidenceFactors = [
        topArticle.metrics.trending_score,
        topArticle.metrics.engagement_score,
        topArticle.metrics.quality_score,
        validTrendingArticles.length > 2 ? 0.9 : 0.7 // Multiple trending factor
      ];

      suggestions.push({
        target_type: 'hero_section',
        target_id: 'main',
        suggestion_data: {
          article_id: topArticle.id,
          article_title: topArticle.title,
          article_slug: topArticle.slug,
          views: topArticle.views,
          suggested_position: 'hero',
          metrics: topArticle.metrics,
          trending_reasons: this.generateTrendingReasons(topArticle, validTrendingArticles)
        },
        reasoning: this.generateEnhancedReasoning(topArticle, validTrendingArticles),
        confidence_score: this.generateConfidenceScore(confidenceFactors),
        priority: this.calculatePriority(
          topArticle.metrics.trending_score, 
          0.9, // High impact for hero section
          this.generateConfidenceScore(confidenceFactors)
        ),
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours for trending
      });

      // Suggest secondary trending articles for featured sections
      if (validTrendingArticles.length > 1) {
        const secondaryArticles = validTrendingArticles.slice(1, 3);
        
        for (let i = 0; i < secondaryArticles.length; i++) {
          const article = secondaryArticles[i];
          const confidenceFactors = [
            article.metrics.trending_score * 0.8, // Slightly lower for secondary
            article.metrics.engagement_score,
            article.metrics.quality_score
          ];

          suggestions.push({
            target_type: 'featured_section',
            target_id: `featured-${i + 1}`,
            suggestion_data: {
              article_id: article.id,
              article_title: article.title,
              article_slug: article.slug,
              views: article.views,
              suggested_position: `featured-${i + 1}`,
              metrics: article.metrics
            },
            reasoning: `Secondary trending article with ${article.views} views and strong engagement metrics.`,
            confidence_score: this.generateConfidenceScore(confidenceFactors),
            priority: this.calculatePriority(0.6, 0.7, this.generateConfidenceScore(confidenceFactors)),
            expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18 hours
          });
        }
      }
    }

    return suggestions;
  }

  private identifyTrendingContent(articlesWithMetrics: any[]): any[] {
    // Multi-factor trending algorithm
    return articlesWithMetrics
      .map(article => ({
        ...article,
        composite_score: this.calculateCompositeScore(article.metrics)
      }))
      .sort((a, b) => b.composite_score - a.composite_score)
      .slice(0, 5);
  }

  private calculateCompositeScore(metrics: any): number {
    // Weighted composite score for trending detection
    const weights = {
      trending: 0.4,
      engagement: 0.3,
      freshness: 0.2,
      quality: 0.1
    };

    return (
      metrics.trending_score * weights.trending +
      metrics.engagement_score * weights.engagement +
      metrics.freshness_score * weights.freshness +
      metrics.quality_score * weights.quality
    );
  }

  private generateTrendingReasons(article: any, allTrending: any[]): string[] {
    const reasons = [];
    
    if (article.metrics.engagement_score > 0.7) {
      reasons.push('High engagement rate');
    }
    
    if (article.metrics.trending_score > 0.8) {
      reasons.push('Significantly above average views');
    }
    
    if (article.metrics.freshness_score > 0.8) {
      reasons.push('Recently published content');
    }
    
    if (allTrending.length > 2) {
      reasons.push('Part of trending content cluster');
    }

    return reasons;
  }

  private generateEnhancedReasoning(topArticle: any, allTrending: any[]): string {
    const viewDifference = allTrending.length > 1 
      ? Math.round(((topArticle.views || 0) / (allTrending[1].views || 1)) * 100) 
      : 100;
    
    const reasons = this.generateTrendingReasons(topArticle, allTrending);
    
    return `Article "${topArticle.title}" identified as trending with ${topArticle.views} views (${viewDifference}% of next article). Key factors: ${reasons.join(', ')}. Composite trending score: ${Math.round(topArticle.composite_score * 100)}%.`;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `Advanced trending analysis identified this content based on engagement velocity, view patterns, and content quality metrics. The algorithm considers multiple factors including recency bias and competitive positioning.`;
  }
}
