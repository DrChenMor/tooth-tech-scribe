
import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class ContentGapAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    const freshnessThreshold = this.config.freshness_days || 30;
    const qualityThreshold = this.config.quality_threshold || 0.7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - freshnessThreshold);

    // Find old articles that might need updates
    const oldArticles = articles.filter(article => 
      new Date(article.created_at) < cutoffDate && 
      article.status === 'published'
    );

    for (const article of oldArticles.slice(0, 3)) {
      const qualityScore = this.assessContentQuality(article);
      
      if (qualityScore < qualityThreshold) {
        suggestions.push({
          target_type: 'article',
          target_id: article.id.toString(),
          suggestion_data: {
            issue_type: 'content_freshness',
            quality_score: qualityScore,
            age_days: Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            suggested_actions: this.getSuggestedActions(qualityScore),
            article_title: article.title
          },
          reasoning: `Article "${article.title}" is ${Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24))} days old with a quality score of ${Math.round(qualityScore * 100)}%. Consider updating for freshness and relevance.`,
          confidence_score: this.generateConfidenceScore([
            1 - qualityScore, // Lower quality = higher confidence in need for update
            Math.min(1, (Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24 * 90)) // Age factor
          ]),
          priority: this.calculatePriority(0.4, 0.6),
        });
      }
    }

    return suggestions;
  }

  private assessContentQuality(article: any): number {
    let score = 0.5; // Base score
    
    // Length factor
    const contentLength = article.content?.length || 0;
    if (contentLength > 1000) score += 0.2;
    else if (contentLength > 500) score += 0.1;
    
    // Has excerpt
    if (article.excerpt && article.excerpt.length > 50) score += 0.1;
    
    // Has image
    if (article.image_url) score += 0.1;
    
    // Has category
    if (article.category) score += 0.1;
    
    return Math.min(1, score);
  }

  private getSuggestedActions(qualityScore: number): string[] {
    const actions = [];
    
    if (qualityScore < 0.6) {
      actions.push('Review and update content for accuracy');
      actions.push('Add recent developments or data');
    }
    if (qualityScore < 0.7) {
      actions.push('Improve article structure and readability');
    }
    actions.push('Verify all links and references');
    actions.push('Update publication date if significantly revised');
    
    return actions;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `This content may contain outdated information and could benefit from a review to maintain relevance and accuracy.`;
  }
}
