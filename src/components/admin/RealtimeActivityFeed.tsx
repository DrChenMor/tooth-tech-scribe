
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, FileText, TrendingUp, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ActivityEvent {
  id: string;
  type: 'suggestion_created' | 'suggestion_updated' | 'agent_run';
  timestamp: string;
  data: any;
  icon: React.ReactNode;
  color: string;
}

const RealtimeActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);

    // Subscribe to AI suggestions changes
    const suggestionsChannel = supabase
      .channel('activity-feed-suggestions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          const newActivity: ActivityEvent = {
            id: `suggestion-${payload.new.id}`,
            type: 'suggestion_created',
            timestamp: new Date().toISOString(),
            data: payload.new,
            icon: <Brain className="h-4 w-4" />,
            color: 'bg-blue-500'
          };
          
          setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep only last 50 activities
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          const isStatusChange = payload.old.status !== payload.new.status;
          if (isStatusChange) {
            const newActivity: ActivityEvent = {
              id: `suggestion-update-${payload.new.id}-${Date.now()}`,
              type: 'suggestion_updated',
              timestamp: new Date().toISOString(),
              data: { ...payload.new, old_status: payload.old.status },
              icon: payload.new.status === 'approved' ? 
                <CheckCircle className="h-4 w-4" /> : 
                payload.new.status === 'rejected' ?
                <XCircle className="h-4 w-4" /> :
                <FileText className="h-4 w-4" />,
              color: payload.new.status === 'approved' ? 
                'bg-green-500' : 
                payload.new.status === 'rejected' ?
                'bg-red-500' :
                'bg-yellow-500'
            };
            
            setActivities(prev => [newActivity, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(suggestionsChannel);
      setIsConnected(false);
    };
  }, []);

  const getActivityDescription = (activity: ActivityEvent): string => {
    switch (activity.type) {
      case 'suggestion_created':
        return `New ${activity.data.target_type} suggestion created`;
      case 'suggestion_updated':
        return `Suggestion ${activity.data.old_status} → ${activity.data.status}`;
      case 'agent_run':
        return `Agent analysis completed`;
      default:
        return 'Unknown activity';
    }
  };

  const getActivityDetails = (activity: ActivityEvent): string => {
    switch (activity.type) {
      case 'suggestion_created':
        return activity.data.reasoning?.substring(0, 100) + '...' || 'No details available';
      case 'suggestion_updated':
        return `Priority: ${activity.data.priority || 'N/A'} | Confidence: ${Math.round((activity.data.confidence_score || 0) * 100)}%`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity Feed
            </CardTitle>
            <CardDescription>
              Live updates from AI agents and suggestion processing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for activity...</p>
                <p className="text-xs">AI suggestions and updates will appear here in real-time</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className={`p-2 rounded-full ${activity.color} text-white flex-shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">
                        {getActivityDescription(activity)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getActivityDetails(activity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealtimeActivityFeed;
