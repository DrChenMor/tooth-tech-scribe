
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Brain, Target, Zap, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { predictiveAnalyticsService } from '@/services/predictiveAnalytics';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PredictiveAnalyticsDashboard = () => {
  const { data: articles = [] } = useQuery({
    queryKey: ['articles-for-prediction'],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  const { data: engagementPredictions = [] } = useQuery({
    queryKey: ['engagement-predictions', articles.length],
    queryFn: () => predictiveAnalyticsService.predictEngagement(articles),
    enabled: articles.length > 0
  });

  const { data: trendingPredictions = [] } = useQuery({
    queryKey: ['trending-predictions', articles.length],
    queryFn: () => predictiveAnalyticsService.predictTrending(articles),
    enabled: articles.length > 0
  });

  const { data: qualityPredictions = [] } = useQuery({
    queryKey: ['quality-predictions', articles.length],
    queryFn: () => predictiveAnalyticsService.predictQuality(articles),
    enabled: articles.length > 0
  });

  const { data: modelInfo = [] } = useQuery({
    queryKey: ['model-info'],
    queryFn: () => predictiveAnalyticsService.getModelInfo()
  });

  const topPredictedArticles = engagementPredictions
    .sort((a, b) => b.predicted_views_24h - a.predicted_views_24h)
    .slice(0, 10);

  const highTrendingPotential = trendingPredictions
    .filter(p => p.trending_probability > 0.6)
    .sort((a, b) => b.trending_probability - a.trending_probability);

  const improvementOpportunities = qualityPredictions
    .filter(p => p.improvement_potential - p.quality_score > 0.2)
    .sort((a, b) => (b.improvement_potential - b.quality_score) - (a.improvement_potential - a.quality_score));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Predictive Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            AI-powered predictions and insights for content optimization
          </p>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modelInfo.map((model) => (
          <Card key={model.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {model.type} Model
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Progress value={model.accuracy * 100} className="flex-1" />
                <span className="text-sm font-medium">{Math.round(model.accuracy * 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                v{model.version} • Accuracy
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement Predictions</TabsTrigger>
          <TabsTrigger value="trending">Trending Analysis</TabsTrigger>
          <TabsTrigger value="quality">Quality Insights</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Predicted Performers (24h)</CardTitle>
                <CardDescription>
                  Articles predicted to gain the most views in the next 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPredictedArticles.slice(0, 5).map((prediction) => {
                    const article = articles.find(a => a.id?.toString() === prediction.article_id);
                    return (
                      <div key={prediction.article_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{article?.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(prediction.confidence * 100)}% confidence
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Current: {article?.views || 0} views
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            +{prediction.predicted_views_24h.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">predicted</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Growth Forecast</CardTitle>
                <CardDescription>
                  7-day view predictions for top articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topPredictedArticles.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="article_id" 
                      tick={false}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value.toLocaleString(), 'Predicted Views']}
                      labelFormatter={(articleId) => {
                        const article = articles.find(a => a.id?.toString() === articleId);
                        return article?.title?.substring(0, 30) + '...' || 'Article';
                      }}
                    />
                    <Bar dataKey="predicted_views_7d" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Factors Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Factors Impact</CardTitle>
              <CardDescription>
                How different factors influence predicted engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPredictedArticles.slice(0, 3).map((prediction) => {
                  const article = articles.find(a => a.id?.toString() === prediction.article_id);
                  return (
                    <div key={prediction.article_id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">{article?.title?.substring(0, 40)}...</h4>
                      <div className="space-y-2">
                        {prediction.factors.slice(0, 3).map((factor, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{factor.factor}</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                factor.impact === 'positive' ? 'bg-green-500' : 
                                factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                              }`} />
                              <span className="text-xs">{Math.abs(factor.weight * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>High Trending Potential</CardTitle>
                <CardDescription>
                  Articles with strong trending probability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {highTrendingPotential.slice(0, 5).map((prediction) => {
                    const article = articles.find(a => a.id?.toString() === prediction.article_id);
                    return (
                      <div key={prediction.article_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{article?.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress 
                              value={prediction.trending_probability * 100} 
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              {Math.round(prediction.trending_probability * 100)}% trending
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={prediction.viral_potential > 0.6 ? "default" : "secondary"}>
                            <Zap className="h-3 w-3 mr-1" />
                            {Math.round(prediction.viral_potential * 100)}% viral
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimal Promotion Windows</CardTitle>
                <CardDescription>
                  Best times to promote trending content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {highTrendingPotential.slice(0, 4).map((prediction) => {
                    const article = articles.find(a => a.id?.toString() === prediction.article_id);
                    const start = new Date(prediction.optimal_promotion_window.start);
                    const end = new Date(prediction.optimal_promotion_window.end);
                    
                    return (
                      <div key={prediction.article_id} className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">{article?.title?.substring(0, 40)}...</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {start.toLocaleDateString()} {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-medium mb-1">Recommended Actions:</div>
                          <div className="flex flex-wrap gap-1">
                            {prediction.recommended_actions.slice(0, 2).map((action, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Distribution</CardTitle>
              <CardDescription>
                Current quality scores across all analyzed articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'High Quality (80-100%)', value: qualityPredictions.filter(p => p.quality_score >= 0.8).length },
                      { name: 'Good Quality (60-80%)', value: qualityPredictions.filter(p => p.quality_score >= 0.6 && p.quality_score < 0.8).length },
                      { name: 'Average Quality (40-60%)', value: qualityPredictions.filter(p => p.quality_score >= 0.4 && p.quality_score < 0.6).length },
                      { name: 'Needs Improvement (<40%)', value: qualityPredictions.filter(p => p.quality_score < 0.4).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qualityPredictions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Improvement Opportunities</CardTitle>
              <CardDescription>
                Articles with the highest potential for quality improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {improvementOpportunities.slice(0, 6).map((prediction) => {
                  const article = articles.find(a => a.id?.toString() === prediction.article_id);
                  const improvementGap = prediction.improvement_potential - prediction.quality_score;
                  
                  return (
                    <div key={prediction.article_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{article?.title?.substring(0, 50)}...</h4>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Current: {Math.round(prediction.quality_score * 100)}%
                          </div>
                          <div className="font-semibold text-green-600">
                            Potential: {Math.round(prediction.improvement_potential * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Progress value={improvementGap * 100} className="flex-1" />
                          <span className="text-sm">+{Math.round(improvementGap * 100)}%</span>
                        </div>
                        
                        <div className="text-sm font-medium mb-1">Top Improvements:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {prediction.suggested_improvements.slice(0, 4).map((improvement, index) => (
                            <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <span>{improvement.area}</span>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant={improvement.priority === 'high' ? 'destructive' : 
                                          improvement.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {improvement.priority}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {Math.round(improvement.impact * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
