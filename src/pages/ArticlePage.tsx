import { useParams, Link } from 'react-router-dom';
import NotFound from './NotFound';
import Footer from '@/components/Footer';
import { Calendar, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import MDEditor from '@uiw/react-md-editor';
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const fetchArticleBySlug = async (slug: string): Promise<Article | null> => {
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      *,
      reporter:reporters(id, name, bio, avatar_url, specialties)
    `)
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching article:', error);
    throw new Error(error.message);
  }
  return data;
};

const detectRTL = (text: string): boolean => {
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(text);
};

const getTextDirection = (article: Article): 'rtl' | 'ltr' => {
  if (!article) return 'ltr';
  const titleIsRTL = detectRTL(article.title);
  const contentIsRTL = detectRTL(article.content || '');
  return (titleIsRTL || contentIsRTL) ? 'rtl' : 'ltr';
};

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    // Skeleton loader remains the same.
    return (
      <div className="flex flex-col flex-grow">
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

  if (isError || !article) {
    return <NotFound />;
  }
  
  const textDirection = getTextDirection(article);
  const isRTL = textDirection === 'rtl';

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="animate-fade-in">
            <header className="mb-8 md:mb-12">
              <div className="text-center mb-8">
                {article.category && (
                  <Link to={`/category/${encodeURIComponent(article.category)}`}>
                    <Badge variant="outline" className="text-sm font-semibold tracking-wider uppercase bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                      {article.category}
                    </Badge>
                  </Link>
                )}
              </div>

              <h1 
                className={`text-4xl md:text-5xl font-bold mt-4 leading-tight text-center text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}
                dir={textDirection}
              >
                {article.title}
              </h1>

              {/* === MODERNIZED METADATA BAR (UI Changes you liked) === */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground border-t border-b border-gray-200 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={article.reporter?.avatar_url || article.author_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.reporter?.name || article.author_name || 'A')}&background=random`}
                      alt={article.reporter?.name || article.author_name || 'Author'}
                    />
                    <AvatarFallback>{(article.reporter?.name || article.author_name || 'A').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-gray-800">{article.reporter?.name || article.author_name}</span>
                </div>
                
                    <div className="flex gap-1.5">
                        {article.reporter.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="secondary">{specialty}</Badge>
                        ))}
                    </div>

                {article.reporter?.specialties && article.reporter.specialties.length > 0 && (
                  <>
                    <span className="hidden sm:block text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(article.published_date), 'MMMM d, yyyy')}</span>
                </div>
                    </div>
                  </>
                )}
              </div>
            </header>

            <img 
              src={article.image_url || 'https://placehold.co/1280x720/EEE/BDBDBD?text=Denti-AI'} 
              alt={article.title} 
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg mb-8 md:mb-12" 
            />
            
            <div 
              className="w-full" 
              data-color-mode="light"
              dir={textDirection}
            >
              <MDEditor.Markdown 
                source={article.content || ''} 
                style={{ 
                  backgroundColor: 'transparent', // ✅ Renders on the page's default background
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  fontFamily: isRTL ? 'Arial, "Helvetica Neue", Helvetica, sans-serif' : 'inherit',
                  direction: textDirection,
                  textAlign: isRTL ? 'right' : 'left',
                }}
                className={`prose prose-lg max-w-none prose-p:text-gray-700 prose-headings:text-gray-900 prose-a:text-primary ${isRTL ? 'prose-rtl' : ''}`}
              />
            </div>
            
            <div className="mt-12 text-center">
              <Link to="/" className="text-primary font-semibold hover:underline">
                ← Back to all articles
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;