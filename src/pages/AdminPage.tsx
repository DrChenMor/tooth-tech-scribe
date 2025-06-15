import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { deleteArticle, updateArticleStatus } from '@/services/articles';
import { toast } from '@/components/ui/use-toast';
import DeleteArticleDialog from '@/components/admin/DeleteArticleDialog';

const fetchAllArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false });
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

  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['all-articles'],
    queryFn: fetchAllArticles,
  });

  const statusMutation = useMutation({
    mutationFn: updateArticleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    },
    onSettled: () => setMutating(null),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      toast({ title: "Article deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting article",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link to="/admin/editor">Create New Article</Link>
        </Button>
      </div>
      <p className="mt-2 text-muted-foreground">Manage all articles below. (Drafts, Published, Archived)</p>

      <div className="mt-6 bg-background p-4 rounded-xl shadow">
        {isLoading ? (
          <Skeleton className="h-12 w-full rounded mb-2" />
        ) : isError ? (
          <div className="text-destructive">Failed to load articles.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
