// FIX 5: Update ArticlePage.tsx to handle RTL languages properly

import { useParams, Link } from 'react-router-dom';
import NotFound from './NotFound';
import Footer from '@/components/Footer';
import { Calendar, User, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import MDEditor from '@uiw/react-md-editor';
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { Badge } from '@/components/ui/badge';

const fetchArticleBySlug = async (slug: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching article:', error);
    throw new Error(error.message);
  }
  return data;
};

// 🚀 NEW: Function to detect if text is RTL
const detectRTL = (text: string): boolean => {
  // Hebrew Unicode range: \u0590-\u05FF
  // Arabic Unicode range: \u0600-\u06FF
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(text);
};

// 🚀 NEW: Function to get text direction
const getTextDirection = (article: Article): 'rtl' | 'ltr' => {
  if (!article) return 'ltr';
  
  // Check title and content for RTL characters
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

  if (isError) {
     return (
      <div className="flex flex-col flex-grow">
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

  // 🚀 NEW: Detect text direction
  const textDirection = getTextDirection(article);
  const isRTL = textDirection === 'rtl';

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <Link to="/" className="text-primary font-semibold hover:underline">
                &larr; Back to all articles
              </Link>
              {/* 🚀 NEW: Apply RTL direction and text alignment */}
              <h1 
                className={`text-4xl md:text-5xl font-serif font-bold mt-4 leading-tight ${isRTL ? 'text-right' : 'text-left'}`}
                dir={textDirection}
                style={{ 
                  direction: textDirection,
                  textAlign: isRTL ? 'right' : 'left',
                  unicodeBidi: 'embed'
                }}
              >
                {article.title}
              </h1>
              <div className="mt-6 flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{article.author_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{format(new Date(article.published_date), 'MMMM d, yyyy')}</span>
                </div>
                {article.category && (
  <Link to={`/category/${encodeURIComponent(article.category)}`}>
    <Badge
      variant="outline"
      className="flex items-center hover:bg-primary hover:text-white transition-colors cursor-pointer my-1 py-1"
    >
      <Tag size={14} className="mr-1.5" />
      {article.category}
    </Badge>
  </Link>
)}
              </div>
            </div>
            <img 
              src={article.image_url || 'https://placehold.co/1280x720/EEE/BDBDBD?text=Denti-AI'} 
              alt={article.title} 
              className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8" 
            />
            {/* 🚀 NEW: Apply RTL styling to content */}
            <div 
              className="w-full" 
              data-color-mode="light"
              dir={textDirection}
              style={{ 
                direction: textDirection,
                textAlign: isRTL ? 'right' : 'left'
              }}
            >
              <MDEditor.Markdown 
                source={article.content || ''} 
                style={{ 
                  backgroundColor: 'transparent',
                  fontSize: '18px',
                  lineHeight: '1.8',
                  fontFamily: isRTL ? 'Arial, "Helvetica Neue", Helvetica, sans-serif' : 'inherit', // Better RTL font
                  direction: textDirection,
                  textAlign: isRTL ? 'right' : 'left',
                  unicodeBidi: 'embed'
                }}
                className={`prose prose-lg max-w-none ${isRTL ? 'prose-rtl' : ''}`}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;
