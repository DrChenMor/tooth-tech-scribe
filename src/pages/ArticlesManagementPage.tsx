import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Eye, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteArticle, updateArticleStatus } from '@/services/articles';
import { toast } from '@/components/ui/use-toast';
import SocialPostModal from '@/components/SocialPostModal'; // (to be created)

const fetchArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const ArticlesManagementPage = () => {
  const queryClient = useQueryClient();
  
  // 🔥 NEW: State for bulk actions
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [selectedArticleForSocial, setSelectedArticleForSocial] = useState<Article | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'], // Use consistent key
    queryFn: fetchArticles,
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
  const allSelected = articles ? selectedArticles.length === articles.length && articles.length > 0 : false;
  const someSelected = selectedArticles.length > 0;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Articles Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage your articles and content.
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link to="/admin/editor">
            <Plus className="h-4 w-4" />
            Create Article
          </Link>
        </Button>
      </div>

      {/* 🔥 NEW: Bulk Action Bar */}
      {someSelected && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedArticles.length} article(s) selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedArticles([])}
                >
                  Clear Selection
                </Button>
              </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔥 NEW: Select All Controls */}
      {articles && articles.length > 0 && (
        <div className="flex items-center gap-2 py-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all articles"
          />
          <span className="text-sm text-muted-foreground">
            Select all articles
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className={selectedArticles.includes(article.id) ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* 🔥 NEW: Individual Article Checkbox */}
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onCheckedChange={(checked) => handleSelectArticle(article.id, checked as boolean)}
                      aria-label={`Select ${article.title}`}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className="text-xl hover:text-primary">
                        <Link to={`/article/${article.slug}`}>
                          {article.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {article.excerpt || 'No excerpt available'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(article.status)}>
                    {article.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>By {article.author_name || 'Unknown'}</span>
                    <span>{format(new Date(article.published_date), 'MMM d, yyyy')}</span>
                    {article.category && (
                      <Badge variant="secondary">{article.category}</Badge>
                    )}
                    <span>{article.views} views</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/article/${article.slug}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/editor/${article.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    {/* NEW: Create Social Post Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedArticleForSocial(article);
                        setSocialModalOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Create Social Post
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Social Post Modal (scaffold) */}
          <SocialPostModal
            open={socialModalOpen}
            article={selectedArticleForSocial}
            onClose={() => setSocialModalOpen(false)}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No Articles Found</CardTitle>
            <CardDescription className="text-center mb-6">
              Get started by creating your first article.
            </CardDescription>
            <Button asChild className="flex items-center gap-2">
              <Link to="/admin/editor">
                <Plus className="h-4 w-4" />
                Create Your First Article
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArticlesManagementPage;