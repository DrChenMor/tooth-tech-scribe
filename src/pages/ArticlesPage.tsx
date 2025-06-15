
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

const fetchArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const ArticlesPage = () => {
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!searchQuery.trim()) return articles;
    
    const query = searchQuery.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query) ||
      article.author_name?.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow">
          <div className="container mx-auto px-4">
            <div className="pt-12 pb-8 text-center">
              <Skeleton className="h-12 w-64 mx-auto" />
            </div>
            
            {/* Search Bar Skeleton */}
            <div className="mb-12 max-w-md mx-auto">
              <Skeleton className="h-12 w-full" />
            </div>
            
            {/* Article Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="w-full h-56 rounded-lg" />
                  <div className="py-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full mt-2" />
                    <Skeleton className="h-16 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Failed to load articles</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="pt-12 pb-8 text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">All Articles</h1>
          </div>

          {/* Search Bar */}
          <div className="mb-12 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base bg-muted/50 border-border"
              />
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="mb-8 text-center text-muted-foreground">
              {filteredArticles.length === 0 
                ? `No articles found for "${searchQuery}"`
                : `${filteredArticles.length} article${filteredArticles.length === 1 ? '' : 's'} found for "${searchQuery}"`
              }
            </div>
          )}
          
          {/* Article Grid */}
          {filteredArticles.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          ) : !searchQuery ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold">No articles found</h2>
              <p className="text-muted-foreground">Check back later for new content!</p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlesPage;
