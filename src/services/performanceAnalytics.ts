
import { supabase } from '@/integrations/supabase/client';
import { AgentAnalytics, getAgentAnalytics } from './agentAnalytics';

export interface PerformanceMetrics {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  total_suggestions: number;
  approved_suggestions: number;
  rejected_suggestions: number;
  pending_suggestions: number;
  approval_rate: number;
  avg_confidence_score: number;
  avg_time_to_review: number; // in hours
  implementation_success: number;
  roi_score: number;
  trend_direction: 'up' | 'down' | 'stable';
  last_7_days_activity: number;
  performance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface AgentComparison {
  metric: string;
  agents: Array<{
    agent_name: string;
    value: number;
    rank: number;
  }>;
}

export interface TimeSeriesData {
  date: string;
  suggestions_created: number;
  suggestions_approved: number;
  approval_rate: number;
  avg_confidence: number;
}

export interface PerformanceInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  agent_id?: string;
  agent_name?: string;
  metric_value?: number;
  recommended_action?: string;
}

export class PerformanceAnalyticsService {
  static async getDetailedPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    // Get agents and suggestions data
    const [agentsResult, suggestionsResult] = await Promise.all([
      supabase.from('ai_agents').select('*'),
      supabase.from('ai_suggestions').select('*')
    ]);

    if (agentsResult.error) throw agentsResult.error;
    if (suggestionsResult.error) throw suggestionsResult.error;

    const agents = agentsResult.data || [];
    const suggestions = suggestionsResult.data || [];

    const metrics: PerformanceMetrics[] = agents.map(agent => {
      const agentSuggestions = suggestions.filter(s => s.agent_id === agent.id);
      
      const total = agentSuggestions.length;
      const approved = agentSuggestions.filter(s => s.status === 'approved').length;
      const rejected = agentSuggestions.filter(s => s.status === 'rejected').length;
      const pending = agentSuggestions.filter(s => s.status === 'pending').length;
      const implemented = agentSuggestions.filter(s => s.status === 'implemented').length;
      
      const approval_rate = total > 0 ? (approved / total) * 100 : 0;
      const avg_confidence = agentSuggestions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / (total || 1);
      
      // Calculate average time to review
      const reviewedSuggestions = agentSuggestions.filter(s => s.reviewed_at);
      const avg_time_to_review = reviewedSuggestions.length > 0 
        ? reviewedSuggestions.reduce((sum, s) => {
            const created = new Date(s.created_at || '').getTime();
            const reviewed = new Date(s.reviewed_at || '').getTime();
            return sum + (reviewed - created) / (1000 * 60 * 60); // Convert to hours
          }, 0) / reviewedSuggestions.length
        : 0;

      // Calculate last 7 days activity
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recent_activity = agentSuggestions.filter(s => 
        new Date(s.created_at || '') > sevenDaysAgo
      ).length;

      // Calculate trend direction
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentApprovals = agentSuggestions.filter(s => 
        new Date(s.created_at || '') > sevenDaysAgo && s.status === 'approved'
      ).length;
      const olderApprovals = agentSuggestions.filter(s => 
        new Date(s.created_at || '') > fourteenDaysAgo && 
        new Date(s.created_at || '') <= sevenDaysAgo && 
        s.status === 'approved'
      ).length;

      let trend_direction: 'up' | 'down' | 'stable' = 'stable';
      if (recentApprovals > olderApprovals * 1.2) trend_direction = 'up';
      else if (recentApprovals < olderApprovals * 0.8) trend_direction = 'down';

      // Calculate ROI score (simplified metric)
      const implementation_success = total > 0 ? (implemented / total) * 100 : 0;
      const roi_score = (approval_rate * 0.4) + (avg_confidence * 100 * 0.3) + (implementation_success * 0.3);

      // Assign performance grade
      let performance_grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
      if (roi_score >= 80) performance_grade = 'A';
      else if (roi_score >= 70) performance_grade = 'B';
      else if (roi_score >= 60) performance_grade = 'C';
      else if (roi_score >= 50) performance_grade = 'D';

      return {
        agent_id: agent.id,
        agent_name: agent.name,
        agent_type: agent.type,
        total_suggestions: total,
        approved_suggestions: approved,
        rejected_suggestions: rejected,
        pending_suggestions: pending,
        approval_rate,
        avg_confidence_score: avg_confidence,
        avg_time_to_review,
        implementation_success,
        roi_score,
        trend_direction,
        last_7_days_activity: recent_activity,
        performance_grade
      };
    });

