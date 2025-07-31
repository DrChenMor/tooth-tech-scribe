
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import ArticleCard from '@/components/ArticleCard';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const fetchArticlesByCategory = async (category: string): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .eq('status', 'published') // 🔥 ONLY PUBLISHED ARTICLES
    .order('published_date', { ascending: false });

  if (error) {
    console.error(`Error fetching articles for category ${category}:`, error);
    throw new Error(error.message);
  }
  return data || [];
};

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();

  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['articles', category],
    queryFn: () => fetchArticlesByCategory(category!),
    enabled: !!category,
  });
  
  const decodedCategory = category ? decodeURIComponent(category) : '';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
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
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Failed to load articles</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 md:mb-12">Category: {decodedCategory}</h1>
        {articles && articles.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold">No articles found in this category</h2>
            <p className="text-muted-foreground mt-2">
              Explore other categories or check back later!
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CategoryPage;
