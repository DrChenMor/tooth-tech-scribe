
import { EnhancedBaseAgent, EnhancedSuggestion, EnhancedAnalysisContext } from './EnhancedBaseAgent';

export class ContentQualityAgent extends EnhancedBaseAgent {
  async enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]> {
    const { articles = [] } = context;
    if (articles.length === 0) return [];

    const prompt = this.buildPrompt(articles);
    try {
      const aiResponse = await this.performAIAnalysis(prompt);
      return this.createSuggestionsFromAI(aiResponse, context);
    } catch (error) {
      console.error(`ContentQualityAgent failed: ${error}`);
      return [];
    }
  }

  private buildPrompt(articles: any[]): string {
    const articlesData = articles.map(a => ({ id: a.id, title: a.title, content: a.content?.substring(0, 1000) }));
    const defaultPrompt = `Analyze the provided articles for content quality based on clarity, depth, and engagement potential. For each article, provide a quality score (0-100) and specific, actionable suggestions for improvement.

Return a JSON object with a key "quality_analysis", containing an array of objects. Each object must include "article_id", "quality_score" (number), "reasoning" (string), and an array of "suggestions" (strings).

Article data: {articles_data}`;
    const promptTemplate = this.config.prompt_template || defaultPrompt;
    if (promptTemplate.includes('{articles_data}')) {
        return promptTemplate.replace('{articles_data}', JSON.stringify(articlesData, null, 2));
    }
    return promptTemplate;
  }

  private createSuggestionsFromAI(aiResponse: any, context: EnhancedAnalysisContext): EnhancedSuggestion[] {
    const suggestions: EnhancedSuggestion[] = [];
    if (!aiResponse || !aiResponse.quality_analysis) return [];

    aiResponse.quality_analysis.forEach((analysis: any) => {
        if (analysis.quality_score < 70 && analysis.suggestions?.length > 0) {
            const baseSuggestion = {
                target_type: 'article_improvement',
                target_id: analysis.article_id,
                suggestion_data: {
                    suggestions: analysis.suggestions,
                    quality_score: analysis.quality_score,
                },
                reasoning: analysis.reasoning || `Article has a quality score of ${analysis.quality_score}, which is below the threshold of 70.`,
                confidence_score: (100 - analysis.quality_score) / 100,
                priority: 3,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            };
            suggestions.push({
                ...baseSuggestion,
                reasoning_steps: [{ step: 'AI Quality Analysis', evidence: [baseSuggestion.reasoning], confidence: baseSuggestion.confidence_score, weight: 1 }],
                alternative_approaches: ['Rewrite the article from scratch', 'Get a human editor to review'],
                potential_risks: ['Suggestions might not align with brand voice'],
                implementation_complexity: 'medium',
                expected_impact: 'high',
                related_suggestions: [],
            });
        }
    });

    return suggestions;
  }
}
