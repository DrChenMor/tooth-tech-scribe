
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Play, RefreshCw, TrendingUp, FileText, CheckCircle, Clock, Zap } from 'lucide-react';
import { realAIExecution, RealTimeAgentStats } from '@/services/realAIAgentExecution';
import { toast } from '@/components/ui/use-toast';

const RealAIControlPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<RealTimeAgentStats>({
    totalArticles: 0,
    analyzedArticles: 0,
    pendingSuggestions: 0,
    lastRunTime: null,
    activeAgents: 0,
    recentApprovals: 0
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadStats();
    
    if (autoRefresh) {
      const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadStats = async () => {
    try {
      const newStats = await realAIExecution.getRealTimeStats();
      setStats(newStats);
      setIsRunning(realAIExecution.isAnalysisRunning());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRunAnalysis = async () => {
    if (isRunning) {
      toast({
        title: "Analysis In Progress",
        description: "Please wait for the current analysis to complete.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    await realAIExecution.executeRealAnalysis();
    await loadStats();
    setIsRunning(false);
  };

  const getAnalysisProgress = () => {
    if (stats.totalArticles === 0) return 0;
    return Math.round((stats.analyzedArticles / stats.totalArticles) * 100);
  };

  const formatLastRun = (lastRunTime: string | null) => {
    if (!lastRunTime) return 'Never';
    
    const date = new Date(lastRunTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Real AI Agent Control Panel
              </CardTitle>
              <CardDescription>
                Live analysis of your {stats.totalArticles} published articles
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunAnalysis}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analysis Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analysis Progress</span>
              <span>{getAnalysisProgress()}%</span>
            </div>
            <Progress value={getAnalysisProgress()} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {stats.analyzedArticles} of {stats.totalArticles} articles analyzed
            </p>
          </div>

          {/* Real-time Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Articles</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">Published & Active</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Active Agents</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
              <p className="text-xs text-muted-foreground">Running Analysis</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingSuggestions}</div>
              <p className="text-xs text-muted-foreground">Suggestions</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Approved</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.recentApprovals}</div>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </div>
          </div>

          {/* Status Information */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm">
                Status: {isRunning ? 'Analyzing Articles...' : 'Ready'}
              </span>
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'ACTIVE' : 'IDLE'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Last run: {formatLastRun(stats.lastRunTime)}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadStats}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Stats
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <Zap className="h-3 w-3" />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      {stats.totalArticles > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Article Coverage</span>
                <Badge variant={getAnalysisProgress() === 100 ? 'default' : 'secondary'}>
                  {getAnalysisProgress()}% Complete
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Agent Efficiency</span>
                <Badge variant={stats.activeAgents > 0 ? 'default' : 'destructive'}>
                  {stats.activeAgents > 0 ? 'Optimal' : 'Needs Agents'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Suggestion Pipeline</span>
                <Badge variant={stats.pendingSuggestions > 0 ? 'default' : 'secondary'}>
                  {stats.pendingSuggestions} Pending Review
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealAIControlPanel;
