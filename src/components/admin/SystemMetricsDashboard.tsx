
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Brain, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemMetrics {
  totalSuggestions: number;
  approvedSuggestions: number;
  pendingSuggestions: number;
  rejectedSuggestions: number;
  averageProcessingTime: number;
  systemUptime: number;
  agentDistribution: Array<{ name: string; count: number; color: string }>;
  hourlyActivity: Array<{ hour: string; suggestions: number; approvals: number }>;
}

interface SystemMetricsDashboardProps {
  metrics: SystemMetrics;
}

const SystemMetricsDashboard = ({ metrics }: SystemMetricsDashboardProps) => {
  const statusData = [
    { name: 'Approved', value: metrics.approvedSuggestions, color: '#10b981' },
    { name: 'Pending', value: metrics.pendingSuggestions, color: '#f59e0b' },
    { name: 'Rejected', value: metrics.rejectedSuggestions, color: '#ef4444' },
  ];

  const approvalRate = metrics.totalSuggestions > 0 
    ? (metrics.approvedSuggestions / metrics.totalSuggestions * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSuggestions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Quality score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">Per suggestion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestion Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Suggestion Status Distribution</CardTitle>
            <CardDescription>Breakdown of suggestion outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Activity Distribution</CardTitle>
            <CardDescription>Suggestions generated by each agent type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.agentDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Activity Pattern</CardTitle>
          <CardDescription>Suggestion generation and approval patterns throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="suggestions" fill="#3b82f6" name="Suggestions" />
              <Bar dataKey="approvals" fill="#10b981" name="Approvals" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetricsDashboard;
