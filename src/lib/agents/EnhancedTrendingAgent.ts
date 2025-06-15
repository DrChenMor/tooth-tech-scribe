import { AgentSuggestion } from './BaseAgent';
import { EnhancedBaseAgent, EnhancedSuggestion, EnhancedAnalysisContext } from './EnhancedBaseAgent';

export class EnhancedTrendingAgent extends EnhancedBaseAgent {
  // Implement the abstract method from EnhancedBaseAgent
  async enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]> {
    const { articles = [] } = context;

    if (articles.length === 0) {
      return [];
    }

    const publishedArticles = articles.filter(article => article.status === 'published');
    const prompt = this.buildPrompt(publishedArticles);

    try {
      const aiResponse = await this.performAIAnalysis(prompt);
      const suggestions = this.createSuggestionsFromAI(aiResponse, publishedArticles, context);
      return suggestions;
    } catch (error) {
      console.error(`EnhancedTrendingAgent failed: ${error}`);
      return [];
    }
  }

  private buildPrompt(articles: any[]): string {
    const articlesData = articles.map(a => ({
        id: a.id,
        title: a.title,
        views: a.views || 0,
        created_at: a.created_at,
        metrics: this.generateComprehensiveMetrics(a, articles),
    }));

    const defaultPrompt = `As an expert data scientist, perform an advanced trend analysis on the provided articles. Consider metrics like engagement, freshness, quality, and trending scores. Identify up to 3 articles with the highest potential to go viral or become top performers. Also, provide one high-level "future_prediction" about content trends based on the data.

Return a JSON object with two keys:
1. "trending_articles": An array of objects, each with "article_id", "reasoning" (explain why it's trending), "confidence_score" (0-1), and "suggested_action" (e.g., "Feature in hero section", "Promote on social media").
2. "future_predictions": An array with a single object containing "prediction_text" and "confidence_score".

If no articles are trending and no predictions can be made, return empty arrays for both keys.

Article data: {articles_data}`;
    
    const promptTemplate = this.config.prompt_template || defaultPrompt;
    
    if (promptTemplate.includes('{articles_data}')) {
      return promptTemplate.replace('{articles_data}', JSON.stringify(articlesData, null, 2));
    }
    
    return promptTemplate;
  }

  private createSuggestionsFromAI(aiResponse: any, allArticles: any[], context: EnhancedAnalysisContext): EnhancedSuggestion[] {
    const suggestions: EnhancedSuggestion[] = [];

    if (!aiResponse) return [];

    const trendingFromAI = aiResponse.trending_articles || [];
    const predictionsFromAI = aiResponse.future_predictions || [];

    // Suggestions for trending articles
    trendingFromAI.forEach((info: any, index: number) => {
      const article = allArticles.find(a => a.id === info.article_id);
      if (article) {
        const baseSuggestion: AgentSuggestion = {
          target_type: info.suggested_action?.toLowerCase().includes('hero') ? 'hero_section' : 'featured_section',
          target_id: info.suggested_action?.toLowerCase().includes('hero') ? 'main' : `featured-${index + 1}`,
          suggestion_data: {
            article_id: article.id,
            article_title: article.title,
            article_slug: article.slug,
            action: info.suggested_action || 'Promote content',
          },
          reasoning: info.reasoning,
          confidence_score: info.confidence_score,
          priority: this.calculatePriority(info.confidence_score, 0.95, info.confidence_score),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000)
        };

        suggestions.push({
          ...baseSuggestion,
          reasoning_steps: [{ step: 'AI Analysis', evidence: [info.reasoning], confidence: info.confidence_score, weight: 1 }],
          alternative_approaches: this.generateAlternativeApproaches(baseSuggestion),
          potential_risks: this.identifyPotentialRisks(baseSuggestion, context),
          implementation_complexity: 'medium',
          expected_impact: info.confidence_score > 0.8 ? 'high' : 'medium',
          related_suggestions: [],
        });
      }
    });

    // Suggestion for future predictions
    if (predictionsFromAI.length > 0) {
      const prediction = predictionsFromAI[0];
      const baseSuggestion: AgentSuggestion = {
        target_type: 'strategic_insight',
        target_id: 'content_strategy',
        suggestion_data: {
          prediction: prediction.prediction_text,
          confidence: prediction.confidence_score,
        },
        reasoning: `Based on analysis of current content performance, the AI predicts the following trend: "${prediction.prediction_text}"`,
        confidence_score: prediction.confidence_score,
        priority: 1, // Highest priority strategic insight
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      
      suggestions.push({
        ...baseSuggestion,
        reasoning_steps: [{ step: 'AI Trend Prediction', evidence: [baseSuggestion.reasoning], confidence: prediction.confidence_score, weight: 1 }],
        alternative_approaches: ['Develop a content series on this topic', 'Monitor competitors for related content'],
        potential_risks: ['Trend may be short-lived', 'Market may be saturated by the time content is produced'],
        implementation_complexity: 'high',
        expected_impact: 'high',
        related_suggestions: [],
      });
    }

    return suggestions;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    const model = this.config.ai_model || 'default AI';
    if (suggestion.target_type === 'strategic_insight') {
       return `This strategic insight was generated by the Enhanced Trending Agent (${model}). AI Reasoning: "${suggestion.reasoning}"`;
    }
    return `This suggestion was generated by the Enhanced Trending Agent (${model}) based on advanced content analysis. AI Reasoning: "${suggestion.reasoning}"`;
  }
}
