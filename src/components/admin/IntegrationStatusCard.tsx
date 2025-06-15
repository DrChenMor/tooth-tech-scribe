
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface IntegrationStatus {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'oauth' | 'database';
  status: 'connected' | 'error' | 'warning' | 'disconnected';
  lastSync?: string;
  errorMessage?: string;
  endpoint?: string;
  requestCount: number;
  successRate: number;
}

interface IntegrationStatusCardProps {
  integration: IntegrationStatus;
  onRefresh: (id: string) => void;
  onConfigure: (id: string) => void;
}

const IntegrationStatusCard = ({ integration, onRefresh, onConfigure }: IntegrationStatusCardProps) => {
  const getStatusIcon = () => {
    switch (integration.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = () => {
    switch (integration.type) {
      case 'api':
        return '🔌';
      case 'webhook':
        return '🔗';
      case 'oauth':
        return '🔑';
      case 'database':
        return '🗄️';
      default:
        return '⚙️';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon()}</span>
            <CardTitle className="text-base">{integration.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant="outline" className={getStatusColor()}>
              {integration.status}
            </Badge>
          </div>
        </div>
        <CardDescription className="capitalize">
          {integration.type} Integration
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Requests</p>
              <p className="font-medium">{integration.requestCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-medium">{integration.successRate}%</p>
            </div>
          </div>

          {/* Last Sync */}
          {integration.lastSync && (
            <div className="text-sm">
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">
                {new Date(integration.lastSync).toLocaleString()}
              </p>
            </div>
          )}

          {/* Error Message */}
          {integration.errorMessage && (
            <div className="text-sm">
              <p className="text-red-600 font-medium">Error:</p>
              <p className="text-red-600 text-xs">{integration.errorMessage}</p>
            </div>
          )}

          {/* Endpoint */}
          {integration.endpoint && (
            <div className="text-sm">
              <p className="text-muted-foreground">Endpoint</p>
              <p className="font-mono text-xs truncate">{integration.endpoint}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRefresh(integration.id)}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConfigure(integration.id)}
              className="flex-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationStatusCard;
