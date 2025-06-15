
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  FileText, 
  Eye, 
  BarChart3, 
  Calendar,
  Target,
  Activity,
  Users
} from 'lucide-react';
import { RealAnalyticsService, RealAnalyticsData } from '@/services/realAnalytics';
import { useQuery } from '@tanstack/react-query';

const RealSystemMetrics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['real-analytics'],
    queryFn: RealAnalyticsService.getComprehensiveAnalytics,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: predictions } = useQuery({
    queryKey: ['engagement-predictions'],
    queryFn: RealAnalyticsService.getEngagementPredictions,
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const publishRate = analytics.totalArticles > 0 
    ? Math.round((analytics.publishedArticles / analytics.totalArticles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Articles</span>
            </div>
            <div className="text-2xl font-bold">{analytics.totalArticles}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedArticles} published, {analytics.draftArticles} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Views</span>
            </div>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {analytics.avgViewsPerArticle} per article
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Publish Rate</span>
            </div>
            <div className="text-2xl font-bold">{publishRate}%</div>
            <Progress value={publishRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Categories</span>
            </div>
            <div className="text-2xl font-bold">{analytics.categoryPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Active content categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Articles */}
      {analytics.topPerformingArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Articles
            </CardTitle>
            <CardDescription>Your most viewed published content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformingArticles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{article.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {article.category || 'Uncategorized'} • {new Date(article.published_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{article.views.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">views</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Performance */}
      {analytics.categoryPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Performance
            </CardTitle>
            <CardDescription>Content performance by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.categoryPerformance.map((category) => (
                <div key={category.category} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{category.category}</h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Articles:</span>
                      <span>{category.articleCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Views:</span>
                      <span>{category.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Views:</span>
                      <span>{category.avgViews}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Predictions */}
      {predictions && predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Engagement Predictions
            </CardTitle>
            <CardDescription>AI-powered engagement forecasts for your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.slice(0, 5).map((prediction) => (
                <div key={prediction.articleId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{prediction.title}</h4>
                    <Badge variant={prediction.confidence > 0.7 ? 'default' : 'secondary'}>
                      {Math.round(prediction.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Predicted Views: <strong>{prediction.predictedViews}</strong></span>
                    <span className="text-muted-foreground">
                      {prediction.factors.length} factors analyzed
                    </span>
                  </div>
                  {prediction.factors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {prediction.factors.slice(0, 3).map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealSystemMetrics;
