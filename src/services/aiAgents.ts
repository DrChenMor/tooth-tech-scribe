
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
  agent_id: string;
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
  suggestion_id: string;
  action_type: 'approve' | 'reject' | 'edit' | 'dismiss';
  original_data: Record<string, any> | null;
  modified_data: Record<string, any> | null;
  admin_reasoning: string | null;
  timestamp: string;
}

// Helper function to safely parse JSON data
function parseJsonSafely(json: any): Record<string, any> {
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
  return json as Record<string, any> || {};
}

export async function getActiveAgents(): Promise<AIAgent[]> {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  
  return data.map(agent => ({
    ...agent,
    config: parseJsonSafely(agent.config)
  })) as AIAgent[];
}

export async function fetchAIAgents(): Promise<AIAgent[]> {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .order('name');

  if (error) throw error;
  
  return data.map(agent => ({
    ...agent,
    config: parseJsonSafely(agent.config)
  })) as AIAgent[];
}

export async function getPendingSuggestions(): Promise<AISuggestion[]> {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(suggestion => ({
    ...suggestion,
    suggestion_data: parseJsonSafely(suggestion.suggestion_data)
  })) as AISuggestion[];
}

export async function fetchPendingSuggestions(): Promise<AISuggestion[]> {
  return getPendingSuggestions();
}

export async function createSuggestion(suggestion: Omit<AISuggestion, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>): Promise<AISuggestion> {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .insert([{
      ...suggestion,
      suggestion_data: JSON.stringify(suggestion.suggestion_data)
    }])
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    suggestion_data: parseJsonSafely(data.suggestion_data)
  } as AISuggestion;
}

export async function updateSuggestionStatus(
  suggestionId: string, 
  status: AISuggestion['status'],
  adminReasoning?: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({ 
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', suggestionId);

  if (error) throw error;

  // Log the admin action
  await logAdminAction(suggestionId, status === 'approved' ? 'approve' : 'reject', adminReasoning);
}

export async function logAdminAction(
  suggestionId: string,
  actionType: AdminAction['action_type'],
  reasoning?: string,
  originalData?: Record<string, any>,
  modifiedData?: Record<string, any>
): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('admin_actions_log')
    .insert([{
      admin_id: user.data.user.id,
      suggestion_id: suggestionId,
      action_type: actionType,
      original_data: originalData ? JSON.stringify(originalData) : null,
      modified_data: modifiedData ? JSON.stringify(modifiedData) : null,
      admin_reasoning: reasoning
    }]);

  if (error) throw error;
}

export async function runAgent(agentName: string, context: AgentAnalysisContext): Promise<void> {
  const registry = AgentRegistry.getInstance();
  
  // Get agent configuration from database
  const { data: agentData, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('name', agentName)
    .single();

  if (error || !agentData) {
    throw new Error(`Agent ${agentName} not found`);
  }

  const config = parseJsonSafely(agentData.config);
  const agent = registry.createAgent(agentData.name, agentData.type, config);
  
  if (!agent) {
    throw new Error(`Failed to create agent ${agentName}`);
  }

  try {
    const suggestions = await agent.analyze(context);
    
    // Store suggestions in database
    for (const suggestion of suggestions) {
      await createSuggestion({
        agent_id: agentData.id,
        target_type: suggestion.target_type,
        target_id: suggestion.target_id || null,
        suggestion_data: suggestion.suggestion_data,
        reasoning: suggestion.reasoning,
        status: 'pending',
        confidence_score: suggestion.confidence_score,
        priority: suggestion.priority,
        expires_at: suggestion.expires_at?.toISOString() || null
      });
    }
  } catch (error) {
    console.error(`Error running agent ${agentName}:`, error);
    throw error;
  }
}

export async function runAllActiveAgents(): Promise<void> {
  const agents = await getActiveAgents();
  
  // Get articles for context
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published');

  const context: AgentAnalysisContext = {
    articles: articles || []
  };

  // Run each active agent
  for (const agent of agents) {
    try {
      await runAgent(agent.name, context);
      console.log(`Successfully ran agent: ${agent.name}`);
    } catch (error) {
      console.error(`Failed to run agent ${agent.name}:`, error);
      // Continue with other agents even if one fails
    }
  }
}
