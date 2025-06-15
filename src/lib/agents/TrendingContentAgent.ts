
import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class TrendingContentAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    // Sort articles by views and engagement
    const sortedArticles = articles
      .filter(article => article.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const minViews = this.config.min_views_threshold || 100;
    const trendingArticles = sortedArticles.filter(article => 
      (article.views || 0) >= minViews
    );

    if (trendingArticles.length > 0) {
      const topArticle = trendingArticles[0];
      
      suggestions.push({
        target_type: 'hero_section',
        target_id: 'main',
        suggestion_data: {
          article_id: topArticle.id,
          article_title: topArticle.title,
          article_slug: topArticle.slug,
          views: topArticle.views,
          suggested_position: 'hero'
        },
        reasoning: `Article "${topArticle.title}" has ${topArticle.views} views, making it ${Math.round((topArticle.views / (sortedArticles[1]?.views || 1)) * 100)}% more popular than the next most viewed article.`,
        confidence_score: this.generateConfidenceScore([
          Math.min(1, topArticle.views / 1000), // View factor
          trendingArticles.length > 1 ? 0.8 : 0.6 // Multiple trending factor
        ]),
        priority: this.calculatePriority(0.8, 0.9), // High urgency, high impact
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    return suggestions;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `Based on article engagement metrics, this content shows strong user interest and would perform well in the featured position.`;
  }
}
