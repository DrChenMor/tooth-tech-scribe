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
import { Clock, ArrowRight } from 'lucide-react';

const fetchPublishedArticles = async (): Promise<Article[]> => {
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      *,
      reporter:reporters(
        id,
        name,
        avatar_url,
        specialties
      )
    `)
    .eq('status', 'published')
    .order('published_date', { ascending: false });

  if (error) {
    console.error('Error fetching published articles:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const Index = () => {
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['published-articles'],
    queryFn: fetchPublishedArticles,
  });
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 8000, stopOnInteraction: true })
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
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            <div className="pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8 lg:px-16">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:h-[450px] overflow-hidden rounded-2xl bg-card border">
                  {/* ✅ FIX: Skeleton now mimics the robust two-group layout */}
                  <div className="flex flex-col justify-between order-2 lg:order-1 p-6 md:p-8 lg:p-8">
                    <div className="space-y-4">
                      <Skeleton className="h-8 md:h-10 w-full" />
                      <Skeleton className="h-6 md:h-8 w-4/5" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 pt-2">
                        <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-12 w-48" />
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 h-64 sm:h-80 md:h-96 lg:h-full">
                    <Skeleton className="w-full h-full" />
                  </div>
                </div>
              </div>
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
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          
          {heroArticles.length > 0 && (
            <div className="pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8 lg:px-16">
              <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full max-w-7xl mx-auto"
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.reset}
                opts={{
                  loop: true,
                  align: "start",
                }}
              >
                <CarouselContent>
                  {heroArticles.map((article, index) => (
                    <CarouselItem key={article.id}>
                      <Link to={`/article/${article.slug}`} className="group block">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:h-[450px] overflow-hidden rounded-2xl bg-card hover:shadow-sm transition-shadow duration-300">
                          
                          {/* ✅ FIX: Changed to a robust flex layout that pins content to top and bottom */}
                          <div className="flex flex-col justify-between order-2 lg:order-1 p-6 md:p-8 lg:p-8">
                            
                            {/* --- Top Content Group --- */}
                            <div className="space-y-2 md:space-y-8">
                              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif leading-tight group-hover:text-primary transition-colors duration-300">
                                {article.title}
                              </h1>
                              <p className="text-sm md:text-base text-muted-foreground leading-relaxed hidden sm:block">
                                {article.excerpt}
                              </p>
                            </div>

                            {/* --- Bottom Content Group --- */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                <img 
                                  src={
                                    article.reporter?.avatar_url || 
                                    article.author_avatar_url || 
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(article.reporter?.name || article.author_name || 'Author')}&size=48`
                                  } 
                                  alt={article.reporter?.name || article.author_name || ''} 
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" 
                                />
                                <div className="text-sm md:text-base leading-none">
                                  <div className="text-foreground p-0 leading-none">
                                    {article.reporter?.name || article.author_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mt-2 leading-none">
                                    <span className="flex items-center gap-2">
                                      <Clock className="w-3 h-3" />
                                      5 min
                                    </span>
                                    <span>•</span>
                                    <span className="hidden sm:inline">
                                      {format(new Date(article.published_date), 'MMM d, yyyy')}
                                    </span>
                                    <span className="sm:hidden">
                                      {format(new Date(article.published_date), 'MMM d')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Button 
                                  size="lg"
                                  className="group/btn bg-primary hover:bg-primary/90 text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 w-full sm:w-auto"
                                >
                                  <span className="hidden sm:inline">Read Full Article</span>
                                  <span className="sm:hidden">Read Article</span>
                                  <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="order-1 lg:order-2 relative h-64 sm:h-80 md:h-96 lg:h-full">
                            <img 
                              src={article.image_url || 'https://placehold.co/800x600/EEE/BDBDBD?text=Denti-AI'} 
                              alt={article.title}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            
                            {article.category && (
                              <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-medium bg-background/90 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors duration-200"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedCategory(article.category);
                                  }}
                                >
                                  {article.category}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>   
                {/* Inside the image container */}
                <div className="hidden lg:flex absolute bottom-8 right-16 gap-2 z-10">
                  <CarouselPrevious className="w-10 h-10 rounded-full bg-background hover:bg-muted transition-colors duration-200 shadow-sm" />
                  <CarouselNext className="w-10 h-10 rounded-full bg-background hover:bg-muted transition-colors duration-200 shadow-sm" />
                </div>
              </Carousel>
            </div>
          )}
          
          <div className="flex justify-center flex-wrap gap-2 md:gap-3 mb-8 md:mb-12 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full px-3 md:px-4 py-2 h-8 md:h-9 text-sm font-medium transition-all duration-200",
                !selectedCategory
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              All
            </Button>
            {isLoadingCategories ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 md:h-9 w-16 md:w-24 rounded-full" />)
            ) : (
              categories?.map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full px-3 md:px-4 py-2 h-8 md:h-9 text-sm font-medium transition-all duration-200",
                    selectedCategory === category 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  )}
                >
                  {category}
                </Button>
              ))
            )}
          </div>
          
          {otherArticles.length > 0 && (
            <div className="mb-6 md:mb-8 text-center" key={`${selectedCategory}-title`}>
              <h2 className="text-2xl md:text-3xl font-serif font-bold">
                {selectedCategory ? `More in ${selectedCategory}` : 'Latest Articles'}
              </h2>
              <div className="w-16 md:w-20 h-1 bg-primary mx-auto mt-2"></div>
            </div>
          )}
          
          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3" key={selectedCategory || 'all'}>
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

