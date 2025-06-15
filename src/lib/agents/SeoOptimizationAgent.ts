
import { EnhancedBaseAgent, EnhancedSuggestion, EnhancedAnalysisContext } from './EnhancedBaseAgent';

export class SeoOptimizationAgent extends EnhancedBaseAgent {
  async enhancedAnalyze(context: EnhancedAnalysisContext): Promise<EnhancedSuggestion[]> {
    const { articles = [] } = context;
    if (articles.length === 0) return [];
    
    const prompt = this.buildPrompt(articles);
    try {
      const aiResponse = await this.performAIAnalysis(prompt);
      return this.createSuggestionsFromAI(aiResponse, context);
    } catch (error) {
      console.error(`SeoOptimizationAgent failed: ${error}`);
      return [];
    }
  }

  private buildPrompt(articles: any[]): string {
    const articlesData = articles.map(a => ({ id: a.id, title: a.title, content: a.content?.substring(0, 1000) }));
    const defaultPrompt = `Analyze the provided articles for SEO optimization. For each article, suggest a list of relevant keywords, a meta description, and other on-page SEO improvements.

Return a JSON object with a key "seo_analysis", containing an array of objects. Each object must include "article_id", "suggested_keywords" (array of strings), "suggested_meta_description" (string), and "on_page_improvements" (array of strings).

Article data: {articles_data}`;
    const promptTemplate = this.config.prompt_template || defaultPrompt;
    if (promptTemplate.includes('{articles_data}')) {
      return promptTemplate.replace('{articles_data}', JSON.stringify(articlesData, null, 2));
    }
    return promptTemplate;
  }
  
  private createSuggestionsFromAI(aiResponse: any, context: EnhancedAnalysisContext): EnhancedSuggestion[] {
    const suggestions: EnhancedSuggestion[] = [];
    if (!aiResponse || !aiResponse.seo_analysis) return [];

    aiResponse.seo_analysis.forEach((analysis: any) => {
        const baseSuggestion = {
            target_type: 'seo_improvement',
            target_id: analysis.article_id,
            suggestion_data: {
                keywords: analysis.suggested_keywords,
                meta_description: analysis.suggested_meta_description,
                improvements: analysis.on_page_improvements,
            },
            reasoning: `Provides SEO enhancements including keywords and meta description.`,
            confidence_score: 0.85,
            priority: 2,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
        suggestions.push({
            ...baseSuggestion,
            reasoning_steps: [{ step: 'AI SEO Analysis', evidence: ['Keyword analysis', 'Meta description generation'], confidence: 0.85, weight: 1 }],
            alternative_approaches: ['Use a dedicated SEO tool for deeper analysis'],
            potential_risks: ['Keyword stuffing could harm rankings'],
            implementation_complexity: 'low',
            expected_impact: 'medium',
            related_suggestions: [],
        });
    });

    return suggestions;
  }
}
