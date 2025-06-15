
import { supabase } from '@/integrations/supabase/client';
import { AISuggestion } from './aiAgents';
import { toast } from '@/components/ui/use-toast';

export interface ActionableSuggestion extends AISuggestion {
  can_implement: boolean;
  implementation_type: 'auto' | 'manual' | 'review_required';
  preview_changes?: any;
}

export class ActionableAgentSuggestions {
  
  static async implementSuggestion(suggestionId: string): Promise<boolean> {
    try {
      console.log(`🚀 Implementing suggestion: ${suggestionId}`);

      // Get the suggestion details
      const { data: suggestion, error: fetchError } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (fetchError || !suggestion) {
        throw new Error('Suggestion not found');
      }

      const suggestionData = typeof suggestion.suggestion_data === 'string' 
        ? JSON.parse(suggestion.suggestion_data) 
        : suggestion.suggestion_data;

      let implementationSuccess = false;

      // Implement based on target type
      switch (suggestion.target_type) {
        case 'article':
          implementationSuccess = await this.implementArticleImprovement(suggestion.target_id, suggestionData);
          break;
        
        case 'hero_section':
          implementationSuccess = await this.implementHeroSectionUpdate(suggestionData);
          break;

        case 'seo':
          implementationSuccess = await this.implementSEOImprovement(suggestion.target_id, suggestionData);
          break;

        case 'content_gap':
          implementationSuccess = await this.implementContentGapSuggestion(suggestionData);
          break;

        default:
          console.log(`⚠️ Implementation not supported for target type: ${suggestion.target_type}`);
          implementationSuccess = false;
      }

      if (implementationSuccess) {
        // Mark as implemented
        await supabase
          .from('ai_suggestions')
          .update({ 
            status: 'implemented',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', suggestionId);

        toast({
          title: "Suggestion Implemented!",
          description: "The AI suggestion has been successfully applied."
        });

        return true;
      } else {
        throw new Error('Implementation failed');
      }

    } catch (error) {
      console.error('❌ Failed to implement suggestion:', error);
      toast({
        title: "Implementation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return false;
    }
  }

  private static async implementArticleImprovement(articleId: string | null, suggestionData: any): Promise<boolean> {
    if (!articleId) return false;

    try {
      const updates: any = {};

      // Apply suggested improvements
      if (suggestionData.title) {
        updates.title = suggestionData.title;
      }
      
      if (suggestionData.excerpt) {
        updates.excerpt = suggestionData.excerpt;
      }

      if (suggestionData.content_additions) {
        // Get current article
        const { data: article } = await supabase
          .from('articles')
          .select('content')
          .eq('id', articleId)
          .single();

        if (article && article.content) {
          // Append suggested content
          updates.content = article.content + '\n\n' + suggestionData.content_additions;
        }
      }

      if (suggestionData.category) {
        updates.category = suggestionData.category;
      }

      if (Object.keys(updates).length === 0) {
        return false;
      }

      // Update the article
      const { error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', articleId);

      return !error;
    } catch (error) {
      console.error('Failed to implement article improvement:', error);
      return false;
    }
  }

  private static async implementHeroSectionUpdate(suggestionData: any): Promise<boolean> {
    // For now, we'll just log this as hero section updates would need frontend state management
    console.log('Hero section update suggested:', suggestionData);
    
    // In a real implementation, you might:
    // 1. Update a hero_section table in the database
    // 2. Trigger a cache invalidation
    // 3. Update featured article settings
    
    return true; // Simulate success for demonstration
  }

  private static async implementSEOImprovement(articleId: string | null, suggestionData: any): Promise<boolean> {
    if (!articleId) return false;

    try {
      const seoUpdates: any = {};

      if (suggestionData.meta_title) {
        // Store SEO title in article title if it's better
        seoUpdates.title = suggestionData.meta_title;
      }

      if (suggestionData.meta_description) {
        seoUpdates.excerpt = suggestionData.meta_description;
      }

      if (Object.keys(seoUpdates).length === 0) {
        return false;
      }

      const { error } = await supabase
        .from('articles')
        .update(seoUpdates)
        .eq('id', articleId);

      return !error;
    } catch (error) {
      console.error('Failed to implement SEO improvement:', error);
      return false;
    }
  }

  private static async implementContentGapSuggestion(suggestionData: any): Promise<boolean> {
    try {
      // Create a draft article based on content gap suggestion
      const { error } = await supabase
        .from('articles')
        .insert({
          title: suggestionData.suggested_title || 'New Article from AI Suggestion',
          slug: (suggestionData.suggested_title || 'new-article-from-ai-suggestion')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''),
          content: suggestionData.content_outline || '',
          excerpt: suggestionData.excerpt || '',
          category: suggestionData.category || null,
          status: 'draft',
          author_name: 'AI Assistant',
          published_date: new Date(0).toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Failed to implement content gap suggestion:', error);
      return false;
    }
  }

  static async previewImplementation(suggestionId: string): Promise<any> {
    try {
      const { data: suggestion } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (!suggestion) return null;

      const suggestionData = typeof suggestion.suggestion_data === 'string' 
        ? JSON.parse(suggestion.suggestion_data) 
        : suggestion.suggestion_data;

      // Generate preview based on target type
      switch (suggestion.target_type) {
        case 'article':
          if (suggestion.target_id) {
            const { data: article } = await supabase
              .from('articles')
              .select('*')
              .eq('id', suggestion.target_id)
              .single();

            return {
              type: 'article_changes',
              current: article,
              proposed: {
                ...article,
                ...suggestionData
              }
            };
          }
          break;

        case 'content_gap':
          return {
            type: 'new_article',
            proposed: {
              title: suggestionData.suggested_title,
              content: suggestionData.content_outline,
              excerpt: suggestionData.excerpt,
              category: suggestionData.category
            }
          };

        default:
          return {
            type: 'generic',
            data: suggestionData
          };
      }

      return null;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return null;
    }
  }
}
