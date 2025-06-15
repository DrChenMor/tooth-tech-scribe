
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Zap, RefreshCw } from 'lucide-react';
import { SystemHealth, PerformanceAlert, getSystemHealth, getActiveAlerts, getPerformanceHistory, startPerformanceMonitoring, resolveAlert } from '@/services/performanceMonitoring';
import { agentQueue } from '@/services/agentQueue';
import { agentCache } from '@/services/agentCache';
import { useToast } from '@/components/ui/use-toast';

const PerformanceDashboard = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState(agentQueue.getQueueStats());
  const [cacheStats, setCacheStats] = useState(agentCache.getStats());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPerformanceData();
    startPerformanceMonitoring();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      const [health, alertsData, historyData] = await Promise.all([
        getSystemHealth(),
        getActiveAlerts(),
        getPerformanceHistory('cpu', 2) // Last 2 hours
      ]);

      setSystemHealth(health);
      setAlerts(alertsData);
      
      // Format performance data for charts
      const chartData = historyData.reduce((acc: any[], metric) => {
        const time = new Date(metric.timestamp).toLocaleTimeString();
        const existing = acc.find(item => item.time === time);
        
        if (existing) {
          existing[metric.metric_type] = metric.value;
        } else {
          acc.push({
            time,
            [metric.metric_type]: metric.value
          });
        }
        
        return acc;
      }, []);

      setPerformanceData(chartData.slice(-20)); // Last 20 data points
      setQueueStats(agentQueue.getQueueStats());
      setCacheStats(agentCache.getStats());
      
    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: 'Alert Resolved',
        description: 'Alert has been marked as resolved'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: SystemHealth['overall_status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: SystemHealth['overall_status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Monitor system health and performance metrics</p>
        </div>
        <Button onClick={loadPerformanceData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(systemHealth.overall_status)}
              System Health
              <Badge variant={systemHealth.overall_status === 'healthy' ? 'default' : 'destructive'}>
                {systemHealth.overall_status.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>Overall system status and key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <Progress value={systemHealth.cpu_usage} className="h-2" />
                <span className="text-xs text-muted-foreground">{systemHealth.cpu_usage.toFixed(1)}%</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <Progress value={(systemHealth.memory_usage / 8192) * 100} className="h-2" />
                <span className="text-xs text-muted-foreground">{systemHealth.memory_usage.toFixed(0)} MB</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Response Time</span>
                </div>
                <div className="text-lg font-semibold">{systemHealth.avg_response_time.toFixed(0)}ms</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Active Agents</span>
                </div>
                <div className="text-lg font-semibold">{systemHealth.active_agents}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>CPU usage over the last 2 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Queue Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Execution Queue</CardTitle>
            <CardDescription>Current queue status and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{queueStats.pendingTasks}</div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{queueStats.processingTasks}</div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{queueStats.completedTasks}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{queueStats.avgProcessingTime}ms</div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>Agent result caching statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{cacheStats.size}</div>
                  <p className="text-sm text-muted-foreground">Cached Results</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(cacheStats.memoryUsage / 1024).toFixed(1)}KB</div>
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <Progress value={cacheStats.hitRate * 100} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>System alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;
