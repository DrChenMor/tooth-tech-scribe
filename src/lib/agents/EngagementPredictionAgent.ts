
import { EnhancedBaseAgent, EnhancedSuggestion, EnhancedAnalysisContext } from './EnhancedBaseAgent';

export class EngagementPredictionAgent extends EnhancedBaseAgent {
  async enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]> {
    const { articles = [] } = context;
    if (articles.length === 0) return [];
    
    const prompt = this.buildPrompt(articles);
    try {
      const aiResponse = await this.performAIAnalysis(prompt);
      return this.createSuggestionsFromAI(aiResponse, context);
    } catch (error) {
      console.error(`EngagementPredictionAgent failed: ${error}`);
      return [];
    }
  }

  private buildPrompt(articles: any[]): string {
    const articlesData = articles.map(a => ({ id: a.id, title: a.title, content: a.content?.substring(0, 1000) }));
    const defaultPrompt = `Predict the social media and reader engagement for the provided articles. For each article, provide a predicted engagement score (low, medium, high) and suggest a social media post to maximize reach.

Return a JSON object with a key "engagement_prediction", containing an array of objects. Each object must include "article_id", "predicted_engagement" (string: 'low', 'medium', or 'high'), "reasoning" (string), and "suggested_social_post" (string).

Article data: {articles_data}`;
    const promptTemplate = this.config.prompt_template || defaultPrompt;
    if (promptTemplate.includes('{articles_data}')) {
      return promptTemplate.replace('{articles_data}', JSON.stringify(articlesData, null, 2));
    }
    return promptTemplate;
  }
  
  private createSuggestionsFromAI(aiResponse: any, context: EnhancedAnalysisContext): EnhancedSuggestion[] {
    const suggestions: EnhancedSuggestion[] = [];
    if (!aiResponse || !aiResponse.engagement_prediction) return [];

    aiResponse.engagement_prediction.forEach((prediction: any) => {
        if (prediction.predicted_engagement === 'high') {
            const baseSuggestion = {
                target_type: 'social_media_post',
                target_id: prediction.article_id,
                suggestion_data: {
                    post_content: prediction.suggested_social_post,
                    platform: 'twitter', // default
                },
                reasoning: prediction.reasoning || `Article has high predicted engagement.`,
                confidence_score: 0.9,
                priority: 1,
                expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            };
            suggestions.push({
                ...baseSuggestion,
                reasoning_steps: [{ step: 'AI Engagement Prediction', evidence: [baseSuggestion.reasoning], confidence: 0.9, weight: 1 }],
                alternative_approaches: ['Post on LinkedIn instead', 'Create a short video for TikTok/Shorts'],
                potential_risks: ['Engagement might not translate to conversions'],
                implementation_complexity: 'low',
                expected_impact: 'high',
                related_suggestions: [],
            });
        }
    });

    return suggestions;
  }
}