    return metrics.sort((a, b) => b.roi_score - a.roi_score);
  }

  static async getAgentComparisons(): Promise<AgentComparison[]> {
    const metrics = await this.getDetailedPerformanceMetrics();
    
    const comparisons: AgentComparison[] = [
      {
        metric: 'Approval Rate',
        agents: metrics.map((m, index) => ({
          agent_name: m.agent_name,
          value: m.approval_rate,
          rank: index + 1
        })).sort((a, b) => b.value - a.value)
      },
      {
        metric: 'Total Suggestions',
        agents: metrics.map((m, index) => ({
          agent_name: m.agent_name,
          value: m.total_suggestions,
          rank: index + 1
        })).sort((a, b) => b.value - a.value)
      },
      {
        metric: 'ROI Score',
        agents: metrics.map((m, index) => ({
          agent_name: m.agent_name,
          value: m.roi_score,
          rank: index + 1
        })).sort((a, b) => b.value - a.value)
      },
      {
        metric: 'Confidence Score',
        agents: metrics.map((m, index) => ({
          agent_name: m.agent_name,
          value: m.avg_confidence_score * 100,
          rank: index + 1
        })).sort((a, b) => b.value - a.value)
      }
    ];

    return comparisons;
  }

  static async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const timeSeriesMap = new Map<string, TimeSeriesData>();

    // Initialize all dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      timeSeriesMap.set(dateStr, {
        date: dateStr,
        suggestions_created: 0,
        suggestions_approved: 0,
        approval_rate: 0,
        avg_confidence: 0
      });
    }

    // Aggregate data by date
    (suggestions || []).forEach(suggestion => {
      const dateStr = suggestion.created_at?.split('T')[0];
      if (!dateStr || !timeSeriesMap.has(dateStr)) return;

      const dayData = timeSeriesMap.get(dateStr)!;
      dayData.suggestions_created++;
      
      if (suggestion.status === 'approved') {
        dayData.suggestions_approved++;
      }
      
      dayData.avg_confidence += suggestion.confidence_score || 0;
    });

    // Calculate rates and averages
    timeSeriesMap.forEach(dayData => {
      if (dayData.suggestions_created > 0) {
        dayData.approval_rate = (dayData.suggestions_approved / dayData.suggestions_created) * 100;
        dayData.avg_confidence = (dayData.avg_confidence / dayData.suggestions_created) * 100;
      }
    });

    return Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static async generatePerformanceInsights(): Promise<PerformanceInsight[]> {
    const metrics = await this.getDetailedPerformanceMetrics();
    const insights: PerformanceInsight[] = [];

    // Top performer insight
    const topPerformer = metrics[0];
    if (topPerformer && topPerformer.roi_score > 70) {
      insights.push({
        type: 'success',
        title: 'Top Performing Agent',
        description: `${topPerformer.agent_name} is your best performing agent with a ${topPerformer.roi_score.toFixed(1)} ROI score and ${topPerformer.approval_rate.toFixed(1)}% approval rate.`,
        agent_id: topPerformer.agent_id,
        agent_name: topPerformer.agent_name,
        metric_value: topPerformer.roi_score,
        recommended_action: 'Consider expanding this agent\'s scope or increasing its run frequency.'
      });
    }

    // Low performer warning
    const lowPerformers = metrics.filter(m => m.approval_rate < 30 && m.total_suggestions > 5);
    lowPerformers.forEach(performer => {
      insights.push({
        type: 'warning',
        title: 'Low Approval Rate Detected',
        description: `${performer.agent_name} has a low approval rate of ${performer.approval_rate.toFixed(1)}% with ${performer.total_suggestions} suggestions.`,
        agent_id: performer.agent_id,
        agent_name: performer.agent_name,
        metric_value: performer.approval_rate,
        recommended_action: 'Review agent configuration or consider retraining with better prompts.'
      });
    });

    // Trending up agents
    const trendingUp = metrics.filter(m => m.trend_direction === 'up' && m.last_7_days_activity > 0);
    trendingUp.slice(0, 2).forEach(agent => {
      insights.push({
        type: 'info',
        title: 'Improving Performance',
        description: `${agent.agent_name} is showing improved performance with ${agent.last_7_days_activity} suggestions in the last 7 days.`,
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        recommended_action: 'Monitor continued improvement and consider similar configurations for other agents.'
      });
    });

    // Inactive agents
    const inactiveAgents = metrics.filter(m => m.last_7_days_activity === 0 && m.total_suggestions < 5);
    inactiveAgents.forEach(agent => {
      insights.push({
        type: 'error',
        title: 'Inactive Agent',
        description: `${agent.agent_name} has no recent activity and only ${agent.total_suggestions} total suggestions.`,
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        recommended_action: 'Check agent configuration or enable auto-run scheduling.'
      });
    });

    // High confidence but low approval insight
    const paradoxAgents = metrics.filter(m => 
      m.avg_confidence_score > 0.8 && m.approval_rate < 50 && m.total_suggestions > 3
    );
    paradoxAgents.forEach(agent => {
      insights.push({
        type: 'warning',
        title: 'High Confidence, Low Approval',
        description: `${agent.agent_name} has high confidence (${(agent.avg_confidence_score * 100).toFixed(1)}%) but low approval rate (${agent.approval_rate.toFixed(1)}%).`,
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        recommended_action: 'Review suggestion quality and adjust confidence thresholds.'
      });
    });

    return insights.slice(0, 8); // Limit to top 8 insights
  }
}
