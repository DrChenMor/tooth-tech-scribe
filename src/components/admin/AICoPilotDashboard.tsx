import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Settings, Activity, BarChart3, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAIAgents, fetchAISuggestions } from '@/services/aiAgents';
import RealAIControlPanel from './RealAIControlPanel';
import RealSystemMetrics from './RealSystemMetrics';
import RealtimeActivityFeed from './RealtimeActivityFeed';
import NotificationCenter from './NotificationCenter';
import { notificationService } from '@/services/realtimeNotifications';

const AICoPilotDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchAISuggestions
  });

  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter(agent => agent.is_active).length || 0;
  const pendingSuggestions = suggestions?.filter(suggestion => suggestion.status === 'pending').length || 0;

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
              <RealtimeActivityFeed />
            </TabsContent>

            <TabsContent value="control-panel">
              <RealAIControlPanel />
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
    </div>
  );
};

export default AICoPilotDashboard;
