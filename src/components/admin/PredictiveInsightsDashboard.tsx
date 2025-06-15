
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PredictiveInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'forecast';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  estimatedValue?: string;
}

interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  confidence_upper: number;
  confidence_lower: number;
}

interface PredictiveInsightsDashboardProps {
  insights: PredictiveInsight[];
  forecastData: ForecastData[];
  isLoading?: boolean;
}

const PredictiveInsightsDashboard = ({ 
  insights, 
  forecastData, 
  isLoading = false 
}: PredictiveInsightsDashboardProps) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />;
      case 'forecast':
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-100 text-blue-800';
      case 'anomaly':
        return 'bg-orange-100 text-orange-800';
      case 'recommendation':
        return 'bg-purple-100 text-purple-800';
      case 'forecast':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const actionableInsights = insights.filter(insight => insight.actionable);
  const highImpactInsights = insights.filter(insight => insight.impact === 'high');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">Generated insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actionable</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{actionableInsights.length}</div>
            <p className="text-xs text-muted-foreground">Require action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highImpactInsights.length}</div>
            <p className="text-xs text-muted-foreground">Priority items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {insights.length > 0 ? (insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Prediction accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {highImpactInsights.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">High Priority Insights Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {highImpactInsights.length} high-impact insight{highImpactInsights.length !== 1 ? 's' : ''} require{highImpactInsights.length === 1 ? 's' : ''} immediate attention. 
            Review and take action to optimize system performance.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Forecast</CardTitle>
            <CardDescription>Predicted suggestion volume and confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    value.toFixed(0),
                    name === 'predicted' ? 'Predicted' : 
                    name === 'actual' ? 'Actual' : name
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  stackId="1"
                  stroke="none"
                  fill="#e0e7ff"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="confidence_lower"
                  stackId="1"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights List */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
            <CardDescription>System recommendations and predictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-80 overflow-y-auto">
            {insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={getTypeColor(insight.type)}>
                      {insight.type}
                    </Badge>
                    <Badge variant="outline" className={getImpactColor(insight.impact)}>
                      {insight.impact}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {insight.confidence}%
                    </span>
                    {insight.estimatedValue && (
                      <span className="text-xs text-muted-foreground">
                        Value: {insight.estimatedValue}
                      </span>
                    )}
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No predictive insights available yet.</p>
                <p className="text-sm">Insights will appear as the system gathers more data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictiveInsightsDashboard;
