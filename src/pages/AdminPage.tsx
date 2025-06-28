import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteArticle, updateArticleStatus } from '@/services/articles';
import { toast } from '@/components/ui/use-toast';
import DeleteArticleDialog from '@/components/admin/DeleteArticleDialog';
import { Checkbox } from '@/components/ui/checkbox';

const fetchAllArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const statusColor = (status: ArticleStatus) => {
  if (status === 'draft') return 'bg-gray-200 text-gray-800';
  if (status === 'published') return 'bg-green-200 text-green-800';
  if (status === 'archived') return 'bg-yellow-100 text-yellow-800';
  return '';
};

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [mutating, setMutating] = useState<number | null>(null);
  
  // 🔥 NEW: State for bulk actions
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['articles'],
    queryFn: fetchAllArticles,
  });

  // 🔥 NEW: Handle selecting/deselecting individual articles
  const handleSelectArticle = (articleId: number, checked: boolean) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, articleId]);
    } else {
      setSelectedArticles(prev => prev.filter(id => id !== articleId));
    }
  };

  // 🔥 NEW: Handle selecting/deselecting all articles
  const handleSelectAll = (checked: boolean) => {
    if (checked && articles) {
      setSelectedArticles(articles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  // 🔥 NEW: Check if all articles are selected
  const allSelected = articles ? selectedArticles.length === articles.length : false;
  const someSelected = selectedArticles.length > 0;

  const statusMutation = useMutation({
    mutationFn: updateArticleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onSettled: () => setMutating(null),
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      toast({ title: "Article deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting article",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🔥 NEW: Bulk operations
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedArticles.length === 0) {
      toast({
        title: "No articles selected",
        description: "Please select articles first",
        variant: "destructive",
      });
      return;
    }

    setIsBulkProcessing(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const articleId of selectedArticles) {
        try {
          if (action === 'delete') {
            await deleteArticle(articleId);
          } else if (action === 'publish') {
            await updateArticleStatus({ id: articleId, status: 'published' });
          } else if (action === 'unpublish') {
            await updateArticleStatus({ id: articleId, status: 'draft' });
          }
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to ${action} article ${articleId}:`, error);
        }
      }

      // Show result
      const actionPastTense = action === 'delete' ? 'deleted' : action === 'publish' ? 'published' : 'unpublished';
      
      if (successCount > 0) {
        toast({
          title: `Bulk action completed`,
          description: `Successfully ${actionPastTense} ${successCount} article(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: "Bulk action failed",
          description: `Failed to ${action} ${failCount} article(s)`,
          variant: "destructive",
        });
      }

      // Clear selection and refresh data
      setSelectedArticles([]);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });

    } catch (error) {
      toast({
        title: "Bulk action failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link to="/admin/editor">Create New Article</Link>
        </Button>
      </div>
      <p className="mt-2 text-muted-foreground">Manage all articles below. (Drafts, Published, Archived)</p>

      {/* 🔥 NEW: Bulk Action Bar */}
      {someSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedArticles.length} article(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('publish')}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? 'Processing...' : 'Publish Selected'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('unpublish')}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? 'Processing...' : 'Unpublish Selected'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? 'Processing...' : 'Delete Selected'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedArticles([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-background p-4 rounded-xl shadow">
        {isLoading ? (
          <Skeleton className="h-12 w-full rounded mb-2" />
        ) : isError ? (
          <div className="text-destructive">Failed to load articles.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  {/* 🔥 NEW: Select All Checkbox */}
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all articles"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles?.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    {/* 🔥 NEW: Individual Article Checkbox */}
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onCheckedChange={(checked) => handleSelectArticle(article.id, checked as boolean)}
                      aria-label={`Select ${article.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{article.title}</div>
                    <div className="text-xs text-muted-foreground">{article.slug}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(article.status)}`}>
                      {article.status}
                    </span>
                  </TableCell>
                  <TableCell>{article.category}</TableCell>
                  <TableCell>
                    {article.status === "published"
                      ? format(new Date(article.published_date), "yyyy-MM-dd")
                      : <span className="text-xs text-muted-foreground">Not published</span>}
                  </TableCell>
                  <TableCell className="flex items-center space-x-2">
                    {article.status !== "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutating === article.id}
                        onClick={() => {
                          setMutating(article.id);
                          statusMutation.mutate({ id: article.id, status: "published" });
                        }}
                      >
                        Publish
                      </Button>
                    )}
                    {article.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutating === article.id}
                        onClick={() => {
                          setMutating(article.id);
                          statusMutation.mutate({ id: article.id, status: "draft" });
                        }}
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/editor/${article.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    {article.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mutating === article.id}
                        onClick={() => {
                          setMutating(article.id);
                          statusMutation.mutate({ id: article.id, status: "archived" });
                        }}
                      >
                        Archive
                      </Button>
                    )}
                    <DeleteArticleDialog
                      onDelete={() => deleteMutation.mutate(article.id)}
                      isPending={deleteMutation.isPending && deleteMutation.variables === article.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
};

export default AdminPage;