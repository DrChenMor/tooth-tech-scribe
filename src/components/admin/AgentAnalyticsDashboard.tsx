
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAgentAnalytics, AgentAnalytics } from '@/services/agentAnalytics';
import { getSystemMetrics, getAgentPerformanceData, SystemMetrics, AgentPerformanceData } from '@/services/advancedAnalytics';
import { fetchAIAgents, AIAgent } from '@/services/aiAgents';
import SystemMetricsDashboard from './SystemMetricsDashboard';
import AgentPerformanceChart from './AgentPerformanceChart';
import PerformanceAnalyticsDashboard from './PerformanceAnalyticsDashboard';
import { Brain, BarChart3, TrendingUp, Award } from 'lucide-react';

const AgentAnalyticsDashboard = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['agent-analytics'],
    queryFn: getAgentAnalytics,
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: getSystemMetrics,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents,
  });

  const { data: agentPerformanceData = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['agent-performance', selectedAgentId],
    queryFn: () => selectedAgentId ? getAgentPerformanceData(selectedAgentId) : Promise.resolve([]),
    enabled: !!selectedAgentId,
  });

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
  const selectedAgentAnalytics = analytics.find(a => a.agent_id === selectedAgentId);

  if (analyticsLoading || metricsLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Agent Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor and analyze AI agent performance and system metrics
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {systemMetrics && <SystemMetricsDashboard metrics={systemMetrics} />}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Individual Agent Analytics
              </CardTitle>
              <CardDescription>
                Select an agent to view detailed performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select an agent to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAgent && selectedAgentAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedAgentAnalytics.total_suggestions}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Suggestions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedAgentAnalytics.approval_rate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Approval Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedAgentAnalytics.average_confidence.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Confidence</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedAgentAnalytics.recent_activity}
                      </div>
                      <p className="text-xs text-muted-foreground">Recent Activity</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedAgent && !performanceLoading && agentPerformanceData.length > 0 && (
                <AgentPerformanceChart
                  data={agentPerformanceData}
                  agentName={selectedAgent.name}
                  trend={selectedAgentAnalytics?.performance_trend || 'stable'}
                />
              )}

              {selectedAgent && agentPerformanceData.length === 0 && !performanceLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No performance data available for this agent yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.map((agent) => (
              <Card key={agent.agent_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {agent.agent_name}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      agent.performance_trend === 'improving' ? 'bg-green-100 text-green-800' :
                      agent.performance_trend === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {agent.performance_trend}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Approval Rate</p>
                      <p className="font-semibold">{agent.approval_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Suggestions</p>
                      <p className="font-semibold">{agent.total_suggestions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Confidence</p>
                      <p className="font-semibold">{agent.average_confidence.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recent Activity</p>
                      <p className="font-semibold">{agent.recent_activity}</p>
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

export default AgentAnalyticsDashboard;
