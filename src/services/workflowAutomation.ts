
import { supabase } from '@/integrations/supabase/client';
import { WorkflowNode } from '@/types/WorkflowTypes';
import { executeWorkflow } from './workflowExecution';
import type { Database } from '@/integrations/supabase/types';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  conditions: any[];
  actions: any[];
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_rate: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_rule_id: string;
  suggestion_id: string;
  started_at: string;
  completed_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
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

// Default workflow rules for content processing
const defaultRules: WorkflowRule[] = [
  {
    id: 'default-content-processing',
    name: 'Auto Content Processing',
    description: 'Automatically processes approved content queue items',
    enabled: true,
    priority: 1,
    conditions: [
      { field: 'status', operator: 'eq', value: 'approved' }
    ],
    actions: [
      { type: 'execute_workflow', config: { workflow_type: 'content_processing' } }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0,
    success_rate: 0
  }
];

const mockIntegrations: ExternalIntegration[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/...', channel: '#ai-copilot' },
    enabled: true,
    last_used: '2024-01-15T10:30:00Z',
    success_count: 45,
    error_count: 2
  }
];

// Workflow Rules Management
export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(rule => ({
      ...rule,
      conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
      actions: Array.isArray(rule.actions) ? rule.actions : []
    })) as WorkflowRule[];
  } catch (error) {
    console.error('Error fetching workflow rules:', error);
    return [];
  }
}

