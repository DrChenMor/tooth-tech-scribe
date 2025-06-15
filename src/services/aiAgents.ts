
import { supabase } from '@/integrations/supabase/client';
import { AgentRegistry } from '@/lib/agents/AgentRegistry';
import { BaseAgent, AgentAnalysisContext } from '@/lib/agents/BaseAgent';

export interface AIAgent {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AISuggestion {
  id: string;
  agent_id: string | null;
  target_type: string;
  target_id: string | null;
  suggestion_data: Record<string, any>;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  confidence_score: number | null;
  priority: number | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  expires_at: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  suggestion_id: string | null;
  action_type: 'approve' | 'reject' | 'edit' | 'dismiss';
  original_data: Record<string, any> | null;
  modified_data: Record<string, any> | null;
  admin_reasoning: string | null;
  timestamp: string;
}

export const fetchAIAgents = async (): Promise<AIAgent[]> => {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .order('name');
    
  if (error) throw new Error(`Failed to fetch AI agents: ${error.message}`);
  return data || [];
};

export const fetchPendingSuggestions = async (): Promise<AISuggestion[]> => {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch suggestions: ${error.message}`);
  return data || [];
};

export const updateSuggestionStatus = async (
  suggestionId: string, 
  status: 'approved' | 'rejected' | 'implemented',
  adminReasoning?: string
): Promise<void> => {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', suggestionId);
    
  if (error) throw new Error(`Failed to update suggestion: ${error.message}`);

  // Log admin action
  await logAdminAction(suggestionId, status === 'approved' ? 'approve' : 'reject', null, null, adminReasoning);
};

export const logAdminAction = async (
  suggestionId: string | null,
  actionType: 'approve' | 'reject' | 'edit' | 'dismiss',
  originalData: Record<string, any> | null,
  modifiedData: Record<string, any> | null,
  adminReasoning: string | null
): Promise<void> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('admin_actions_log')
    .insert({
      admin_id: user.id,
      suggestion_id: suggestionId,
      action_type: actionType,
      original_data: originalData,
      modified_data: modifiedData,
      admin_reasoning: adminReasoning
    });
    
  if (error) throw new Error(`Failed to log admin action: ${error.message}`);
};

export const runAgentAnalysis = async (agentName: string): Promise<void> => {
  const registry = AgentRegistry.getInstance();
  
  // Get agent configuration from database
  const { data: agentData, error: agentError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('name', agentName)
    .eq('is_active', true)
    .single();
    
  if (agentError || !agentData) {
    throw new Error(`Agent ${agentName} not found or inactive`);
  }

  // Create agent instance
  const agent = registry.createAgent(agentData.name, agentData.type, agentData.config);
  if (!agent) {
    throw new Error(`Failed to create agent ${agentName}`);
  }

  // Prepare analysis context
  const context: AgentAnalysisContext = await prepareAnalysisContext();
  
  // Run analysis
  const suggestions = await agent.analyze(context);
  
  // Store suggestions in database
  for (const suggestion of suggestions) {
    const { error } = await supabase
      .from('ai_suggestions')
      .insert({
        agent_id: agentData.id,
        target_type: suggestion.target_type,
        target_id: suggestion.target_id,
        suggestion_data: suggestion.suggestion_data,
        reasoning: suggestion.reasoning,
        confidence_score: suggestion.confidence_score,
        priority: suggestion.priority,
        expires_at: suggestion.expires_at?.toISOString()
      });
      
    if (error) {
      console.error(`Failed to store suggestion: ${error.message}`);
    }
  }
};

const prepareAnalysisContext = async (): Promise<AgentAnalysisContext> => {
  // Fetch articles for analysis
  const { data: articles } = await supabase
    .from('articles')
    .select('*');
    
  return {
    articles: articles || []
  };
};

export const runAllActiveAgents = async (): Promise<void> => {
  const agents = await fetchAIAgents();
  const activeAgents = agents.filter(agent => agent.is_active);
  
  for (const agent of activeAgents) {
    try {
      await runAgentAnalysis(agent.name);
      console.log(`Successfully ran analysis for agent: ${agent.name}`);
    } catch (error) {
      console.error(`Failed to run agent ${agent.name}:`, error);
    }
  }
};
