
import { supabase } from '@/integrations/supabase/client';
import { AISuggestion, AIAgent } from './aiAgents';

export interface AgentPerformanceMetric {
  id: string;
  agent_id: string;
  suggestion_id: string;
  performance_score: number;
  admin_feedback: 'good' | 'irrelevant' | 'wrong' | 'excellent';
  feedback_notes: string | null;
  logged_at: string;
}

export interface AgentAnalytics {
  agent_id: string;
  agent_name: string;
  total_suggestions: number;
  approved_suggestions: number;
  rejected_suggestions: number;
  pending_suggestions: number;
  approval_rate: number;
  average_confidence: number;
  average_priority: number;
  recent_activity: number;
  performance_trend: 'improving' | 'declining' | 'stable';
}

export interface AgentPerformanceData {
  daily_suggestions: Array<{ date: string; count: number }>;
  approval_rates: Array<{ date: string; rate: number }>;
  confidence_distribution: Array<{ range: string; count: number }>;
  priority_distribution: Array<{ priority: number; count: number }>;
}

export async function getAgentAnalytics(): Promise<AgentAnalytics[]> {
  const { data: agents, error: agentsError } = await supabase
    .from('ai_agents')
    .select('*');

  if (agentsError) throw agentsError;

  const { data: suggestions, error: suggestionsError } = await supabase
    .from('ai_suggestions')
    .select('*');

  if (suggestionsError) throw suggestionsError;

  // Calculate analytics for each agent
  const analytics: AgentAnalytics[] = agents.map(agent => {
    const agentSuggestions = suggestions.filter(s => s.agent_id === agent.id);
    const total = agentSuggestions.length;
    const approved = agentSuggestions.filter(s => s.status === 'approved').length;
    const rejected = agentSuggestions.filter(s => s.status === 'rejected').length;
    const pending = agentSuggestions.filter(s => s.status === 'pending').length;
    
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    
    const avgConfidence = agentSuggestions.reduce((sum, s) => 
      sum + (s.confidence_score || 0), 0) / (total || 1);
    
    const avgPriority = agentSuggestions.reduce((sum, s) => 
      sum + (s.priority || 3), 0) / (total || 1);

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = agentSuggestions.filter(s => 
      new Date(s.created_at || '') > sevenDaysAgo).length;

    // Simple trend calculation based on recent vs older suggestions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApprovalRate = agentSuggestions
      .filter(s => new Date(s.created_at || '') > sevenDaysAgo)
      .filter(s => s.status === 'approved').length / (recentActivity || 1) * 100;
    
    const olderApprovalRate = agentSuggestions
      .filter(s => new Date(s.created_at || '') > thirtyDaysAgo && new Date(s.created_at || '') <= sevenDaysAgo)
      .filter(s => s.status === 'approved').length / 
      (agentSuggestions.filter(s => new Date(s.created_at || '') > thirtyDaysAgo && new Date(s.created_at || '') <= sevenDaysAgo).length || 1) * 100;

    let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentApprovalRate > olderApprovalRate + 10) performanceTrend = 'improving';
    else if (recentApprovalRate < olderApprovalRate - 10) performanceTrend = 'declining';

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      total_suggestions: total,
      approved_suggestions: approved,
      rejected_suggestions: rejected,
      pending_suggestions: pending,
      approval_rate: approvalRate,
      average_confidence: avgConfidence,
      average_priority: avgPriority,
      recent_activity: recentActivity,
      performance_trend: performanceTrend
    };
  });

  return analytics;
}

export async function getAgentPerformanceData(agentId: string): Promise<AgentPerformanceData> {
  const { data: suggestions, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Calculate daily suggestions for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailySuggestions = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = suggestions.filter(s => 
      s.created_at && s.created_at.startsWith(dateStr)).length;
    
    dailySuggestions.push({ date: dateStr, count });
  }

  // Calculate approval rates over time
  const approvalRates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const daysuggestions = suggestions.filter(s => 
      s.created_at && s.created_at.startsWith(dateStr));
    
    const approved = daysuggestions.filter(s => s.status === 'approved').length;
    const rate = daysuggestions.length > 0 ? (approved / daysuggestions.length) * 100 : 0;
    
    approvalRates.push({ date: dateStr, rate });
  }

  // Confidence distribution
  const confidenceRanges = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 }
  ];

  suggestions.forEach(s => {
    const confidence = (s.confidence_score || 0) * 100;
    if (confidence <= 20) confidenceRanges[0].count++;
    else if (confidence <= 40) confidenceRanges[1].count++;
    else if (confidence <= 60) confidenceRanges[2].count++;
    else if (confidence <= 80) confidenceRanges[3].count++;
    else confidenceRanges[4].count++;
  });

  // Priority distribution
  const priorityDistribution = [1, 2, 3, 4, 5].map(priority => ({
    priority,
    count: suggestions.filter(s => s.priority === priority).length
  }));

  return {
    daily_suggestions: dailySuggestions,
    approval_rates: approvalRates,
    confidence_distribution: confidenceRanges,
    priority_distribution: priorityDistribution
  };
}

export async function logAgentPerformance(
  agentId: string,
  suggestionId: string,
  performanceScore: number,
  adminFeedback: 'good' | 'irrelevant' | 'wrong' | 'excellent',
  feedbackNotes?: string
): Promise<void> {
  const { error } = await supabase
    .from('agent_performance_metrics')
    .insert([{
      agent_id: agentId,
      suggestion_id: suggestionId,
      performance_score: performanceScore,
      admin_feedback: adminFeedback,
      feedback_notes: feedbackNotes
    }]);

  if (error) throw error;
}