export async function createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_rate'>): Promise<WorkflowRule> {
  try {
    const { data, error } = await supabase
      .from('workflow_rules')
      .insert({
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as WorkflowRule;
  } catch (error) {
    console.error('Error creating workflow rule:', error);
    throw error;
  }
}

export async function updateWorkflowRule(id: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule> {
  try {
    const { data, error } = await supabase
      .from('workflow_rules')
      .update({
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        priority: updates.priority,
        conditions: updates.conditions,
        actions: updates.actions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as WorkflowRule;
  } catch (error) {
    console.error('Error updating workflow rule:', error);
    throw error;
  }
}

export async function deleteWorkflowRule(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('workflow_rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workflow rule:', error);
    throw error;
  }
}

export async function toggleWorkflowRule(id: string, enabled: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('workflow_rules')
      .update({ 
        enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error toggling workflow rule:', error);
    throw error;
  }
}

// Workflow Execution with multiple results handling
export async function executeWorkflowRule(ruleId: string, nodes: WorkflowNode[], triggerData?: any): Promise<WorkflowExecution[]> {
  console.log(`🚀 Executing workflow rule ${ruleId}`);
  
  try {
    // Execute the workflow with proper multiple results handling
    const executions = await executeWorkflow(ruleId, nodes, triggerData);
    
    // Update rule execution count
    const { data: currentRule } = await supabase
      .from('workflow_rules')
      .select('execution_count')
      .eq('id', ruleId)
      .single();
    
    if (currentRule) {
      await supabase
        .from('workflow_rules')
        .update({ 
          execution_count: (currentRule.execution_count || 0) + 1
        })
        .eq('id', ruleId);
    }
    
    console.log(`✅ Workflow rule executed successfully with ${executions.length} execution(s)`);
    return executions;
    
  } catch (error) {
    console.error('Workflow rule execution failed:', error);
    throw error;
  }
}

// Trigger workflow based on content queue events
export async function triggerContentQueueWorkflow(contentQueueItem: any): Promise<void> {
  console.log('🎯 Triggering content queue workflow for item:', contentQueueItem.id);
  
  try {
    // Find workflow rules that should be triggered by content queue events
    const { data: rules, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('enabled', true);
    
    if (error) throw error;
    
    for (const rule of rules || []) {
      // Check if rule conditions match the content queue item
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      const shouldTrigger = evaluateRuleConditions(conditions, contentQueueItem);
      
      if (shouldTrigger) {
        console.log(`🔥 Triggering workflow rule: ${rule.name}`);
        
        // Create a simple workflow with processing nodes
        const workflowNodes: WorkflowNode[] = [
          {
            id: 'trigger',
            type: 'trigger',
            label: 'Content Queue Trigger',
            position: { x: 0, y: 0 },
            config: {},
            connected: ['processor'],
            data: contentQueueItem
          },
          {
            id: 'processor',
            type: 'ai-processor',
            label: 'AI Content Processor',
            position: { x: 300, y: 0 },
            config: {
              prompt: 'Create a comprehensive article from this content',
              tone: 'professional',
              length: 'long'
            },
            connected: ['publisher'],
            data: {}
          },
          {
            id: 'publisher',
            type: 'publisher',
            label: 'Article Publisher',
            position: { x: 600, y: 0 },
            config: {
              category: contentQueueItem.source_type,
              autoPublish: false
            },
            connected: [],
            data: {}
          }
        ];
        
        await executeWorkflowRule(rule.id, workflowNodes, contentQueueItem);
      }
    }
  } catch (error) {
    console.error('Error triggering content queue workflow:', error);
  }
}

function evaluateRuleConditions(conditions: any[], item: any): boolean {
  if (!conditions.length) return true;
  
  return conditions.every(condition => {
    const fieldValue = item[condition.field];
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  });
}

async function processWorkflowActions(actions: any[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const action of actions) {
    switch (action.type) {
      case 'execute_workflow':
        results[action.type] = await executeWorkflowAction(action.config);
        break;
      case 'send_notification':
        results[action.type] = await sendNotificationAction(action.config);
        break;
      case 'update_queue_status':
        results[action.type] = await updateQueueStatusAction(action.config);
        break;
    }
  }

  return results;
}

async function executeWorkflowAction(config: Record<string, any>): Promise<any> {
  console.log('Executing workflow action with config:', config);
  return { success: true, workflow_id: 'workflow-' + Date.now() };
}

async function updateQueueStatusAction(config: Record<string, any>): Promise<any> {
  console.log('Updating queue status with config:', config);
  return { success: true, updated_items: config.items || [] };
}

async function sendNotificationAction(config: Record<string, any>): Promise<any> {
  // Implementation for sending notifications
  console.log('Sending notification with config:', config);
  return { success: true, message: 'Notification sent' };
}


// External Integrations
export async function getIntegrations(): Promise<ExternalIntegration[]> {
  return Promise.resolve([...mockIntegrations]);
}

export async function createIntegration(integration: Omit<ExternalIntegration, 'id' | 'success_count' | 'error_count'>): Promise<ExternalIntegration> {
  const newIntegration: ExternalIntegration = {
    ...integration,
    id: Date.now().toString(),
    success_count: 0,
    error_count: 0
  };
  
  mockIntegrations.push(newIntegration);
  return Promise.resolve(newIntegration);
}

export async function updateIntegration(id: string, updates: Partial<ExternalIntegration>): Promise<ExternalIntegration> {
  const integrationIndex = mockIntegrations.findIndex(i => i.id === id);
  if (integrationIndex === -1) throw new Error('Integration not found');
  
  mockIntegrations[integrationIndex] = { ...mockIntegrations[integrationIndex], ...updates };
  return Promise.resolve(mockIntegrations[integrationIndex]);
}

export async function testIntegration(id: string): Promise<{ success: boolean; message: string }> {
  const integration = mockIntegrations.find(i => i.id === id);
  if (!integration) throw new Error('Integration not found');
  
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
      integration.success_count += 1;
      integration.last_used = new Date().toISOString();
    } else {
      integration.error_count += 1;
    }

    return result;
  } catch (error) {
    integration.error_count += 1;
    throw error;
  }
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
  try {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .order('started_at', { ascending: false });
    
    if (ruleId) {
      query = query.eq('workflow_rule_id', ruleId);
    }
    
    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    return (data || []).map(execution => ({
      ...execution,
      workflow_rule_id: execution.workflow_rule_id,
      suggestion_id: execution.suggestion_id
    })) as WorkflowExecution[];
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    return [];
  }
}
