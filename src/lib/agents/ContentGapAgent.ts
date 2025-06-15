import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class ContentGapAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    const publishedArticles = articles.filter(article => article.status === 'published');
    
    // Enhanced content gap analysis
    const contentAnalysis = this.performComprehensiveContentAnalysis(publishedArticles);
    
    // Analyze articles needing updates
    const articlesNeedingAttention = this.identifyContentGaps(publishedArticles, contentAnalysis);
    
    for (const analysis of articlesNeedingAttention.slice(0, 4)) {
      const { article, gaps, metrics } = analysis;
      
      // Calculate overall score from existing metrics
      const overallScore = this.calculateOverallScore(metrics);
      
      const confidenceFactors = [
        1 - overallScore, // Lower score = higher confidence in need for update
        gaps.urgency_score,
        gaps.impact_score,
        this.calculateCompetitiveNeed(article, publishedArticles)
      ];

      suggestions.push({
        target_type: 'article',
        target_id: article.id.toString(),
        suggestion_data: {
          issue_type: 'content_optimization',
          gaps_identified: gaps.identified_gaps,
          current_metrics: metrics,
          improvement_plan: gaps.improvement_plan,
          competitive_analysis: gaps.competitive_insights,
          estimated_impact: gaps.estimated_impact,
          article_title: article.title,
          priority_actions: gaps.priority_actions
        },
        reasoning: this.generateComprehensiveReasoning(article, gaps, metrics),
        confidence_score: this.generateConfidenceScore(confidenceFactors),
        priority: this.calculatePriority(
          gaps.urgency_score,
          gaps.impact_score,
          this.generateConfidenceScore(confidenceFactors)
        ),
      });
    }

    // Identify content strategy gaps
    const strategyGaps = this.identifyStrategicGaps(contentAnalysis);
    if (strategyGaps.length > 0) {
      suggestions.push(...strategyGaps);
    }

    return suggestions;
  }

  private calculateOverallScore(metrics: any): number {
    // Calculate weighted average of all metrics
    const weights = {
      engagement: 0.25,
      freshness: 0.20,
      quality: 0.25,
      trending: 0.15,
      seo: 0.15
    };

    return (
      metrics.engagement_score * weights.engagement +
      metrics.freshness_score * weights.freshness +
      metrics.quality_score * weights.quality +
      metrics.trending_score * weights.trending +
      metrics.seo_score * weights.seo
    );
  }

  private performComprehensiveContentAnalysis(articles: any[]) {
    return {
      total_articles: articles.length,
      content_distribution: this.analyzeContentDistribution(articles),
      quality_metrics: this.calculatePortfolioQuality(articles),
      freshness_analysis: this.analyzeFreshness(articles),
      engagement_patterns: this.analyzeEngagementPatterns(articles),
      coverage_gaps: this.identifyCoverageGaps(articles)
    };
  }

  private identifyContentGaps(articles: any[], analysis: any) {
    return articles
      .map(article => {
        const metrics = this.generateComprehensiveMetrics(article, articles);
        const gaps = this.assessArticleGaps(article, metrics, analysis);
        
        return { article, gaps, metrics };
      })
      .filter(item => item.gaps.total_gap_score > 0.3)
      .sort((a, b) => b.gaps.total_gap_score - a.gaps.total_gap_score);
  }

  private assessArticleGaps(article: any, metrics: any, portfolioAnalysis: any) {
    const gaps = {
      identified_gaps: [] as string[],
      urgency_score: 0,
      impact_score: 0,
      total_gap_score: 0,
      improvement_plan: [] as string[],
      competitive_insights: [] as string[],
      estimated_impact: '',
      priority_actions: [] as string[]
    };

    //freshness gaps
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays > 180) {
      gaps.identified_gaps.push('Content freshness (6+ months old)');
      gaps.urgency_score += 0.3;
      gaps.impact_score += 0.2;
      gaps.improvement_plan.push('Update with recent information and data');
      gaps.priority_actions.push('Content refresh');
    }

    // Quality gaps
    if (metrics.quality_score < 0.6) {
      gaps.identified_gaps.push('Content quality below threshold');
      gaps.urgency_score += 0.2;
      gaps.impact_score += 0.4;
      gaps.improvement_plan.push('Enhance content structure and depth');
      gaps.priority_actions.push('Quality improvement');
    }

    // SEO gaps
    if (metrics.seo_score < 0.5) {
      gaps.identified_gaps.push('SEO optimization opportunities');
      gaps.urgency_score += 0.2;
      gaps.impact_score += 0.3;
      gaps.improvement_plan.push('Optimize meta descriptions, headers, and keywords');
      gaps.priority_actions.push('SEO enhancement');
    }

    // Engagement gaps
    if (metrics.engagement_score < 0.3) {
      gaps.identified_gaps.push('Low engagement metrics');
      gaps.urgency_score += 0.1;
      gaps.impact_score += 0.3;
      gaps.improvement_plan.push('Add interactive elements and improve readability');
      gaps.priority_actions.push('Engagement boost');
    }

    // Competitive analysis
    const avgQuality = portfolioAnalysis.quality_metrics.average_score;
    if (metrics.quality_score < avgQuality * 0.8) {
      gaps.competitive_insights.push('Below portfolio average quality');
      gaps.impact_score += 0.1;
    }

    // Calculate total gap score
    gaps.total_gap_score = (gaps.urgency_score + gaps.impact_score) / 2;

    // Estimated impact
    if (gaps.total_gap_score > 0.7) {
      gaps.estimated_impact = 'High - Significant improvement potential';
    } else if (gaps.total_gap_score > 0.5) {
      gaps.estimated_impact = 'Medium - Moderate improvement expected';
    } else {
      gaps.estimated_impact = 'Low - Minor improvements';
    }

    return gaps;
  }

  private analyzeContentDistribution(articles: any[]) {
    const categories = articles.reduce((acc, article) => {
      const category = article.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const totalArticles = articles.length;
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count: count as number,
      percentage: Math.round(((count as number) / totalArticles) * 100)
    }));
  }

  private calculatePortfolioQuality(articles: any[]) {
    const qualityScores = articles.map(article => this.calculateQualityScore(article));
    const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    return {
      average_score: averageScore,
      high_quality_count: qualityScores.filter(score => score > 0.7).length,
      needs_improvement_count: qualityScores.filter(score => score < 0.5).length,
      distribution: {
        excellent: qualityScores.filter(score => score > 0.8).length,
        good: qualityScores.filter(score => score > 0.6 && score <= 0.8).length,
        fair: qualityScores.filter(score => score > 0.4 && score <= 0.6).length,
        poor: qualityScores.filter(score => score <= 0.4).length
      }
    };
  }

  private analyzeFreshness(articles: any[]) {
    const now = Date.now();
    const freshnessCategories = {
      fresh: 0,      // < 30 days
      recent: 0,     // 30-90 days
      aging: 0,      // 90-180 days
      stale: 0       // > 180 days
    };

    articles.forEach(article => {
      const ageInDays = Math.floor((now - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (ageInDays < 30) freshnessCategories.fresh++;
      else if (ageInDays < 90) freshnessCategories.recent++;
      else if (ageInDays < 180) freshnessCategories.aging++;
      else freshnessCategories.stale++;
    });

    return freshnessCategories;
  }

  private analyzeEngagementPatterns(articles: any[]) {
    const engagementScores = articles.map(article => this.calculateEngagementScore(article));
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
    
    return {
      average_engagement: engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length,
      total_views: totalViews,
      high_performers: articles.filter(article => this.calculateEngagementScore(article) > 0.7).length,
      underperformers: articles.filter(article => this.calculateEngagementScore(article) < 0.3).length
    };
  }

  private identifyCoverageGaps(articles: any[]) {
    // Analyze category coverage and identify potential gaps
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
    const avgArticlesPerCategory = articles.length / Math.max(categories.length, 1);
    
    return {
      total_categories: categories.length,
      average_articles_per_category: avgArticlesPerCategory,
      underrepresented_categories: categories.filter(cat => 
        articles.filter(a => a.category === cat).length < avgArticlesPerCategory * 0.5
      )
    };
  }

  private calculateCompetitiveNeed(article: any, allArticles: any[]): number {
    const articleMetrics = this.generateComprehensiveMetrics(article, allArticles);
    const avgMetrics = {
      quality: allArticles.reduce((sum, a) => sum + this.calculateQualityScore(a), 0) / allArticles.length,
      engagement: allArticles.reduce((sum, a) => sum + this.calculateEngagementScore(a), 0) / allArticles.length
    };

    // Higher need if significantly below average
    const qualityDiff = Math.max(0, avgMetrics.quality - articleMetrics.quality_score);
    const engagementDiff = Math.max(0, avgMetrics.engagement - articleMetrics.engagement_score);
    
    return Math.min(1, (qualityDiff + engagementDiff) / 2);
  }

  private identifyStrategicGaps(analysis: any): AgentSuggestion[] {
    const suggestions: AgentSuggestion[] = [];
    
    // Portfolio-level recommendations
    if (analysis.freshness_analysis.stale > analysis.total_articles * 0.3) {
      suggestions.push({
        target_type: 'content_strategy',
        target_id: 'freshness_initiative',
        suggestion_data: {
          issue_type: 'portfolio_freshness',
          stale_content_count: analysis.freshness_analysis.stale,
          recommended_action: 'content_refresh_campaign',
          estimated_effort: 'Medium',
          priority_level: 'High'
        },
        reasoning: `${analysis.freshness_analysis.stale} articles (${Math.round((analysis.freshness_analysis.stale / analysis.total_articles) * 100)}%) are over 6 months old and may need refreshing to maintain relevance and SEO performance.`,
        confidence_score: 0.8,
        priority: 2,
      });
    }

    return suggestions;
  }

  private generateComprehensiveReasoning(article: any, gaps: any, metrics: any): string {
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    const keyIssues = gaps.identified_gaps.slice(0, 3).join(', ');
    const qualityPercent = Math.round(metrics.quality_score * 100);
    const gapScore = Math.round(gaps.total_gap_score * 100);
    
    return `Article "${article.title}" (${ageInDays} days old) shows ${gapScore}% improvement potential. Key issues: ${keyIssues}. Current quality score: ${qualityPercent}%. ${gaps.estimated_impact} expected from implementing suggested improvements.`;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `Comprehensive content gap analysis using multi-dimensional scoring across freshness, quality, SEO, and engagement metrics to identify optimization opportunities with measurable impact potential.`;
  }
}
