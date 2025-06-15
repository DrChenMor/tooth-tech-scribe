
export interface QueuedTask {
  id: string;
  agentId: string;
  context: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  scheduledFor?: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface QueueStats {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgProcessingTime: number;
}

class AgentExecutionQueue {
  private queue: QueuedTask[] = [];
  private processing = new Map<string, QueuedTask>();
  private maxConcurrent: number = 3;
  private isProcessing: boolean = false;

  addTask(
    agentId: string,
    context: Record<string, any>,
    priority: QueuedTask['priority'] = 'medium',
    scheduledFor?: Date
  ): string {
    const task: QueuedTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      context,
      priority,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor?.toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending'
    };

    // Insert task based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      t => priorityOrder[t.priority] > priorityOrder[priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(insertIndex, 0, task);
    }

    this.startProcessing();
    return task.id;
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
      const task = this.getNextTask();
      if (!task) break;

      this.processTask(task);
    }

    this.isProcessing = false;
  }

  private getNextTask(): QueuedTask | null {
    const now = new Date();
    
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      
      // Check if task is scheduled for future
      if (task.scheduledFor && new Date(task.scheduledFor) > now) {
        continue;
      }

      // Remove from queue and return
      this.queue.splice(i, 1);
      return task;
    }

    return null;
  }

  private async processTask(task: QueuedTask): Promise<void> {
    task.status = 'processing';
    this.processing.set(task.id, task);

    try {
      console.log(`Processing agent task: ${task.agentId}`);
      
      // Simulate agent execution - replace with actual agent execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      task.status = 'completed';
      console.log(`Completed agent task: ${task.agentId}`);
      
    } catch (error) {
      console.error(`Failed to process agent task: ${task.agentId}`, error);
      
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        // Add back to queue with delay
        setTimeout(() => {
          this.queue.unshift(task);
          this.startProcessing();
        }, Math.pow(2, task.retryCount) * 1000); // Exponential backoff
      } else {
        task.status = 'failed';
      }
    } finally {
      this.processing.delete(task.id);
      this.startProcessing(); // Process next task
    }
  }

  getQueueStats(): QueueStats {
    const allTasks = [...this.queue, ...Array.from(this.processing.values())];
    
    return {
      totalTasks: allTasks.length,
      pendingTasks: this.queue.filter(t => t.status === 'pending').length,
      processingTasks: this.processing.size,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      avgProcessingTime: 1500 // Mock average
    };
  }

  getTaskStatus(taskId: string): QueuedTask | null {
    const queuedTask = this.queue.find(t => t.id === taskId);
    const processingTask = this.processing.get(taskId);
    return queuedTask || processingTask || null;
  }

  cancelTask(taskId: string): boolean {
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      return true;
    }
    return false;
  }

  setPriority(taskId: string, priority: QueuedTask['priority']): boolean {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.priority = priority;
      // Re-sort queue
      this.queue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      return true;
    }
    return false;
  }
}

export const agentQueue = new AgentExecutionQueue();
