import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// GNews API integration
async function searchGNews(keywords: string, maxResults: number) {
  const GNEWS_API_KEY = '2f09c637683eac28e9f1bc2bec089d44';
  
  try {
    const searchUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keywords)}&lang=en&country=us&max=${maxResults}&apikey=${GNEWS_API_KEY}`;
    
    console.log(`Searching GNews for: ${keywords}`);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GNews API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    const articles = [];
    
    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles) {
        articles.push({
          title: article.title || 'Untitled',
          url: article.url || '',
          source: `GNews - ${article.source?.name || 'Unknown'}`,
          publishedAt: article.publishedAt || new Date().toISOString(),
          description: article.description || article.title || '',
          type: 'news',
          image: article.image || null
        });
      }
    }
    
    console.log(`GNews found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('GNews search error:', error);
    return [];
  }
}

// Guardian API integration
async function searchGuardian(keywords: string, maxResults: number) {
  const GUARDIAN_API_KEY = 'b5e3ab61-d3dc-46e7-b3cf-8f510fae9cf3';
  
  try {
    const searchUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(keywords)}&show-fields=headline,byline,thumbnail,short-url&page-size=${maxResults}&api-key=${GUARDIAN_API_KEY}`;
    
    console.log(`Searching Guardian for: ${keywords}`);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Guardian API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    const articles = [];
    
    if (data.response && data.response.results && Array.isArray(data.response.results)) {
      for (const article of data.response.results) {
        articles.push({
          title: article.fields?.headline || article.webTitle || 'Untitled',
          url: article.fields?.shortUrl || article.webUrl || '',
          source: 'The Guardian',
          publishedAt: article.webPublicationDate || new Date().toISOString(),
          description: article.fields?.headline || article.webTitle || '',
          type: 'news',
          image: article.fields?.thumbnail || null
        });
      }
    }
    
    console.log(`Guardian found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('Guardian search error:', error);
    return [];
  }
}

// Hacker News search (free, no auth needed)
async function searchHackerNews(keywords: string, maxResults: number) {
  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keywords)}&tags=story&hitsPerPage=${maxResults}`;
    
    console.log(`Searching Hacker News for: ${keywords}`);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error(`Hacker News API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const articles = [];
    
    if (data.hits && Array.isArray(data.hits)) {
      for (const hit of data.hits) {
        articles.push({
          title: hit.title || 'Untitled',
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'Hacker News',
          publishedAt: hit.created_at || new Date().toISOString(),
          description: hit.title || '',
          type: 'tech_news',
          score: hit.points || 0,
          comments: hit.num_comments || 0
        });
      }
    }
    
    console.log(`Hacker News found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('Hacker News search error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keywords, source = 'all', timeRange = 'day', maxResults = 10 } = await req.json()
    
    if (!keywords) {
      throw new Error('Keywords are required')
    }

    console.log(`🔍 News Discovery: Searching for "${keywords}" from ${source} sources`);
    
    let allArticles = [];

    // Search different sources based on user preference
    if (source === 'all' || source === 'gnews') {
      const gNewsArticles = await searchGNews(keywords, Math.ceil(maxResults / 3));
      allArticles.push(...gNewsArticles);
    }

    if (source === 'all' || source === 'guardian') {
      const guardianArticles = await searchGuardian(keywords, Math.ceil(maxResults / 3));
      allArticles.push(...guardianArticles);
    }

    if (source === 'all' || source === 'hackernews') {
      const hnArticles = await searchHackerNews(keywords, Math.ceil(maxResults / 3));
      allArticles.push(...hnArticles);
    }

    // Filter by time range
    const now = Date.now();
    const timeFilters = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const timeFilter = timeFilters[timeRange as keyof typeof timeFilters];
    let filteredArticles = allArticles;
    
    if (timeFilter) {
      filteredArticles = allArticles.filter(article => {
        const articleTime = new Date(article.publishedAt).getTime();
        return (now - articleTime) <= timeFilter;
      });
    }

    // Sort by published date and limit results
    const sortedArticles = filteredArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults);

    console.log(`✅ News Discovery: Found ${sortedArticles.length} total articles`);

    return new Response(
      JSON.stringify({ 
        articles: sortedArticles,
        sources_searched: source === 'all' ? ['GNews', 'Guardian', 'Hacker News'] : [source],
        total_found: sortedArticles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ News Discovery Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      articles: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
