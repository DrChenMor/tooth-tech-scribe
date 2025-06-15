
import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class SummarizationAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    // Find articles without excerpts or with short excerpts
    const articlesNeedingSummary = articles.filter(article => 
      !article.excerpt || article.excerpt.length < 50
    ).slice(0, 5); // Limit to 5 at a time

    for (const article of articlesNeedingSummary) {
      if (article.content && article.content.length > 200) {
        const suggestedSummary = this.generateSummary(article.content);
        const suggestedTags = this.generateTags(article.title, article.content);

        suggestions.push({
          target_type: 'article',
          target_id: article.id.toString(),
          suggestion_data: {
            excerpt: suggestedSummary,
            suggested_tags: suggestedTags,
            current_excerpt: article.excerpt || '',
            article_title: article.title
          },
          reasoning: `Article "${article.title}" ${!article.excerpt ? 'lacks an excerpt' : 'has a very short excerpt'}. A comprehensive summary would improve SEO and user engagement.`,
          confidence_score: this.generateConfidenceScore([
            article.content.length > 500 ? 0.8 : 0.6, // Content length factor
            !article.excerpt ? 0.9 : 0.7 // Missing excerpt factor
          ]),
          priority: this.calculatePriority(0.6, 0.7),
        });
      }
    }

    return suggestions;
  }

  private generateSummary(content: string): string {
    // Simple extractive summarization - take first meaningful sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const maxLength = this.config.max_summary_length || 200;
    
    let summary = '';
    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) break;
      summary += sentence.trim() + '. ';
    }
    
    return summary.trim();
  }

  private generateTags(title: string, content: string): string[] {
    // Simple keyword extraction
    const text = (title + ' ' + content).toLowerCase();
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    const words = text.match(/\b\w{4,}\b/g) || [];
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      if (!commonWords.includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `This article would benefit from a structured summary and relevant tags to improve discoverability and user engagement.`;
  }
}
