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
import { useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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

  const autoplayPlugin = useRef(
    Autoplay({ delay: 13000, stopOnInteraction: true })
  );

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
            <div className="pt-12 pb-16 text-center">
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
            </div>
            {/* Featured Article Skeleton */}
            <div className="mb-16 md:grid md:grid-cols-2 gap-8 items-center">
              <Skeleton className="w-full h-[400px] rounded-lg" />
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full mt-2" />
                <Skeleton className="h-20 w-full mt-4" />
                <div className="flex items-center mt-4">
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

  const heroArticles = filteredArticles?.slice(0, 3) || [];
  const otherArticles = filteredArticles?.slice(3) || [];

  if (!filteredArticles || filteredArticles.length === 0) {
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
          <div className="pt-12 pb-16 text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight">Exploring the Future of Dentistry</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Your source for the latest in AI and Dentistry Technology, from industry news to groundbreaking research and clinical tools.
            </p>
          </div>

          {/* Hero Articles Carousel */}
          {heroArticles.length > 0 && (
            <div className="mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full"
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.reset}
                opts={{
                  loop: true,
                }}
              >
                <CarouselContent>
                  {heroArticles.map((article) => (
                    <CarouselItem key={article.id}>
                      <Link to={`/article/${article.slug}`} className="group block md:grid md:grid-cols-2 gap-8 items-center">
                        <div className="overflow-hidden rounded-lg aspect-video mb-4 md:mb-0">
                          <img src={article.image_url || 'https://placehold.co/1280x720/EEE/BDBDBD?text=Denti-AI'} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out" />
                        </div>
                        <div>
                          {article.category && <Badge variant="outline">{article.category}</Badge>}
                          <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 text-foreground group-hover:text-primary transition-colors">{article.title}</h2>
                          <p className="mt-4 text-muted-foreground">{article.excerpt}</p>
                           <div className="flex items-center mt-4">
                            <img src={article.author_avatar_url || undefined} alt={article.author_name || ''} className="w-10 h-10 rounded-full mr-3" />
                            <div className="text-sm">
                              <p className="font-semibold text-foreground">{article.author_name}</p>
                              <p className="text-muted-foreground">{format(new Date(article.published_date), 'MMMM d, yyyy')}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          )}
          
          {/* Category Filters */}
          <div className="flex justify-center flex-wrap gap-2 mb-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full",
                !selectedCategory ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'
              )}
            >
              All
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
                    "rounded-full",
                    selectedCategory === category ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'
                  )}
                >
                  {category}
                </Button>
              ))
            )}
          </div>
          
          {/* Article Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {otherArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
