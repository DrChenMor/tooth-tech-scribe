
import { supabase } from '@/integrations/supabase/client';

export interface RealAnalyticsData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  avgViewsPerArticle: number;
  topPerformingArticles: Array<{
    id: number;
    title: string;
    views: number;
    category: string | null;
    published_date: string;
  }>;
  categoryPerformance: Array<{
    category: string;
    articleCount: number;
    totalViews: number;
    avgViews: number;
  }>;
  recentActivity: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
    views: number;
  }>;
}

export class RealAnalyticsService {
  static async getComprehensiveAnalytics(): Promise<RealAnalyticsData> {
    try {
      // Get all articles with their stats
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;

      const allArticles = articles || [];
      const publishedArticles = allArticles.filter(a => a.status === 'published');
      const draftArticles = allArticles.filter(a => a.status === 'draft');
      const totalViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
      const avgViewsPerArticle = publishedArticles.length > 0 ? totalViews / publishedArticles.length : 0;

      // Get top performing articles
      const topPerformingArticles = publishedArticles
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(article => ({
          id: article.id,
          title: article.title,
          views: article.views || 0,
          category: article.category,
          published_date: article.published_date
        }));

      // Calculate category performance
      const categoryStats = new Map<string, { count: number; views: number }>();
      
      publishedArticles.forEach(article => {
        const category = article.category || 'Uncategorized';
        const current = categoryStats.get(category) || { count: 0, views: 0 };
        categoryStats.set(category, {
          count: current.count + 1,
          views: current.views + (article.views || 0)
        });
      });

      const categoryPerformance = Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        articleCount: stats.count,
        totalViews: stats.views,
        avgViews: stats.count > 0 ? Math.round(stats.views / stats.count) : 0
      }));

      // Get recent activity (last 10 articles)
      const recentActivity = allArticles.slice(0, 10).map(article => ({
        id: article.id,
        title: article.title,
        status: article.status,
        created_at: article.created_at,
        views: article.views || 0
      }));

      return {
        totalArticles: allArticles.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        totalViews,
        avgViewsPerArticle: Math.round(avgViewsPerArticle),
        topPerformingArticles,
        categoryPerformance,
        recentActivity
      };

    } catch (error) {
      console.error('Failed to get real analytics:', error);
      // Return empty data structure on error
      return {
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        totalViews: 0,
        avgViewsPerArticle: 0,
        topPerformingArticles: [],
        categoryPerformance: [],
        recentActivity: []
      };
    }
  }

  static async getEngagementPredictions(): Promise<Array<{
    articleId: number;
    title: string;
    predictedViews: number;
    confidence: number;
    factors: string[];
  }>> {
    try {
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!articles) return [];

      // Simple engagement prediction based on historical data
      return articles.map(article => {
        const factors = [];
        let predictedViews = 100; // Base prediction
        let confidence = 0.5;

        // Factor in current views trend
        if (article.views > 500) {
          factors.push('High current engagement');
          predictedViews += 200;
          confidence += 0.2;
        }

        // Factor in recency
        const daysSincePublished = Math.floor(
          (Date.now() - new Date(article.published_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSincePublished < 7) {
          factors.push('Recently published');
          predictedViews += 150;
          confidence += 0.1;
        }

        // Factor in title length (optimal 60-70 chars)
        if (article.title.length >= 60 && article.title.length <= 70) {
          factors.push('Optimal title length');
          predictedViews += 50;
          confidence += 0.1;
        }

        // Factor in content length
        if (article.content && article.content.length > 1000) {
          factors.push('Comprehensive content');
          predictedViews += 100;
          confidence += 0.1;
        }

        return {
          articleId: article.id,
          title: article.title,
          predictedViews: Math.round(predictedViews),
          confidence: Math.min(confidence, 0.9),
          factors
        };
      });

    } catch (error) {
      console.error('Failed to get engagement predictions:', error);
      return [];
    }
  }
}
