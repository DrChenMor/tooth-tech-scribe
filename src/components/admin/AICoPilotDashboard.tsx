
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Settings, Activity, BarChart3, Zap, Plus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAIAgents, getPendingSuggestions } from '@/services/aiAgents';
import RealAIControlPanel from './RealAIControlPanel';
import RealSystemMetrics from './RealSystemMetrics';
import RealtimeActivityFeed from './RealtimeActivityFeed';
import NotificationCenter from './NotificationCenter';
import AgentManagementCard from './AgentManagementCard';
import AgentManagementDialog from './AgentManagementDialog';
import { AIAgent } from '@/services/aiAgents';

const AICoPilotDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: getPendingSuggestions
  });

  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter(agent => agent.is_active).length || 0;
  const pendingSuggestions = suggestions?.length || 0;

  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setDialogMode('create');
    setIsAgentDialogOpen(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setDialogMode('edit');
    setIsAgentDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAgentDialogOpen(false);
    setSelectedAgent(null);
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Co-Pilot Dashboard
          </CardTitle>
          <CardDescription>
            Monitor AI agent activity and system performance in real-time
          </CardDescription>
          <NotificationCenter />
        </CardHeader>
      </Card>

      <div className="py-4">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-secondary rounded-md p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="control-panel" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Control Panel
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Users className="h-4 w-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total AI Agents</span>
                    </div>
                    <div className="text-2xl font-bold">{totalAgents}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeAgents} active, {totalAgents - activeAgents} inactive
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Pending Suggestions</span>
                    </div>
                    <div className="text-2xl font-bold">{pendingSuggestions}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting review and approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">System Status</span>
                    </div>
                    <div className="text-2xl font-bold">Operational</div>
                    <p className="text-xs text-muted-foreground">
                      All systems online
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Performance</span>
                    </div>
                    <div className="text-2xl font-bold">Excellent</div>
                    <p className="text-xs text-muted-foreground">
                      Agent execution times are optimal
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <Button onClick={handleCreateAgent} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Agent
                </Button>
              </div>

              <RealtimeActivityFeed />
            </TabsContent>

            <TabsContent value="control-panel">
              <RealAIControlPanel />
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">AI Agents Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Create, configure, and manage your AI agents
                  </p>
                </div>
                <Button onClick={handleCreateAgent} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Agent
                </Button>
              </div>

              {isLoadingAgents ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-64 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : agents && agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map((agent) => (
                    <AgentManagementCard
                      key={agent.id}
                      agent={agent}
                      onEdit={handleEditAgent}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No AI Agents Yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first AI agent to start analyzing your content and generating insights.
                    </p>
                    <Button onClick={handleCreateAgent} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Agent
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <RealtimeActivityFeed />
            </TabsContent>

            <TabsContent value="metrics">
              <RealSystemMetrics />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AgentManagementDialog
        isOpen={isAgentDialogOpen}
        onClose={handleCloseDialog}
        agent={selectedAgent}
        mode={dialogMode}
      />
    </div>
  );
};

export default AICoPilotDashboard;
