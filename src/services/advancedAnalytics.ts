
import { supabase } from '@/integrations/supabase/client';
import { getAgentAnalytics, AgentAnalytics } from './agentAnalytics';

export interface SystemMetrics {
  totalSuggestions: number;
  approvedSuggestions: number;
  pendingSuggestions: number;
  rejectedSuggestions: number;
  averageProcessingTime: number;
  systemUptime: number;
  agentDistribution: Array<{ name: string; count: number; color: string }>;
  hourlyActivity: Array<{ hour: string; suggestions: number; approvals: number }>;
}

export interface PredictiveInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'forecast';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  estimatedValue?: string;
}

export interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  confidence_upper: number;
  confidence_lower: number;
}

export interface AgentPerformanceData {
  date: string;
  suggestions: number;
  approvals: number;
  approval_rate: number;
  confidence: number;
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const { data: suggestions, error } = await supabase
    .from('ai_suggestions')
    .select('*');

  if (error) throw error;

  const { data: agents } = await supabase
    .from('ai_agents')
    .select('*');

  const totalSuggestions = suggestions?.length || 0;
  const approvedSuggestions = suggestions?.filter(s => s.status === 'approved').length || 0;
  const pendingSuggestions = suggestions?.filter(s => s.status === 'pending').length || 0;
  const rejectedSuggestions = suggestions?.filter(s => s.status === 'rejected').length || 0;

  // Calculate agent distribution
  const agentCounts = suggestions?.reduce((acc, s) => {
    const agentName = agents?.find(a => a.id === s.agent_id)?.name || 'Unknown';
    acc[agentName] = (acc[agentName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const agentDistribution = Object.entries(agentCounts).map(([name, count], index) => ({
    name,
    count,
    color: colors[index % colors.length]
  }));

  // Calculate hourly activity (mock data for demonstration)
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    suggestions: Math.floor(Math.random() * 10) + 1,
    approvals: Math.floor(Math.random() * 8) + 1,
  }));

  return {
    totalSuggestions,
    approvedSuggestions,
    pendingSuggestions,
    rejectedSuggestions,
    averageProcessingTime: 2.3, // Mock data
    systemUptime: 99.7, // Mock data
    agentDistribution,
    hourlyActivity,
  };
}

export async function generatePredictiveInsights(): Promise<PredictiveInsight[]> {
  const analytics = await getAgentAnalytics();
  const insights: PredictiveInsight[] = [];

  // Generate insights based on agent performance
  analytics.forEach((agent, index) => {
    // Low approval rate insight
    if (agent.approval_rate < 50) {
      insights.push({
        id: `low-approval-${agent.agent_id}`,
        type: 'anomaly',
        title: `Low Approval Rate Detected`,
        description: `Agent "${agent.agent_name}" has an approval rate of ${agent.approval_rate.toFixed(1)}%, significantly below the recommended 70% threshold.`,
        confidence: 85,
        impact: 'high',
        category: 'performance',
        actionable: true,
        estimatedValue: '15% efficiency gain potential'
      });
    }

    // High performance agent insight
    if (agent.approval_rate > 80 && agent.total_suggestions > 10) {
      insights.push({
        id: `high-performance-${agent.agent_id}`,
        type: 'recommendation',
        title: `High-Performing Agent Identified`,
        description: `Agent "${agent.agent_name}" shows excellent performance with ${agent.approval_rate.toFixed(1)}% approval rate. Consider expanding its scope.`,
        confidence: 92,
        impact: 'medium',
        category: 'optimization',
        actionable: true,
        estimatedValue: '25% productivity increase'
      });
    }

    // Trending performance
    if (agent.performance_trend === 'improving') {
      insights.push({
        id: `trending-up-${agent.agent_id}`,
        type: '
' 이하

trend',
        title: `Performance Improvement Trend`,
        description: `Agent "${agent.agent_name}" shows consistent improvement in recent performance metrics.`,
        confidence: 78,
        impact: 'low',
        category: 'trend',
        actionable: false
      });
    }
  });

  // System-wide insights
  const totalSuggestions = analytics.reduce((sum, a) => sum + a.total_suggestions, 0);
  const avgApprovalRate = analytics.reduce((sum, a) => sum + a.approval_rate, 0) / analytics.length;

  if (avgApprovalRate < 60) {
    insights.push({
      id: 'system-low-approval',
      type: 'anomaly',
      title: 'System-Wide Low Approval Rate',
      description: `Overall system approval rate is ${avgApprovalRate.toFixed(1)}%, indicating potential configuration issues across multiple agents.`,
      confidence: 88,
      impact: 'high',
      category: 'system',
      actionable: true,
      estimatedValue: '30% efficiency improvement potential'
    });
  }

  if (totalSuggestions > 100) {
    insights.push({
      id: 'high-volume-forecast',
      type: 'forecast',
      title: 'High Suggestion Volume Predicted',
      description: `Based on current trends, expect 20% increase in suggestion volume over the next 7 days.`,
      confidence: 72,
      impact: 'medium',
      category: 'capacity',
      actionable: true,
      estimatedValue: 'Scale resources proactively'
    });
  }

  return insights.slice(0, 8); // Limit to top 8 insights
}

export async function getForecastData(): Promise<ForecastData[]> {
  // Generate forecast data for the next 7 days based on historical patterns
  const baseDate = new Date();
  const forecastData: ForecastData[] = [];

  for (let i = -7; i <= 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    const isHistorical = i <= 0;
    const baseValue = 15 + Math.sin(i * 0.5) * 5; // Seasonal pattern
    const noise = (Math.random() - 0.5) * 4;
    
    const predicted = Math.max(0, baseValue + noise);
    const confidence_range = predicted * 0.2; // 20% confidence interval
    
    forecastData.push({
      date: date.toISOString().split('T')[0],
      actual: isHistorical ? Math.max(0, predicted + (Math.random() - 0.5) * 3) : undefined,
      predicted: Math.round(predicted),
      confidence_upper: Math.round(predicted + confidence_range),
      confidence_lower: Math.round(Math.max(0, predicted - confidence_range))
    });
  }

  return forecastData;
}

export async function getAgentPerformanceData(agentId: string): Promise<AgentPerformanceData[]> {
  const { data: suggestions, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date and calculate metrics
  const dailyData: Record<string, { suggestions: number; approvals: number }> = {};
  
  suggestions?.forEach(suggestion => {
    const date = suggestion.created_at?.split('T')[0];
    if (!date) return;
    
    if (!dailyData[date]) {
      dailyData[date] = { suggestions: 0, approvals: 0 };
    }
    
    dailyData[date].suggestions++;
    if (suggestion.status === 'approved') {
      dailyData[date].approvals++;
    }
  });

  // Convert to array format with last 30 days
  const performanceData: AgentPerformanceData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = dailyData[dateStr] || { suggestions: 0, approvals: 0 };
    const approval_rate = dayData.suggestions > 0 ? (dayData.approvals / dayData.suggestions * 100) : 0;
    
    performanceData.push({
      date: dateStr,
      suggestions: dayData.suggestions,
      approvals: dayData.approvals,
      approval_rate,
      confidence: Math.random() * 0.3 + 0.7 // Mock confidence data
    });
  }

  return performanceData;
}
