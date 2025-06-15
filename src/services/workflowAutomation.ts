
// Mock service for workflow automation - until database tables are created
// This provides the same interface but uses mock data instead of database calls

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
    type: 'create_agent' | 'send_notification' | 'update_config' | 'run_analysis';    config: Record<string, any>;
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

// Mock data storage
const mockRules: WorkflowRule[] = [
  {
    id: '1',
    name: 'Auto-Create Performance Agent',
    description: 'Creates a new performance monitoring agent when suggestion volume is high',
    trigger_type: 'condition',
    trigger_config: { threshold: 100, timeframe: '1h' },
    conditions: [
      { field: 'suggestion_count', operator: 'gt', value: 100 }
    ],
    actions: [
      { type: 'create_agent', config: { type: 'performance-monitor', priority: 'high' } }
    ],
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    last_executed: '2024-01-15T10:30:00Z',
    execution_count: 15
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
  // Return mock data instead of database call
  return Promise.resolve([...mockRules]);
}

export async function createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at' | 'execution_count'>): Promise<WorkflowRule> {
  const newRule: WorkflowRule = {
    ...rule,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0
  };
  
  mockRules.push(newRule);
  return Promise.resolve(newRule);
}

export async function updateWorkflowRule(id: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule> {
  const ruleIndex = mockRules.findIndex(r => r.id === id);
  if (ruleIndex === -1) throw new Error('Rule not found');
  
  mockRules[ruleIndex] = {
    ...mockRules[ruleIndex],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return Promise.resolve(mockRules[ruleIndex]);
}

export async function deleteWorkflowRule(id: string): Promise<void> {
  const ruleIndex = mockRules.findIndex(r => r.id === id);
  if (ruleIndex === -1) throw new Error('Rule not found');
  
  mockRules.splice(ruleIndex, 1);
  return Promise.resolve();
}

export async function toggleWorkflowRule(id: string, enabled: boolean): Promise<void> {
  const rule = mockRules.find(r => r.id === id);
  if (!rule) throw new Error('Rule not found');
  
  rule.enabled = enabled;
  rule.updated_at = new Date().toISOString();
  return Promise.resolve();
}

// Workflow Execution
export async function executeWorkflowRule(ruleId: string): Promise<WorkflowExecution> {
  const rule = mockRules.find(r => r.id === ruleId);
  if (!rule) throw new Error('Rule not found');

  const execution: WorkflowExecution = {
    id: Date.now().toString(),
    rule_id: ruleId,
    started_at: new Date().toISOString(),
    status: 'running'
  };

  // Simulate workflow execution
  try {
    const result = await processWorkflowActions(rule.actions);
    
    // Update execution as completed
    execution.completed_at = new Date().toISOString();
    execution.status = 'completed';
    execution.result = result;

    // Increment execution count
    rule.execution_count += 1;
    rule.last_executed = new Date().toISOString();

    return execution;
  } catch (error) {
    // Update execution as failed
    execution.completed_at = new Date().toISOString();
    execution.status = 'failed';
    execution.error_message = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
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
  // Mock execution history
  const mockExecutions: WorkflowExecution[] = [
    {
      id: '1',
      rule_id: '1',
      started_at: '2024-01-15T10:30:00Z',
      completed_at: '2024-01-15T10:31:00Z',
      status: 'completed',
      result: { success: true, agent_id: 'agent-123' }
    }
  ];

  if (ruleId) {
    return Promise.resolve(mockExecutions.filter(e => e.rule_id === ruleId));
  }

  return Promise.resolve(mockExecutions);
}
