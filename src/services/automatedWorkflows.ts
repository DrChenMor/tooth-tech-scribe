import { supabase } from '@/integrations/supabase/client';

export interface AISuggestion {
  id: string;
  agent_id?: string;
  target_type: string;
  target_id?: string;
  suggestion_data: any;
  reasoning: string;
  status?: 'pending' | 'approved' | 'rejected' | 'implemented';
  confidence_score?: number;
  priority?: number;
  created_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  expires_at?: string;
  type?: string;
  title?: string;
  implemented_at?: string;
  implementation_notes?: string;
  review_notes?: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_rate: number;
}

export interface WorkflowCondition {
  type: 'confidence_threshold' | 'agent_type' | 'suggestion_type' | 'approval_history' | 'time_based';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains' | 'matches';
  value: any;
  field?: string;
}

export interface WorkflowAction {
  type: 'auto_approve' | 'auto_implement' | 'notify_admin' | 'schedule_review' | 'create_task';
  parameters: Record<string, any>;
  delay_minutes?: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_rule_id: string;
  suggestion_id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result: any;
  error_message?: string;
  workflow_rules?: { name: string };
  ai_suggestions?: { title: string; type: string };
}

export class AutomatedWorkflowService {
  static async createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_rate'>): Promise<WorkflowRule> {
    const { data, error } = await supabase
      .from('workflow_rules')
      .insert({
        name: rule.name,
        description: rule.description,
        conditions: rule.conditions as any,
        actions: rule.actions as any,
        enabled: rule.enabled,
        priority: rule.priority,
        execution_count: 0,
        success_rate: 0
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      conditions: data.conditions as WorkflowCondition[],
      actions: data.actions as WorkflowAction[]
    } as WorkflowRule;
  }

