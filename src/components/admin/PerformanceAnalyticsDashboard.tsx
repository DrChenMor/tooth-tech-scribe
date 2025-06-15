
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { PerformanceAnalyticsService, PerformanceMetrics, PerformanceInsight } from '@/services/performanceAnalytics';

const PerformanceAnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');

  const { data: performanceMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: PerformanceAnalyticsService.getDetailedPerformanceMetrics,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: agentComparisons = [], isLoading: comparisonsLoading } = useQuery({
    queryKey: ['agent-comparisons'],
    queryFn: PerformanceAnalyticsService.getAgentComparisons,
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: timeSeriesData = [], isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['time-series', selectedTimeRange],
    queryFn: () => PerformanceAnalyticsService.getTimeSeriesData(parseInt(selectedTimeRange)),
    refetchInterval: 60000
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['performance-insights'],
    queryFn: PerformanceAnalyticsService.generatePerformanceInsights,
    refetchInterval: 120000 // Refresh every 2 minutes
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  if (metricsLoading) {
    return <div className="flex items-center justify-center p-8">Loading performance analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Performance Analytics
          </h2>
          <p className="text-muted-foreground">
            Track AI agent effectiveness and optimize suggestion quality
          </p>
        </div>
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Avg Approval Rate</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.length > 0 ? 
                    (performanceMetrics.reduce((sum, m) => sum + m.approval_rate, 0) / performanceMetrics.length).toFixed(1) : 0
                  }%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Suggestions</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.reduce((sum, m) => sum + m.total_suggestions, 0)}
                </div>
              </CardContent>  
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Avg ROI Score</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.length > 0 ? 
                    (performanceMetrics.reduce((sum, m) => sum + m.roi_score, 0) / performanceMetrics.length).toFixed(1) : 0
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg Review Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {performanceMetrics.length > 0 ? 
                    (performanceMetrics.reduce((sum, m) => sum + m.avg_time_to_review, 0) / performanceMetrics.length).toFixed(1) : 0
                  }h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Suggestion Volume & Approval Trends</CardTitle>
              <CardDescription>Daily suggestion creation and approval rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name.includes('rate') ? `${value.toFixed(1)}%` : value,
                      name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="suggestions_created" fill="#3b82f6" name="Suggestions Created" />
                  <Line yAxisId="right" type="monotone" dataKey="approval_rate" stroke="#10b981" strokeWidth={2} name="Approval Rate" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-4">
            {performanceMetrics.map((metric) => (
              <Card key={metric.agent_id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{metric.agent_name}</h3>
                        <Badge variant="outline">{metric.agent_type}</Badge>
                        <Badge className={getGradeColor(metric.performance_grade)}>
                          Grade {metric.performance_grade}
                        </Badge>
                      </div>
                      {getTrendIcon(metric.trend_direction)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.roi_score.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">ROI Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Approval Rate</p>
                      <p className="font-semibold">{metric.approval_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Suggestions</p>
                      <p className="font-semibold">{metric.total_suggestions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Confidence</p>
                      <p className="font-semibold">{(metric.avg_confidence_score * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recent Activity</p>
                      <p className="font-semibold">{metric.last_7_days_activity}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentComparisons.map((comparison) => (
              <Card key={comparison.metric}>
                <CardHeader>
                  <CardTitle className="text-lg">{comparison.metric} Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={comparison.agents}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent_name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [
                        comparison.metric.includes('Rate') || comparison.metric.includes('Score') ? 
                          `${value.toFixed(1)}%` : value.toString(),
                        comparison.metric
                      ]} />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        {insight.agent_name && (
                          <Badge variant="outline">{insight.agent_name}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{insight.description}</p>
                      {insight.recommended_action && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm"><strong>Recommended Action:</strong> {insight.recommended_action}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceAnalyticsDashboard;
