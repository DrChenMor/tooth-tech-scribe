
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Brain, AlertTriangle } from 'lucide-react';
import { getAgentAnalytics, getAgentPerformanceData, AgentAnalytics } from '@/services/agentAnalytics';
import { useState } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AgentAnalyticsDashboard = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['agent-analytics'],
    queryFn: getAgentAnalytics,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['agent-performance', selectedAgentId],
    queryFn: () => getAgentPerformanceData(selectedAgentId),
    enabled: !!selectedAgentId,
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (analyticsLoading) {
    return <div>Loading agent analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Agent Performance Analytics
          </h2>
          <p className="text-muted-foreground">
            Track AI agent performance, success rates, and optimization opportunities
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.length}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.filter(a => a.recent_activity > 0).length} active recently
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Approval Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.length > 0 
                    ? Math.round(analytics.reduce((sum, a) => sum + a.approval_rate, 0) / analytics.length)
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, a) => sum + a.total_suggestions, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.reduce((sum, a) => sum + a.recent_activity, 0)} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.filter(a => a.approval_rate < 30).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agents with low approval rates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agent Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Overview</CardTitle>
              <CardDescription>
                Performance metrics for all AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.map((agent) => (
                  <div key={agent.agent_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{agent.agent_name}</h3>
                        <Badge variant={agent.performance_trend === 'improving' ? 'default' : 
                                     agent.performance_trend === 'declining' ? 'destructive' : 'secondary'}>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(agent.performance_trend)}
                            <span className="capitalize">{agent.performance_trend}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Approval Rate</p>
                          <div className="flex items-center gap-2">
                            <Progress value={agent.approval_rate} className="w-16" />
                            <span className="font-medium">{Math.round(agent.approval_rate)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Suggestions</p>
                          <p className="font-medium">{agent.total_suggestions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Confidence</p>
                          <p className="font-medium">{Math.round(agent.average_confidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Recent Activity</p>
                          <p className="font-medium">{agent.recent_activity}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAgentId(agent.agent_id)}
                      className="ml-4 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {selectedAgentId && performanceData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Daily Suggestion Volume</CardTitle>
                  <CardDescription>
                    Number of suggestions generated over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData.daily_suggestions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Distribution</CardTitle>
                    <CardDescription>
                      Distribution of suggestion confidence scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={performanceData.confidence_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ range, count }) => count > 0 ? `${range}: ${count}` : ''}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {performanceData.confidence_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Distribution</CardTitle>
                    <CardDescription>
                      Distribution of suggestion priorities (1=highest, 5=lowest)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceData.priority_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an agent from the overview to view detailed analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {selectedAgentId && performanceData ? (
            <Card>
              <CardHeader>
                <CardTitle>Approval Rate Trend</CardTitle>
                <CardDescription>
                  How approval rates have changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.approval_rates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an agent to view performance trends</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentAnalyticsDashboard;
