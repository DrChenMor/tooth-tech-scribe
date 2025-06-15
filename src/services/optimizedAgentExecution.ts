
import { runAgent, AIAgent, fetchAIAgents } from './aiAgents';
import { agentCache } from './agentCache';
import { agentQueue } from './agentQueue';
import { notificationService } from './realtimeNotifications';
import { AgentAnalysisContext } from '@/lib/agents/BaseAgent';

export interface OptimizedExecutionOptions {
  useCache?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  scheduledFor?: Date;
  batchSize?: number;
  parallelExecution?: boolean;
}

export interface ExecutionResult {
  agentId: string;
  success: boolean;
  executionTime: number;
  cached: boolean;
  suggestions: any[];
  error?: string;
}

export interface BatchExecutionResult {
  totalAgents: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalSuggestions: number;
  avgExecutionTime: number;
  results: ExecutionResult[];
}

export async function executeAgentOptimized(
  agent: AIAgent,
  context: AgentAnalysisContext,
  options: OptimizedExecutionOptions = {}
): Promise<ExecutionResult> {
  const {
    useCache = true,
    priority = 'medium'
  } = options;

  const startTime = Date.now();
  
  try {
    // Check cache first if enabled
    if (useCache) {
      const cacheKey = agentCache.generateKey(agent.id, context);
      const cachedResult = agentCache.get(cacheKey);
      
      if (cachedResult) {
        notificationService.addSystemNotification(
          'Cache Hit',
          `Agent ${agent.name} result served from cache`,
          'info'
        );
        
        return {
          agentId: agent.id,
          success: true,
          executionTime: Date.now() - startTime,
          cached: true,
          suggestions: cachedResult.suggestions
        };
      }
    }

    // Execute agent
    const suggestions: any[] = [];
    await runAgent(agent.name, context);
    
    const executionTime = Date.now() - startTime;
    
    // Cache result if enabled
    if (useCache) {
      const cacheKey = agentCache.generateKey(agent.id, context);
      agentCache.set(cacheKey, {
        agentId: agent.id,
        suggestions,
        executionTime,
        timestamp: new Date().toISOString(),
        context
      });
    }

    // Send notification for successful execution
    notificationService.addSystemNotification(
      'Agent Executed',
      `Agent ${agent.name} completed successfully with ${suggestions.length} suggestions`,
      'success'
    );

    return {
      agentId: agent.id,
      success: true,
      executionTime,
      cached: false,
      suggestions
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send error notification
    notificationService.addSystemNotification(
      'Agent Execution Failed',
      `Agent ${agent.name} failed: ${errorMessage}`,
      'error'
    );

    return {
      agentId: agent.id,
      success: false,
      executionTime,
      cached: false,
      suggestions: [],
      error: errorMessage
    };
  }
}

export async function executeAgentsInBatch(
  agents: AIAgent[],
  context: AgentAnalysisContext,
  options: OptimizedExecutionOptions = {}
): Promise<BatchExecutionResult> {
  const {
    batchSize = 3,
    parallelExecution = true,
    priority = 'medium'
  } = options;

  const startTime = Date.now();
  const results: ExecutionResult[] = [];
  
  if (parallelExecution) {
    // Execute agents in parallel batches
    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize);
      const batchPromises = batch.map(agent => 
        executeAgentOptimized(agent, context, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch execution error:', result.reason);
        }
      });
    }
  } else {
    // Execute agents sequentially
    for (const agent of agents) {
      const result = await executeAgentOptimized(agent, context, options);
      results.push(result);
    }
  }

  const successfulExecutions = results.filter(r => r.success).length;
  const failedExecutions = results.filter(r => !r.success).length;
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;

  const batchResult: BatchExecutionResult = {
    totalAgents: agents.length,
    successfulExecutions,
    failedExecutions,
    totalSuggestions,
    avgExecutionTime,
    results
  };

  // Send batch completion notification
  notificationService.addSystemNotification(
    'Batch Execution Complete',
    `Executed ${agents.length} agents: ${successfulExecutions} successful, ${failedExecutions} failed`,
    successfulExecutions === agents.length ? 'success' : 'warning'
  );

  return batchResult;
}

export async function scheduleAgentExecution(
  agentId: string,
  context: AgentAnalysisContext,
  scheduledFor: Date,
  options: OptimizedExecutionOptions = {}
): Promise<string> {
  const taskId = agentQueue.addTask(
    agentId,
    context,
    options.priority || 'medium',
    scheduledFor
  );

  notificationService.addSystemNotification(
    'Agent Scheduled',
    `Agent execution scheduled for ${scheduledFor.toLocaleString()}`,
    'info'
  );

  return taskId;
}

export async function executeAllActiveAgentsOptimized(
  options: OptimizedExecutionOptions = {}
): Promise<BatchExecutionResult> {
  const agents = await fetchAIAgents();
  const activeAgents = agents.filter(agent => agent.is_active);

  if (activeAgents.length === 0) {
    return {
      totalAgents: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalSuggestions: 0,
      avgExecutionTime: 0,
      results: []
    };
  }

  // Mock context - in production, this would come from real data
  const context: AgentAnalysisContext = {
    articles: [] // Would be populated with actual articles
  };

  return executeAgentsInBatch(activeAgents, context, {
    ...options,
    parallelExecution: true,
    batchSize: 3
  });
}

export function getExecutionStats() {
  return {
    queue: agentQueue.getQueueStats(),
    cache: agentCache.getStats()
  };
}
