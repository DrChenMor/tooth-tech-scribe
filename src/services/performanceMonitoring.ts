export interface PerformanceMetrics {
  id: string;
  timestamp: string;
  metric_type: 'cpu' | 'memory' | 'response_time' | 'throughput' | 'error_rate';
  value: number;
  unit: string;
  context?: Record<string, any>;
}

export interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  cpu_usage: number;
  memory_usage: number;
  avg_response_time: number;
  error_rate: number;
  active_agents: number;
  pending_suggestions: number;
  last_updated: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'system_error' | 'agent_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric_value?: number;
  threshold?: number;
  timestamp: string;
  resolved: boolean;
}

// Mock performance data - replace with real monitoring in production
let performanceHistory: PerformanceMetrics[] = [];
let currentAlerts: PerformanceAlert[] = [];

export async function collectPerformanceMetrics(): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Simulate collecting various performance metrics
  const metrics: PerformanceMetrics[] = [
    {
      id: `cpu-${Date.now()}`,
      timestamp,
      metric_type: 'cpu',
      value: Math.random() * 100,
      unit: 'percent'
    },
    {
      id: `memory-${Date.now()}`,
      timestamp,
      metric_type: 'memory',
      value: Math.random() * 8192,
      unit: 'MB'
    },
    {
      id: `response-${Date.now()}`,
      timestamp,
      metric_type: 'response_time',
      value: Math.random() * 1000 + 100,
      unit: 'ms'
    },
    {
      id: `throughput-${Date.now()}`,
      timestamp,
      metric_type: 'throughput',
      value: Math.random() * 100 + 10,
      unit: 'requests/min'
    }
  ];

  performanceHistory.push(...metrics);
  
  // Keep only last 1000 metrics
  if (performanceHistory.length > 1000) {
    performanceHistory = performanceHistory.slice(-1000);
  }

  // Check for performance alerts
  await checkPerformanceThresholds(metrics);
}

async function checkPerformanceThresholds(metrics: PerformanceMetrics[]): Promise<void> {
  const thresholds = {
    cpu: 80,
    memory: 6144, // 6GB
    response_time: 2000, // 2 seconds
    error_rate: 5 // 5%
  };

  for (const metric of metrics) {
    const threshold = thresholds[metric.metric_type as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      const alert: PerformanceAlert = {
        id: `alert-${Date.now()}`,
        type: 'threshold_exceeded',
        severity: metric.value > threshold * 1.5 ? 'critical' : 'high',
        message: `${metric.metric_type} usage is ${metric.value}${metric.unit}, exceeding threshold of ${threshold}${metric.unit}`,
        metric_value: metric.value,
        threshold,
        timestamp: new Date().toISOString(),
        resolved: false
      };
      
      currentAlerts.push(alert);
    }
  }
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const recentMetrics = performanceHistory.filter(m => 
    new Date(m.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  );

  const cpuMetrics = recentMetrics.filter(m => m.metric_type === 'cpu');
  const memoryMetrics = recentMetrics.filter(m => m.metric_type === 'memory');
  const responseTimeMetrics = recentMetrics.filter(m => m.metric_type === 'response_time');

  const avgCpu = cpuMetrics.length > 0 ? 
    cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length : 0;
  
  const avgMemory = memoryMetrics.length > 0 ? 
    memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length : 0;
  
  const avgResponseTime = responseTimeMetrics.length > 0 ? 
    responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length : 0;

  const errorRate = Math.random() * 2; // Mock error rate
  const activeAgents = Math.floor(Math.random() * 10) + 3;
  const pendingSuggestions = Math.floor(Math.random() * 50) + 5;

  let overallStatus: SystemHealth['overall_status'] = 'healthy';
  if (avgCpu > 80 || avgMemory > 6144 || avgResponseTime > 2000 || errorRate > 5) {
    overallStatus = 'critical';
  } else if (avgCpu > 60 || avgMemory > 4096 || avgResponseTime > 1000 || errorRate > 2) {
    overallStatus = 'warning';
  }

  return {
    overall_status: overallStatus,
    cpu_usage: avgCpu,
    memory_usage: avgMemory,
    avg_response_time: avgResponseTime,
    error_rate: errorRate,
    active_agents: activeAgents,
    pending_suggestions: pendingSuggestions,
    last_updated: new Date().toISOString()
  };
}

export async function getPerformanceHistory(
  metricType?: PerformanceMetrics['metric_type'],
  hours: number = 24
): Promise<PerformanceMetrics[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return performanceHistory.filter(metric => {
    const matchesType = !metricType || metric.metric_type === metricType;
    const withinTimeframe = new Date(metric.timestamp) > cutoff;
    return matchesType && withinTimeframe;
  });
}

export async function getActiveAlerts(): Promise<PerformanceAlert[]> {
  return currentAlerts.filter(alert => !alert.resolved);
}

export async function resolveAlert(alertId: string): Promise<void> {
  const alert = currentAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.resolved = true;
  }
}

export async function startPerformanceMonitoring(): Promise<void> {
  // Collect metrics every 30 seconds
  setInterval(collectPerformanceMetrics, 30000);
  console.log('Performance monitoring started');
}
