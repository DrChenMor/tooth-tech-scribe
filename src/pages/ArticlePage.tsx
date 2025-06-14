
import { useParams, Link } from 'react-router-dom';
import NotFound from './NotFound';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const fetchArticleBySlug = async (slug: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    console.error('Error fetching article:', error);
    throw new Error(error.message);
  }
  return data;
};


const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-12 md:h-14 w-full mt-4" />
                <div className="mt-6 flex justify-center items-center space-x-6">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="w-full h-auto max-h-[500px] aspect-video rounded-lg shadow-lg mb-8" />
              <div className="prose lg:prose-xl max-w-none mx-auto space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-11/12" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Failed to load article</h2>
            <p className="text-muted-foreground">Please try again later or check the URL.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <Link to="/" className="text-primary font-semibold hover:underline">
                &larr; Back to all articles
              </Link>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mt-4 leading-tight">{article.title}</h1>
              <div className="mt-6 flex justify-center items-center space-x-6 text-muted-foreground text-sm">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{article.author_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{format(new Date(article.published_date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag size={16} />
                  <span>{article.category}</span>
                </div>
              </div>
            </div>
            <img src={article.image_url || '/placeholder.svg'} alt={article.title} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8" />
            <div
              className="prose lg:prose-xl max-w-none mx-auto text-foreground"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;
