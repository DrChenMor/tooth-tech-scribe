import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, FileText, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { fetchPendingSuggestions, fetchAIAgents, updateSuggestionStatus, runAllActiveAgents, AIAgent, AISuggestion } from '@/services/aiAgents';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import SuggestionReviewCard from './SuggestionReviewCard';

const AICoPilotDashboard = () => {
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchPendingSuggestions,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: fetchAIAgents,
  });

  const runAgentsMutation = useMutation({
    mutationFn: runAllActiveAgents,
    onSuccess: () => {
      toast({ title: "AI Analysis Complete", description: "All active agents have been run successfully." });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
    },
    onError: (error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
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
          </h1>
          <p className="text-muted-foreground mt-2">
            Review AI suggestions and manage intelligent content workflows
          </p>
        </div>
        <Button 
          onClick={() => runAgentsMutation.mutate()}
          disabled={runAgentsMutation.isPending}
        >
          {runAgentsMutation.isPending ? 'Running Analysis...' : 'Run AI Analysis'}
        </Button>
      </div>

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
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents.length}</div>
            <p className="text-xs text-muted-foreground">
              of {(agents as AIAgent[]).length} total agents
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

      {/* Main Content */}
      <Tabs defaultValue="priority" className="space-y-4">
        <TabsList>
          <TabsTrigger value="priority">Priority Suggestions</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

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
