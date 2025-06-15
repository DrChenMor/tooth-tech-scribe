import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Users, BarChart3, Settings, Workflow, Zap, Plus, Activity } from 'lucide-react';
import AgentAnalyticsDashboard from './AgentAnalyticsDashboard';
import PredictiveAnalyticsDashboard from './PredictiveAnalyticsDashboard';
import SystemMetricsDashboard from './SystemMetricsDashboard';
import WorkflowAutomationDashboard from './WorkflowAutomationDashboard';
import PerformanceDashboard from './PerformanceDashboard';
import AgentManagementCard from './AgentManagementCard';
import AgentManagementDialog from './AgentManagementDialog';
import IntegrationStatusCard from './IntegrationStatusCard';
import NotificationCenter from './NotificationCenter';
import { useQuery } from '@tanstack/react-query';
import { fetchAIAgents, AIAgent } from '@/services/aiAgents';
import { getSystemMetrics } from '@/services/advancedAnalytics';
import { useToast } from '@/components/ui/use-toast';
import RealSystemMetrics from './RealSystemMetrics';
import RealAIControlPanel from './RealAIControlPanel';

const AICoPilotDashboard = () => {
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const { toast } = useToast();

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: getSystemMetrics,
  });

  // Mock integration data
  const integrations = [
    {
      id: '1',
      name: 'OpenAI API',
      type: 'api' as const,
      status: 'connected' as const,
      lastSync: '2024-01-15T10:30:00Z',
      endpoint: 'https://api.openai.com/v1',
      requestCount: 1247,
      successRate: 98.5
    },
    {
      id: '2',
      name: 'Slack Notifications',
      type: 'webhook' as const,
      status: 'connected' as const,
      lastSync: '2024-01-15T09:15:00Z',
      endpoint: 'https://hooks.slack.com/...',
      requestCount: 89,
      successRate: 100
    },
    {
      id: '3',
      name: 'Email Service',
      type: 'api' as const,
      status: 'warning' as const,
      lastSync: '2024-01-14T14:20:00Z',
      errorMessage: 'Rate limit approaching',
      requestCount: 456,
      successRate: 92.1
    },
    {
      id: '4',
      name: 'Database Sync',
      type: 'database' as const,
      status: 'error' as const,
      errorMessage: 'Connection timeout',
      requestCount: 23,
      successRate: 45.2
    }
  ];

  const handleRefreshIntegration = (id: string) => {
    toast({ title: 'Refreshing...', description: 'Integration status is being updated' });
  };

  const handleConfigureIntegration = (id: string) => {
    toast({ title: 'Opening Configuration', description: 'Integration settings will open' });
  };

  const activeAgents = Array.isArray(agents) ? agents.filter(a => a.is_active) : [];
  const totalAgents = Array.isArray(agents) ? agents.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI CoPilot Control Center
          </h1>
          <p className="text-muted-foreground">
            Monitor, manage, and optimize your AI agents and automation workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Button onClick={() => setShowCreateAgent(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Active Agents</span>
                </div>
                <div className="text-2xl font-bold">{activeAgents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAgents} total agents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Avg Performance</span>
                </div>
                <div className="text-2xl font-bold">87.3%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Workflow className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Automations</span>
                </div>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">8 active workflows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Daily Actions</span>
                </div>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+15% today</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Real AI Control Panel */}
          <RealAIControlPanel />

          {/* Add Real System Metrics */}
          <RealSystemMetrics />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Agent Management</h2>
              <p className="text-muted-foreground">Create, configure, and monitor AI agents</p>
            </div>
            <Button onClick={() => setShowCreateAgent(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsLoading ? (
              <div className="col-span-full text-center py-8">Loading agents...</div>
            ) : totalAgents === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="text-muted-foreground">No agents created yet</div>
                <Button className="mt-4" onClick={() => setShowCreateAgent(true)}>
                  Create Your First Agent
                </Button>
              </div>
            ) : (
              Array.isArray(agents) && agents.map(agent => (
                <AgentManagementCard
                  key={agent.id}
                  agent={agent}
                  onEdit={(agent) => setSelectedAgent(agent)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AgentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="automation">
          <WorkflowAutomationDashboard />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">System Integrations</h2>
            <p className="text-muted-foreground">Monitor and manage external service connections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map(integration => (
              <IntegrationStatusCard
                key={integration.id}
                integration={integration}
                onRefresh={handleRefreshIntegration}
                onConfigure={handleConfigureIntegration}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Health Summary</CardTitle>
              <CardDescription>Overall system integration status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {integrations.filter(i => i.status === 'connected').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {integrations.filter(i => i.status === 'warning').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {integrations.filter(i => i.status === 'error').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {integrations.reduce((sum, i) => sum + i.requestCount, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>
      </Tabs>

      <AgentManagementDialog
        isOpen={showCreateAgent || !!selectedAgent}
        onClose={() => {
          setShowCreateAgent(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        mode={showCreateAgent ? 'create' : 'edit'}
      />
    </div>
  );
};

export default AICoPilotDashboard;
