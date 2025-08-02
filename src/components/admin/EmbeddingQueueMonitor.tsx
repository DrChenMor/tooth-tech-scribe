import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddingQueueItem {
  id: number;
  article_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
  retry_count: number;
  force_update: boolean;
  articles?: {
    title: string;
    status: string;
  };
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export const EmbeddingQueueMonitor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch queue items
  const { data: queueItems, isLoading, error } = useQuery({
    queryKey: ['embedding-queue'],
    queryFn: async (): Promise<EmbeddingQueueItem[]> => {
      const { data, error } = await supabase
        .from('embedding_queue')
        .select(`
          *,
          articles!inner(title, status)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return data || [];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Calculate queue statistics
  const queueStats: QueueStats = React.useMemo(() => {
    if (!queueItems) return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    
    return queueItems.reduce(
      (stats, item) => ({
        ...stats,
        [item.status]: stats[item.status] + 1,
        total: stats.total + 1,
      }),
      { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    );
  }, [queueItems]);

  // Process queue mutation
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-embedding-queue', {
        body: { batchSize: 5 }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Queue processed: ${data.processed} items completed, ${data.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['embedding-queue'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to process queue: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Manual trigger for specific article
  const triggerEmbeddingMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const { data, error } = await supabase.rpc('manual_trigger_embedding', {
        article_id_param: articleId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Embedding queued for article: ${data.articleTitle}`);
      queryClient.invalidateQueries({ queryKey: ['embedding-queue'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to queue embedding: ${error.message}`);
    }
  });

  const handleProcessQueue = () => {
    setIsProcessing(true);
    processQueueMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load embedding queue: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.processing}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {queueStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue Progress</CardTitle>
            <CardDescription>
              {queueStats.completed} of {queueStats.total} items completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(queueStats.completed / queueStats.total) * 100} 
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Queue Management</CardTitle>
          <CardDescription>
            Process pending embedding requests manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              onClick={handleProcessQueue}
              disabled={isProcessing || processQueueMutation.isPending || queueStats.pending === 0}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>
                {isProcessing ? 'Processing...' : `Process Queue (${queueStats.pending} pending)`}
              </span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['embedding-queue'] })}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Queue Items</CardTitle>
          <CardDescription>
            Latest embedding queue activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          ) : queueItems && queueItems.length > 0 ? (
            <div className="space-y-4">
              {queueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">
                        {item.articles?.title || `Article #${item.article_id}`}
                      </h4>
                      {item.force_update && (
                        <Badge variant="outline" className="text-xs">Force Update</Badge>
                      )}
                      {item.retry_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Retry {item.retry_count}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Article #{item.article_id} • Created {new Date(item.created_at).toLocaleString()}
                      {item.processed_at && (
                        <> • Processed {new Date(item.processed_at).toLocaleString()}</>
                      )}
                    </div>
                    {item.error_message && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {item.error_message}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.status)}
                    {item.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerEmbeddingMutation.mutate(item.article_id)}
                        disabled={triggerEmbeddingMutation.isPending}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No queue items found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};