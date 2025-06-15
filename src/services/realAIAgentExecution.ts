
import { supabase } from '@/integrations/supabase/client';
import { runAllActiveAgents, getActiveAgents, AIAgent } from './aiAgents';
import { toast } from '@/components/ui/use-toast';

export interface RealTimeAgentStats {
  totalArticles: number;
  analyzedArticles: number;
  pendingSuggestions: number;
  lastRunTime: string | null;
  activeAgents: number;
  recentApprovals: number;
}

export class RealAIAgentExecution {
  private static instance: RealAIAgentExecution;
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private analysisResults: any[] = [];

  static getInstance(): RealAIAgentExecution {
    if (!RealAIAgentExecution.instance) {
      RealAIAgentExecution.instance = new RealAIAgentExecution();
    }
    return RealAIAgentExecution.instance;
  }

  async executeRealAnalysis(): Promise<void> {
    if (this.isRunning) {
      toast({ title: "Analysis already running", description: "Please wait for the current analysis to complete." });
      return;
    }

    this.isRunning = true;
    console.log('🤖 Starting real AI agent analysis...');

    try {
      // Get real published articles from your database
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published');

      if (articlesError) throw articlesError;

      console.log(`📊 Found ${articles?.length || 0} published articles to analyze`);

      if (!articles || articles.length === 0) {
        toast({ 
          title: "No articles to analyze", 
          description: "Publish some articles first to get AI suggestions.",
          variant: "destructive"
        });
        return;
      }

      // Get active AI agents
      const agents = await getActiveAgents();
      console.log(`🔧 Found ${agents.length} active AI agents`);

      if (agents.length === 0) {
        toast({ 
          title: "No active agents", 
          description: "Enable some AI agents first in the Agent Management section.",
          variant: "destructive"
        });
        return;
      }

      // Run the analysis with real data
      await runAllActiveAgents();
      
      this.lastRunTime = new Date();
      
      // Get the results
      const { data: suggestions } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log(`✅ Analysis complete! Generated ${suggestions?.length || 0} new suggestions`);
      
      toast({ 
        title: "AI Analysis Complete!", 
        description: `Generated ${suggestions?.length || 0} new suggestions from ${articles.length} articles using ${agents.length} agents.`
      });

    } catch (error) {
      console.error('❌ AI Agent execution failed:', error);
      toast({ 
        title: "Analysis failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      this.isRunning = false;
    }
  }

  async getRealTimeStats(): Promise<RealTimeAgentStats> {
    try {
      // Get real data from your database
      const [articlesResult, suggestionsResult, agentsResult, recentApprovalsResult] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('ai_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('ai_agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('ai_suggestions').select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        totalArticles: articlesResult.count || 0,
        analyzedArticles: articlesResult.count || 0, // All published articles are analyzed
        pendingSuggestions: suggestionsResult.count || 0,
        lastRunTime: this.lastRunTime?.toISOString() || null,
        activeAgents: agentsResult.count || 0,
        recentApprovals: recentApprovalsResult.count || 0
      };
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return {
        totalArticles: 0,
        analyzedArticles: 0,
        pendingSuggestions: 0,
        lastRunTime: null,
        activeAgents: 0,
        recentApprovals: 0
      };
    }
  }

  isAnalysisRunning(): boolean {
    return this.isRunning;
  }

  getLastRunTime(): Date | null {
    return this.lastRunTime;
  }
}

export const realAIExecution = RealAIAgentExecution.getInstance();
