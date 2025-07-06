import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, CheckCircle2, XCircle, Star, ExternalLink, 
  Search, Filter, Calendar, User, Settings, 
  MoreHorizontal, Eye, Trash2, Edit3, BookOpen,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ContentQueueItem {
  id: string;
  source_url: string;
  title: string;
  summary: string;
  content: string;
  source_type: string;
  keywords_used: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  priority_score: number;
  discovered_at: string;
  reviewed_at: string;
  reviewed_by: string;
  metadata: any;
}

const ContentQueuePage = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ContentQueueItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch content queue
  const { data: contentQueue, isLoading } = useQuery({
    queryKey: ['content-queue', searchQuery, statusFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('content_queue')
        .select('*')
        .order('priority_score', { ascending: false })
        .order('discovered_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'approved' | 'rejected' | 'processed');
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source_type', sourceFilter);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentQueueItem[];
    },
  });

  // Bulk update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemIds, status, notes }: { itemIds: string[]; status: 'pending' | 'approved' | 'rejected' | 'processed'; notes?: string }) => {
      const { error } = await supabase
        .from('content_queue')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          review_notes: notes 
        })
        .in('id', itemIds);
      
      if (error) throw error;

      // If approved, trigger workflow for each item
      if (status === 'approved') {
        const { data: items } = await supabase
          .from('content_queue')
          .select('*')
          .in('id', itemIds);
        
        if (items) {
          const { triggerContentQueueWorkflow } = await import('@/services/workflowAutomation');
          for (const item of items) {
            await triggerContentQueueWorkflow(item);
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      setSelectedItems([]);
      const statusText = variables.status === 'approved' ? 'approved and workflow triggered' : 'updated';
      toast({ title: `Status ${statusText} successfully` });
    },
    onError: () => {
      toast({ title: 'Error updating status', variant: 'destructive' });
    },
  });

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) return;
    
    let status: 'pending' | 'approved' | 'rejected' | 'processed';
    switch (action) {
      case 'approve':
        status = 'approved';
        break;
      case 'reject':
        status = 'rejected';
        break;
      default:
        return;
    }
    
    updateStatusMutation.mutate({ itemIds: selectedItems, status, notes: reviewNotes });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === contentQueue?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(contentQueue?.map(item => item.id) || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'research': return <BookOpen className="w-4 h-4" />;
      case 'news': return <AlertCircle className="w-4 h-4" />;
      case 'tech_news': return <TrendingUp className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading content queue...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Queue</h1>
          <p className="text-muted-foreground">Review and approve discovered content for article creation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {contentQueue?.filter(item => item.status === 'pending').length || 0} Pending Review
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="tech_news">Tech News</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder="Add review notes (optional)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-64 h-8"
                />
                <Button 
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  onClick={() => handleBulkAction('reject')}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.length === contentQueue?.length && contentQueue.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {contentQueue?.length || 0} items total
          </span>
        </div>

        {contentQueue?.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedItems([...selectedItems, item.id]);
                    } else {
                      setSelectedItems(selectedItems.filter(id => id !== item.id));
                    }
                  }}
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3" />
                        {item.priority_score?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {getSourceIcon(item.source_type)}
                      <span>{item.metadata?.source_name || 'Unknown Source'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.discovered_at).toLocaleDateString()}</span>
                    </div>
                    {item.keywords_used?.length > 0 && (
                      <div className="flex gap-1">
                        {item.keywords_used.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.source_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Source
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{item.title}</DialogTitle>
                            <DialogDescription>
                              Source: {item.metadata?.source_name} • Priority: {item.priority_score?.toFixed(1)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Summary</h4>
                              <p className="text-sm">{item.summary}</p>
                            </div>
                            {item.content && (
                              <div>
                                <h4 className="font-semibold mb-2">Content</h4>
                                <div className="text-sm prose max-w-none">
                                  {item.content}
                                </div>
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold mb-2">Metadata</h4>
                              <pre className="text-xs bg-muted p-3 rounded">
                                {JSON.stringify(item.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ itemIds: [item.id], status: 'approved' })}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ itemIds: [item.id], status: 'rejected' })}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!contentQueue?.length && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content in queue</h3>
                <p>Run your news discovery workflows to populate the content queue.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContentQueuePage;