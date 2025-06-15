
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AgentPerformanceData {
  date: string;
  suggestions: number;
  approvals: number;
  approval_rate: number;
  confidence: number;
}

interface AgentPerformanceChartProps {
  data: AgentPerformanceData[];
  agentName: string;
  trend: 'improving' | 'declining' | 'stable';
}

const AgentPerformanceChart = ({ data, agentName, trend }: AgentPerformanceChartProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const latestData = data[data.length - 1];
  const avgApprovalRate = data.reduce((sum, d) => sum + d.approval_rate, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{agentName} Performance</CardTitle>
            <CardDescription>30-day performance trends and metrics</CardDescription>
          </div>
          <Badge variant="outline" className={getTrendColor()}>
            {getTrendIcon()}
            <span className="ml-1 capitalize">{trend}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{latestData?.suggestions || 0}</p>
            <p className="text-sm text-muted-foreground">Recent Suggestions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {latestData?.approval_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-muted-foreground">Approval Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {avgApprovalRate.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Avg Performance</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Suggestions & Approvals</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'suggestions' ? 'Suggestions' : 'Approvals'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="suggestions"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="approvals"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Approval Rate Trend</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Approval Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="approval_rate"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceChart;
