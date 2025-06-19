import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to search Reddit
async function searchReddit(keywords: string, maxResults: number) {
  try {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keywords)}&sort=hot&limit=${maxResults}&t=week`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'NewsDiscoveryBot/1.0 (by /u/NewsBot)'
      }
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    const articles = []
    
    if (data.data?.children) {
      for (const post of data.data.children) {
        const postData = post.data
        articles.push({
          title: postData.title || 'Untitled',
          url: postData.url || `https://reddit.com${postData.permalink}`,
          source: 'Reddit',
          publishedAt: new Date(postData.created_utc * 1000).toISOString(),
          description: postData.selftext?.substring(0, 200) || postData.title || '',
          type: 'discussion',
          score: postData.score || 0,
          comments: postData.num_comments || 0
        })
      }
    }
    
    return articles
  } catch (error) {
    console.error('Reddit search error:', error)
    return []
  }
}

// Helper function to search Hacker News
async function searchHackerNews(keywords: string, maxResults: number) {
  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keywords)}&tags=story&hitsPerPage=${maxResults}`
    const response = await fetch(searchUrl)
    
    if (!response.ok) return []
    
    const data = await response.json()
    const articles = []
    
    if (data.hits) {
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
        })
      }
    }
    
    return articles
  } catch (error) {
    console.error('Hacker News search error:', error)
    return []
  }
}

// Mock news search (since real Google News requires more complex setup)
async function searchMockNews(keywords: string, maxResults: number) {
  // In a real implementation, you would use Google News API or web scraping
  // For now, we'll create realistic mock data
  const mockArticles = [
    {
      title: `Latest developments in ${keywords}`,
      url: 'https://example-news-site.com/article1',
      source: 'Tech News Daily',
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      description: `Breaking news about ${keywords} with significant implications for the industry.`,
      type: 'news'
    },
    {
      title: `${keywords}: What experts are saying`,
      url: 'https://industry-weekly.com/article2',
      source: 'Industry Weekly',
      publishedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      description: `Expert analysis and opinions on recent ${keywords} developments.`,
      type: 'news'
    }
  ]
  
  return mockArticles.slice(0, maxResults)
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

    console.log(`Discovering news for: "${keywords}", source: ${source}, timeRange: ${timeRange}`)
    
    let allArticles = []

    // Search different sources based on user preference
    if (source === 'all' || source === 'reddit') {
      const redditArticles = await searchReddit(keywords, Math.ceil(maxResults / 3))
      allArticles.push(...redditArticles)
    }

    if (source === 'all' || source === 'hackernews') {
      const hnArticles = await searchHackerNews(keywords, Math.ceil(maxResults / 3))
      allArticles.push(...hnArticles)
    }

    if (source === 'all' || source === 'google-news') {
      const newsArticles = await searchMockNews(keywords, Math.ceil(maxResults / 2))
      allArticles.push(...newsArticles)
    }

    // Filter by time range
    const now = Date.now()
    const timeFilters = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }
    
    const timeFilter = timeFilters[timeRange as keyof typeof timeFilters]
    let filteredArticles = allArticles
    
    if (timeFilter) {
      filteredArticles = allArticles.filter(article => {
        const articleTime = new Date(article.publishedAt).getTime()
        return (now - articleTime) <= timeFilter
      })
    }

    // Sort by published date and limit results
    const sortedArticles = filteredArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults)

    console.log(`Found ${sortedArticles.length} articles`)

    return new Response(
      JSON.stringify({ articles: sortedArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in news-discovery:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
