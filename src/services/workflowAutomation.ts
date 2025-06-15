
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'schedule' | 'event' | 'condition';
  trigger_config: Record<string, any>;
  conditions: Array<{
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
  }>;
  actions: Array<{
    type: 'create_agent' | 'send_notification' | 'update_config' | 'run_analysis';
    config: Record<string, any>;
  }>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_executed?: string;
  execution_count: number;
}

export interface WorkflowExecution {
  id: string;
  rule_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  result?: Record<string, any>;
  error_message?: string;
}

export interface ExternalIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'slack' | 'zapier' | 'api';
  config: Record<string, any>;
  enabled: boolean;
  last_used?: string;
  success_count: number;
  error_count: number;
}

// Workflow Rules Management
export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at' | 'execution_count'>): Promise<WorkflowRule> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .insert([{
      ...rule,
      execution_count: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkflowRule(id: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkflowRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleWorkflowRule(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('workflow_rules')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Workflow Execution
export async function executeWorkflowRule(ruleId: string): Promise<WorkflowExecution> {
  const execution = {
    rule_id: ruleId,
    started_at: new Date().toISOString(),
    status: 'running' as const
  };

  const { data, error } = await supabase
    .from('workflow_executions')
    .insert([execution])
    .select()
    .single();

  if (error) throw error;

  // Simulate workflow execution (replace with actual implementation)
  try {
    const rule = await getWorkflowRule(ruleId);
    const result = await processWorkflowActions(rule.actions);
    
    // Update execution as completed
    const { data: completedExecution, error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        result
      })
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Increment execution count
    await supabase
      .from('workflow_rules')
      .update({
        execution_count: rule.execution_count + 1,
        last_executed: new Date().toISOString()
      })
      .eq('id', ruleId);

    return completedExecution;
  } catch (error) {
    // Update execution as failed
    await supabase
      .from('workflow_executions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', data.id);

    throw error;
  }
}

async function getWorkflowRule(id: string): Promise<WorkflowRule> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function processWorkflowActions(actions: WorkflowRule['actions']): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const action of actions) {
    switch (action.type) {
      case 'create_agent':
        results[action.type] = await createAgentAction(action.config);
        break;
      case 'send_notification':
        results[action.type] = await sendNotificationAction(action.config);
        break;
      case 'update_config':
        results[action.type] = await updateConfigAction(action.config);
        break;
      case 'run_analysis':
        results[action.type] = await runAnalysisAction(action.config);
        break;
    }
  }

  return results;
}

async function createAgentAction(config: Record<string, any>): Promise<any> {
  // Implementation for creating an agent
  console.log('Creating agent with config:', config);
  return { success: true, agent_id: 'new-agent-id' };
}

async function sendNotificationAction(config: Record<string, any>): Promise<any> {
  // Implementation for sending notifications
  console.log('Sending notification with config:', config);
  return { success: true, message: 'Notification sent' };
}

async function updateConfigAction(config: Record<string, any>): Promise<any> {
  // Implementation for updating configuration
  console.log('Updating config:', config);
  return { success: true, updated_fields: Object.keys(config) };
}

async function runAnalysisAction(config: Record<string, any>): Promise<any> {
  // Implementation for running analysis
  console.log('Running analysis with config:', config);
  return { success: true, analysis_id: 'analysis-' + Date.now() };
}

// External Integrations
export async function getIntegrations(): Promise<ExternalIntegration[]> {
  const { data, error } = await supabase
    .from('external_integrations')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createIntegration(integration: Omit<ExternalIntegration, 'id' | 'success_count' | 'error_count'>): Promise<ExternalIntegration> {
  const { data, error } = await supabase
    .from('external_integrations')
    .insert([{
      ...integration,
      success_count: 0,
      error_count: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIntegration(id: string, updates: Partial<ExternalIntegration>): Promise<ExternalIntegration> {
  const { data, error } = await supabase
    .from('external_integrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function testIntegration(id: string): Promise<{ success: boolean; message: string }> {
  const integration = await getIntegration(id);
  
  try {
    let result: { success: boolean; message: string };
    
    switch (integration.type) {
      case 'webhook':
        result = await testWebhook(integration.config.url);
        break;
      case 'email':
        result = await testEmail(integration.config);
        break;
      case 'slack':
        result = await testSlack(integration.config);
        break;
      case 'zapier':
        result = await testZapier(integration.config);
        break;
      default:
        result = { success: false, message: 'Unknown integration type' };
    }

    // Update success/error counts
    if (result.success) {
      await supabase
        .from('external_integrations')
        .update({
          success_count: integration.success_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', id);
    } else {
      await supabase
        .from('external_integrations')
        .update({ error_count: integration.error_count + 1 })
        .eq('id', id);
    }

    return result;
  } catch (error) {
    await supabase
      .from('external_integrations')
      .update({ error_count: integration.error_count + 1 })
      .eq('id', id);
    
    throw error;
  }
}

async function getIntegration(id: string): Promise<ExternalIntegration> {
  const { data, error } = await supabase
    .from('external_integrations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function testWebhook(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
    });
    
    return {
      success: response.ok,
      message: response.ok ? 'Webhook test successful' : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Webhook test failed'
    };
  }
}

async function testEmail(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
  // Mock email test - replace with actual implementation
  return { success: true, message: 'Email configuration valid' };
}

async function testSlack(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
  // Mock Slack test - replace with actual implementation
  return { success: true, message: 'Slack webhook valid' };
}

async function testZapier(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
  // Mock Zapier test - replace with actual implementation
  return { success: true, message: 'Zapier webhook valid' };
}

// Workflow Execution History
export async function getWorkflowExecutions(ruleId?: string): Promise<WorkflowExecution[]> {
  let query = supabase
    .from('workflow_executions')
    .select('*')
    .order('started_at', { ascending: false });

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error } = await query.limit(100);

  if (error) throw error;
  return data || [];
}
