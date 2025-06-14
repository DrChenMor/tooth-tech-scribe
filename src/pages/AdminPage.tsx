import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useState } from 'react';

const fetchAllArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const updateArticleStatus = async ({ id, status }: { id: number; status: ArticleStatus }) => {
  const { error } = await supabase
    .from('articles')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
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

  const mutation = useMutation({
    mutationFn: updateArticleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    },
    onSettled: () => setMutating(null),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
                    <TableCell>
                      {article.status !== "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={mutating === article.id}
                          onClick={() => {
                            setMutating(article.id);
                            mutation.mutate({ id: article.id, status: "published" });
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
                            mutation.mutate({ id: article.id, status: "draft" });
                          }}
                        >
                          Unpublish
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={mutating === article.id || article.status === "archived"}
                        className="ml-2"
                        onClick={() => {
                          setMutating(article.id);
                          mutation.mutate({ id: article.id, status: "archived" });
                        }}
                      >
                        Archive
                      </Button>
                      {/* Future: Add Edit button here */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
