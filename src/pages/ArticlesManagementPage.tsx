
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Eye, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const fetchArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const ArticlesManagementPage = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'], // Use consistent key
    queryFn: fetchArticles,
  });

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
            <Card key={article.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
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
