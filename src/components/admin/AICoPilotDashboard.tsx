import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, TrendingUp, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Zap, Activity } from 'lucide-react';
import { fetchPendingSuggestions, fetchAIAgents, updateSuggestionStatus, runAllActiveAgents, AIAgent, AISuggestion } from '@/services/aiAgents';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import SuggestionReviewCard from './SuggestionReviewCard';
import RealtimeActivityFeed from './RealtimeActivityFeed';
import AgentAnalyticsDashboard from './AgentAnalyticsDashboard';
import PredictiveAnalyticsDashboard from './PredictiveAnalyticsDashboard';

const AICoPilotDashboard = () => {
  const queryClient = useQueryClient();
  const [realtimeStats, setRealtimeStats] = useState({
    newSuggestionsCount: 0,
    activeAgentsRunning: 0,
    lastActivity: null as string | null
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchPendingSuggestions,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents,
  });

  // Real-time subscription for new suggestions
  useEffect(() => {
    const channel = supabase
      .channel('ai-suggestions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          console.log('New AI suggestion received:', payload);
          
          // Update realtime stats
          setRealtimeStats(prev => ({
            ...prev,
            newSuggestionsCount: prev.newSuggestionsCount + 1,
            lastActivity: new Date().toISOString()
          }));

          // Show toast notification
          toast({
            title: "New AI Suggestion",
            description: "A new AI suggestion has been generated and is ready for review.",
            duration: 5000,
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          console.log('AI suggestion updated:', payload);
          
          setRealtimeStats(prev => ({
            ...prev,
            lastActivity: new Date().toISOString()
          }));

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const runAgentsMutation = useMutation({
    mutationFn: runAllActiveAgents,
    onMutate: () => {
      setRealtimeStats(prev => ({
        ...prev,
        activeAgentsRunning: (agents as AIAgent[]).filter(a => a.is_active).length
      }));
    },
    onSuccess: () => {
      toast({ title: "AI Analysis Complete", description: "All active agents have been run successfully." });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      setRealtimeStats(prev => ({
        ...prev,
        activeAgentsRunning: 0,
        lastActivity: new Date().toISOString()
      }));
    },
    onError: (error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
      setRealtimeStats(prev => ({
        ...prev,
        activeAgentsRunning: 0
      }));
    }
  });

  const activeAgents = (agents as AIAgent[]).filter(agent => agent.is_active);
  const typedSuggestions = suggestions as AISuggestion[];
  const suggestionsByType = typedSuggestions.reduce((acc, suggestion) => {
    const type = suggestion.target_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(suggestion);
    return acc;
  }, {} as Record<string, AISuggestion[]>);

  const prioritySuggestions = typedSuggestions
    .filter(s => s.priority && s.priority <= 2)
    .sort((a, b) => (a.priority || 5) - (b.priority || 5));

  if (suggestionsLoading || agentsLoading) {
    return <div>Loading AI Co-Pilot Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Co-Pilot Dashboard
            {realtimeStats.activeAgentsRunning > 0 && (
              <Badge variant="default" className="animate-pulse">
                <Activity className="h-3 w-3 mr-1" />
                Analyzing
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Review AI suggestions and manage intelligent content workflows
            {realtimeStats.lastActivity && (
              <span className="ml-2 text-sm">
                • Last activity: {format(new Date(realtimeStats.lastActivity), 'HH:mm:ss')}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => runAgentsMutation.mutate()}
          disabled={runAgentsMutation.isPending}
        >
          {runAgentsMutation.isPending ? 'Running Analysis...' : 'Run AI Analysis'}
        </Button>
      </div>

      {/* Real-time Activity Banner */}
      {realtimeStats.newSuggestionsCount > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-green-800 font-medium">
                {realtimeStats.newSuggestionsCount} new suggestion{realtimeStats.newSuggestionsCount !== 1 ? 's' : ''} received since last refresh
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
                  setRealtimeStats(prev => ({ ...prev, newSuggestionsCount: 0 }));
                }}
              >
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Suggestions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedSuggestions.length}</div>
            <p className="text-xs text-muted-foreground">
              {prioritySuggestions.length} high priority
              {realtimeStats.newSuggestionsCount > 0 && (
                <span className="text-green-600 ml-1">
                  (+{realtimeStats.newSuggestionsCount} new)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {activeAgents.length}
              {realtimeStats.activeAgentsRunning > 0 && (
                <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              of {(agents as AIAgent[]).length} total agents
              {realtimeStats.activeAgentsRunning > 0 && (
                <span className="text-blue-600 ml-1">
                  ({realtimeStats.activeAgentsRunning} running)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Suggestions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestionsByType.article?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Article improvements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestionsByType.hero_section?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Featured content ideas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Improved Tab Layout */}
      <Tabs defaultValue="priority" className="space-y-4">
        <div className="w-full overflow-x-auto">
          <TabsList className="w-full h-auto p-1 grid grid-cols-7 lg:flex lg:w-auto">
            <TabsTrigger value="priority" className="text-xs lg:text-sm whitespace-nowrap">Priority</TabsTrigger>
            <TabsTrigger value="content" className="text-xs lg:text-sm whitespace-nowrap">Content</TabsTrigger>
            <TabsTrigger value="trending" className="text-xs lg:text-sm whitespace-nowrap">Trending</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs lg:text-sm whitespace-nowrap">Activity</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs lg:text-sm whitespace-nowrap">Analytics</TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs lg:text-sm whitespace-nowrap">Predictions</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs lg:text-sm whitespace-nowrap">Agents</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Priority Suggestions</CardTitle>
              <CardDescription>
                Review the most important AI recommendations requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prioritySuggestions.length === 0 ? (
                <p className="text-muted-foreground">No high priority suggestions at this time.</p>
              ) : (
                <div className="space-y-4">
                  {prioritySuggestions.map((suggestion) => (
                    <SuggestionReviewCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Suggestions</CardTitle>
              <CardDescription>
                AI recommendations for article improvements and content optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsByType.article?.length === 0 ? (
                <p className="text-muted-foreground">No content suggestions available.</p>
              ) : (
                <div className="space-y-4">
                  {suggestionsByType.article?.map((suggestion) => (
                    <SuggestionReviewCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Content</CardTitle>
              <CardDescription>
                AI-identified trending articles and featured content recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsByType.hero_section?.length === 0 ? (
                <p className="text-muted-foreground">No trending suggestions available.</p>
              ) : (
                <div className="space-y-4">
                  {suggestionsByType.hero_section?.map((suggestion) => (
                    <SuggestionReviewCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <RealtimeActivityFeed />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AgentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictiveAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agents</CardTitle>
              <CardDescription>
                Manage and monitor your AI agents and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(agents as AIAgent[]).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={agent.is_active ? "default" : "secondary"}>
                          {agent.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{agent.type}</Badge>
                        {agent.is_active && realtimeStats.activeAgentsRunning > 0 && (
                          <Badge variant="default" className="animate-pulse">
                            <Activity className="h-3 w-3 mr-1" />
                            Running
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Created {format(new Date(agent.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICoPilotDashboard;
