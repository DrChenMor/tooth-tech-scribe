import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PubMed API integration
async function searchPubMed(keywords: string, maxResults: number) {
  try {
    console.log(`Searching PubMed for: ${keywords}`);
    
    // First, search for IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(keywords)}&retmax=${maxResults}&retmode=json&sort=date`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error(`PubMed search error: ${searchResponse.status}`);
      return [];
    }
    
    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      console.log('No PubMed articles found');
      return [];
    }
    
    // Fetch article details
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const detailResponse = await fetch(detailUrl);
    
    if (!detailResponse.ok) {
      console.error(`PubMed detail error: ${detailResponse.status}`);
      return [];
    }
    
    const detailData = await detailResponse.json();
    const articles = [];
    
    for (const pmid of pmids) {
      const result = detailData.result?.[pmid];
      if (result) {
        articles.push({
          title: result.title || 'Untitled',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: 'PubMed',
          publishedAt: result.pubdate || new Date().toISOString(),
          description: result.title || '',
          type: 'research',
          authors: result.authors || [],
          pmid: pmid
        });
      }
    }
    
    console.log(`PubMed found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

// Europe PMC API integration
async function searchEuropePMC(keywords: string, maxResults: number) {
  try {
    console.log(`Searching Europe PMC for: ${keywords}`);
    
    const searchUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(keywords)}&format=json&pageSize=${maxResults}&sort=CITED&resultType=lite`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error(`Europe PMC error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const articles = [];
    
    if (data.resultList?.result && Array.isArray(data.resultList.result)) {
      for (const result of data.resultList.result) {
        articles.push({
          title: result.title || 'Untitled',
          url: `https://europepmc.org/article/${result.source}/${result.id}`,
          source: 'Europe PMC',
          publishedAt: result.firstPublicationDate || new Date().toISOString(),
          description: result.title || '',
          type: 'research',
          authors: result.authorString || '',
          citedByCount: result.citedByCount || 0,
          pmid: result.pmid
        });
      }
    }
    
    console.log(`Europe PMC found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('Europe PMC search error:', error);
    return [];
  }
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

// Content deduplication and scoring
function deduplicateAndScore(articles: any[], keywords: string[]) {
  const uniqueArticles = new Map();
  
  for (const article of articles) {
    const key = article.url || article.title;
    if (!uniqueArticles.has(key)) {
      // Calculate priority score based on various factors
      let score = 0;
      
      // Keyword relevance in title
      const titleLower = article.title.toLowerCase();
      const keywordMatches = keywords.filter(keyword => 
        titleLower.includes(keyword.toLowerCase())
      ).length;
      score += keywordMatches * 10;
      
      // Source reliability weight
      const sourceWeights = {
        'PubMed': 20,
        'Europe PMC': 18,
        'The Guardian': 15,
        'Hacker News': 12,
        'GNews': 10
      };
      score += sourceWeights[article.source] || 5;
      
      // Citation count for research articles
      if (article.citedByCount) {
        score += Math.min(article.citedByCount / 10, 10);
      }
      
      // Comments/engagement for news
      if (article.comments) {
        score += Math.min(article.comments / 5, 5);
      }
      
      // Recency bonus (newer articles get higher score)
      const daysOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysOld);
      
      article.priority_score = score;
      uniqueArticles.set(key, article);
    }
  }
  
  return Array.from(uniqueArticles.values());
}

// Save to content queue
async function saveToContentQueue(articles: any[], keywords: string[], selectedSources: string[]) {
  const queueItems = [];
  
  for (const article of articles) {
    try {
      const { error } = await supabase
        .from('content_queue')
        .insert({
          source_url: article.url,
          title: article.title,
          summary: article.description,
          content: null, // Will be filled by web scraper if needed
          source_type: article.type,
          keywords_used: keywords,
          priority_score: article.priority_score,
          status: 'pending',
          metadata: {
            source_name: article.source,
            published_at: article.publishedAt,
            authors: article.authors,
            image: article.image,
            pmid: article.pmid,
            cited_by_count: article.citedByCount,
            comments: article.comments,
            score: article.score
          }
        });
      
      if (!error) {
        queueItems.push(article);
      } else {
        console.error('Error saving to content queue:', error);
      }
    } catch (err) {
      console.error('Content queue save error:', err);
    }
  }
  
  console.log(`💾 Saved ${queueItems.length} articles to content queue`);
  return queueItems;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      keywords, 
      sources = ['all'], // Now accepts array of sources
      timeRange = 'day', 
      maxResults = 10,
      saveToQueue = true // Option to save to content queue
    } = await req.json()
    
    if (!keywords) {
      throw new Error('Keywords are required')
    }

    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    const keywordString = keywordArray.join(' ');
    const sourcesArray = Array.isArray(sources) ? sources : [sources];

    console.log(`🔍 News Discovery: Searching for "${keywordString}" from sources: ${sourcesArray.join(', ')}`);
    
    let allArticles = [];
    const searchPromises = [];

    // Search all selected sources in parallel
    for (const source of sourcesArray) {
      const resultsPerSource = Math.ceil(maxResults / sourcesArray.length);
      
      if (source === 'all' || source === 'pubmed') {
        searchPromises.push(searchPubMed(keywordString, resultsPerSource));
      }
      if (source === 'all' || source === 'europepmc') {
        searchPromises.push(searchEuropePMC(keywordString, resultsPerSource));
      }
      if (source === 'all' || source === 'gnews') {
        searchPromises.push(searchGNews(keywordString, resultsPerSource));
      }
      if (source === 'all' || source === 'guardian') {
        searchPromises.push(searchGuardian(keywordString, resultsPerSource));
      }
      if (source === 'all' || source === 'hackernews') {
        searchPromises.push(searchHackerNews(keywordString, resultsPerSource));
      }
    }

    // Execute all searches in parallel
    const searchResults = await Promise.allSettled(searchPromises);
    
    for (const result of searchResults) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
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

    // Deduplicate and score articles
    const uniqueArticles = deduplicateAndScore(filteredArticles, keywordArray);

    // Sort by priority score and limit results
    const sortedArticles = uniqueArticles
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, maxResults);

    console.log(`✅ News Discovery: Found ${sortedArticles.length} unique articles from ${allArticles.length} total`);

    // Save to content queue if requested
    let savedItems = [];
    if (saveToQueue && sortedArticles.length > 0) {
      savedItems = await saveToContentQueue(sortedArticles, keywordArray, sourcesArray);
    }

    const allSourceNames = ['PubMed', 'Europe PMC', 'GNews', 'Guardian', 'Hacker News'];
    const searchedSources = sourcesArray.includes('all') ? allSourceNames : sourcesArray;

    return new Response(
      JSON.stringify({ 
        articles: sortedArticles,
        sources_searched: searchedSources,
        total_found: sortedArticles.length,
        saved_to_queue: savedItems.length,
        keywords_used: keywordArray
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
