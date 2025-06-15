
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingSuggestions, getRealtimeStats } from '@/services/aiAgents';
import { realAIExecution } from '@/services/realAIAgentExecution';
import { toast } from '@/components/ui/use-toast';
import ActionableSuggestionCard from './ActionableSuggestionCard';

const RealAIControlPanel = () => {
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: getPendingSuggestions,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: getRealtimeStats,
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalysisRunning(true);
      await realAIExecution.executeRealAnalysis();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['realtime-stats'] });
      toast({
        title: "Analysis Complete!",
        description: "AI agents have finished analyzing your content."
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsAnalysisRunning(false);
    }
  });

  useEffect(() => {
    const checkRunningStatus = () => {
      setIsAnalysisRunning(realAIExecution.isAnalysisRunning());
    };

    const interval = setInterval(checkRunningStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLastRun = () => {
    const lastRun = realAIExecution.getLastRunTime();
    if (!lastRun) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRun.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Agent Control Panel
          </CardTitle>
          <CardDescription>
            Execute AI analysis and manage suggestions in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.activeAgents || 0}</div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingCount || 0}</div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.recentActivity || 0}</div>
              <p className="text-sm text-muted-foreground">Recent Activity</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {formatLastRun()}
              </div>
              <p className="text-sm text-muted-foreground">Last Analysis</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-4">
            <Button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={isAnalysisRunning || runAnalysisMutation.isPending}
              className="flex items-center gap-2"
            >
              {isAnalysisRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">
                Status: {isAnalysisRunning ? (
                  <Badge variant="default" className="ml-1">Running</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-1">Ready</Badge>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pending AI Suggestions
            <Badge variant="outline">{suggestions?.length || 0}</Badge>
          </CardTitle>
          <CardDescription>
            Review and act on AI-generated suggestions for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSuggestions ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <ActionableSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No pending suggestions</h3>
              <p className="text-muted-foreground">
                Run an AI analysis to generate new suggestions for your content.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealAIControlPanel;