  static async getWorkflowRules(): Promise<WorkflowRule[]> {
    const { data, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(rule => ({
      ...rule,
      conditions: rule.conditions as WorkflowCondition[],
      actions: rule.actions as WorkflowAction[]
    })) as WorkflowRule[];
  }

  static async evaluateSuggestionForWorkflows(suggestion: AISuggestion): Promise<WorkflowExecution[]> {
    const rules = await this.getWorkflowRules();
    const applicableRules = rules.filter(rule => 
      rule.enabled && this.evaluateConditions(suggestion, rule.conditions)
    );

    const executions: WorkflowExecution[] = [];

    for (const rule of applicableRules) {
      try {
        const execution = await this.executeWorkflow(rule, suggestion);
        executions.push(execution);
      } catch (error) {
        console.error(`Failed to execute workflow ${rule.id}:`, error);
      }
    }

    return executions;
  }

  private static evaluateConditions(suggestion: AISuggestion, conditions: WorkflowCondition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'confidence_threshold':
          const confidence = suggestion.confidence_score || 0;
          return condition.operator === 'greater_than' 
            ? confidence > condition.value
            : confidence < condition.value;

        case 'agent_type':
          return condition.operator === 'equals' 
            ? suggestion.agent_id === condition.value
            : suggestion.agent_id !== condition.value;

        case 'suggestion_type':
          return condition.operator === 'equals'
            ? suggestion.type === condition.value
            : suggestion.type !== condition.value;

        case 'approval_history':
          // This would check historical approval rates for similar suggestions
          return true; // Simplified for now

        case 'time_based':
          const now = new Date();
          const suggestionTime = new Date(suggestion.created_at || '');
          const timeDiff = now.getTime() - suggestionTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          return condition.operator === 'greater_than'
            ? hoursDiff > condition.value
            : hoursDiff < condition.value;

        default:
          return false;
      }
    });
  }

  private static async executeWorkflow(rule: WorkflowRule, suggestion: AISuggestion): Promise<WorkflowExecution> {
    const execution = {
      workflow_rule_id: rule.id,
      suggestion_id: suggestion.id,
      status: 'pending' as const,
      started_at: new Date().toISOString(),
      result: {}
    };

    const { data: executionData, error } = await supabase
      .from('workflow_executions')
      .insert(execution)
      .select()
      .single();

    if (error) throw error;

    // Execute actions
    try {
      await this.updateExecutionStatus(executionData.id, 'executing');
      
      for (const action of rule.actions) {
        await this.executeAction(action, suggestion, executionData.id);
      }

      await this.updateExecutionStatus(executionData.id, 'completed', { 
        actions_executed: rule.actions.length 
      });

      // Update rule statistics
      await this.updateRuleStats(rule.id, true);

    } catch (error) {
      await this.updateExecutionStatus(executionData.id, 'failed', null, (error as Error).message);
      await this.updateRuleStats(rule.id, false);
      throw error;
    }

    return executionData as WorkflowExecution;
  }

  private static async executeAction(action: WorkflowAction, suggestion: AISuggestion, executionId: string): Promise<void> {
    if (action.delay_minutes && action.delay_minutes > 0) {
      // In a real implementation, you'd queue this for later execution
      console.log(`Action delayed by ${action.delay_minutes} minutes`);
    }

    switch (action.type) {
      case 'auto_approve':
        await supabase
          .from('ai_suggestions')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            review_notes: 'Auto-approved by workflow'
          })
          .eq('id', suggestion.id);
        break;

      case 'auto_implement':
        // This would contain the logic to actually implement the suggestion
        await this.implementSuggestion(suggestion);
        break;

      case 'notify_admin':
        await this.sendNotification({
          type: 'workflow_action',
          title: 'Workflow Action Required',
          message: `Suggestion "${suggestion.title || 'Untitled'}" requires admin attention`,
          suggestion_id: suggestion.id,
          execution_id: executionId
        });
        break;

      case 'schedule_review':
        const reviewDate = new Date();
        reviewDate.setMinutes(reviewDate.getMinutes() + (action.parameters.delay_minutes || 60));
        
        await supabase
          .from('scheduled_reviews')
          .insert({
            suggestion_id: suggestion.id,
            scheduled_for: reviewDate.toISOString(),
            review_type: action.parameters.review_type || 'standard'
          });
        break;

      case 'create_task':
        await supabase
          .from('admin_tasks')
          .insert({
            title: action.parameters.title || `Review suggestion: ${suggestion.title || 'Untitled'}`,
            description: action.parameters.description || suggestion.reasoning,
            priority: action.parameters.priority || 'medium',
            related_suggestion_id: suggestion.id,
            assigned_to: action.parameters.assigned_to,
            due_date: action.parameters.due_date
          });
        break;
    }
  }

  private static async implementSuggestion(suggestion: AISuggestion): Promise<void> {
    // This is where you'd implement the actual suggestion
    // For now, we'll just mark it as implemented
    await supabase
      .from('ai_suggestions')
      .update({ 
        status: 'implemented',
        implemented_at: new Date().toISOString(),
        implementation_notes: 'Auto-implemented by workflow'
      })
      .eq('id', suggestion.id);
  }

  private static async sendNotification(notification: {
    type: string;
    title: string;
    message: string;
    suggestion_id: string;
    execution_id: string;
  }): Promise<void> {
    await supabase
      .from('admin_notifications')
      .insert(notification);
  }

  private static async updateExecutionStatus(
    executionId: string, 
    status: WorkflowExecution['status'], 
    result: any = null, 
    errorMessage?: string
  ): Promise<void> {
    const updates: any = { status };
    
    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
    
    if (result) {
      updates.result = result;
    }
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await supabase
      .from('workflow_executions')
      .update(updates)
      .eq('id', executionId);
  }

  private static async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    const { data: rule } = await supabase
      .from('workflow_rules')
      .select('execution_count, success_rate')
      .eq('id', ruleId)
      .single();

    if (rule) {
      const newExecutionCount = rule.execution_count + 1;
      const currentSuccesses = Math.round(rule.success_rate * rule.execution_count / 100);
      const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
      const newSuccessRate = (newSuccesses / newExecutionCount) * 100;

      await supabase
        .from('workflow_rules')
        .update({
          execution_count: newExecutionCount,
          success_rate: newSuccessRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);
    }
  }

  static async getWorkflowExecutions(limit = 50): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow_rules(name),
        ai_suggestions(title, type)
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as WorkflowExecution[];
  }

  static async toggleWorkflowRule(ruleId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('workflow_rules')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', ruleId);

    if (error) throw error;
  }

  static async deleteWorkflowRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }
}
