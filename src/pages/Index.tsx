
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/use-categories';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const Index = () => {
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!selectedCategory) return articles;
    return articles.filter(article => article.category === selectedCategory);
  }, [articles, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow">
          <div className="container mx-auto px-4">
            <div className="pt-12 pb-8 text-center">
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
            </div>
            {/* Category Filter Skeleton */}
            <div className="flex justify-center flex-wrap gap-2 mb-12">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
            </div>
            {/* Featured Article Skeleton */}
            <div className="max-w-4xl mx-auto mb-16">
              <Skeleton className="w-full h-[500px] rounded-lg" />
              <div className="text-center mt-6">
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-12 w-3/4 mx-auto mt-2" />
                <Skeleton className="h-20 w-2/3 mx-auto mt-4" />
                <div className="flex items-center justify-center mt-4">
                  <Skeleton className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </div>
                </div>
              </div>
            </div>
            {/* Article Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
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

  const featuredArticle = filteredArticles?.[0];
  const otherArticles = filteredArticles?.slice(1) || [];

  if (!featuredArticle) {
    return (
       <div className="flex flex-col flex-grow">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-2xl font-bold">No articles found {selectedCategory ? `in ${selectedCategory}` : ''}</h2>
            <p className="text-muted-foreground">
              {selectedCategory ? 'Try another category or clear the filter.' : 'Check back later for new content!'}
            </p>
            {selectedCategory && (
              <Button onClick={() => setSelectedCategory(null)} className="mt-4">
                Show All Articles
              </Button>
            )}
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
          {/* Hero Section */}
          <div className="pt-12 pb-8 text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight">Exploring the Future of Dentistry</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Your source for the latest in AI and Dentistry Technology, from industry news to groundbreaking research and clinical tools.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex justify-center flex-wrap gap-2 mb-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full px-6 py-2",
                !selectedCategory ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'
              )}
            >
              All Articles
            </Button>
            {isLoadingCategories ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)
            ) : (
              categories?.map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full px-6 py-2",
                    selectedCategory === category ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'
                  )}
                >
                  {category}
                </Button>
              ))
            )}
          </div>

          {/* Featured Article */}
          {featuredArticle && (
            <div className="max-w-4xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Link to={`/article/${featuredArticle.slug}`} className="group block">
                <div className="overflow-hidden rounded-lg mb-6">
                  <img 
                    src={featuredArticle.image_url || 'https://placehold.co/1280x720/EEE/BDBDBD?text=Denti-AI'} 
                    alt={featuredArticle.title} 
                    className="w-full h-[400px] md:h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out" 
                  />
                </div>
                <div className="text-center">
                  {featuredArticle.category && (
                    <Badge variant="outline" className="mb-4">{featuredArticle.category}</Badge>
                  )}
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground group-hover:text-primary transition-colors mb-4">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center justify-center">
                    <img 
                      src={featuredArticle.author_avatar_url || undefined} 
                      alt={featuredArticle.author_name || ''} 
                      className="w-12 h-12 rounded-full mr-4" 
                    />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{featuredArticle.author_name}</p>
                      <p className="text-muted-foreground">{format(new Date(featuredArticle.published_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Other Articles Grid */}
          {otherArticles.length > 0 && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-serif font-bold">More Articles</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {otherArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
