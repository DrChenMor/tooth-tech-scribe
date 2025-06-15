
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import { format } from 'date-fns';

type SitemapData = {
  articles: Pick<Article, 'slug' | 'published_date'>[];
  categories: string[];
};

// Fetches only necessary data for sitemap
const fetchSitemapData = async (): Promise<SitemapData> => {
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('slug, published_date, category')
    .eq('status', 'published');

  if (articlesError) {
    console.error('Error fetching articles for sitemap:', articlesError);
    throw new Error(articlesError.message);
  }

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean) as string[])];
  
  const articleData = articles.map(({ slug, published_date }) => ({ slug, published_date }));

  return { articles: articleData, categories };
};

const SitemapPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sitemapData'],
    queryFn: fetchSitemapData
  });

  // This check ensures we don't try to access window on the server.
  if (typeof window === 'undefined') {
    return <pre>Generating sitemap...</pre>;
  }

  if (isLoading) {
    return <pre>Generating sitemap...</pre>;
  }

  if (isError || !data) {
    return <pre>Error generating sitemap.</pre>;
  }
  
  const baseUrl = window.location.origin;
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/articles', priority: '0.8', changefreq: 'weekly' },
    { url: '/categories', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${data.articles.map(article => `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${format(new Date(article.published_date), 'yyyy-MM-dd')}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${data.categories.map(category => `
  <url>
    <loc>${baseUrl}/category/${encodeURIComponent(category)}</loc>
    <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  document.body.style.margin = '0';
  
  return <pre style={{ whiteSpace: 'pre', overflowWrap: 'break-word', margin: 0 }}>{sitemap.trim()}</pre>;
};

export default SitemapPage;
