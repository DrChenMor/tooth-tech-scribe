
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Discovering news for keywords: ${keywords}, source: ${source}`)
    
    const articles = []

    // Google News search
    if (source === 'all' || source === 'google-news') {
      try {
        const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keywords)}&hl=en&gl=US&ceid=US:en`
        const response = await fetch(googleNewsUrl)
        
        if (response.ok) {
          const xml = await response.text()
          
          // Simple XML parsing for RSS
          const itemRegex = /<item>(.*?)<\/item>/gs
          const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/
          const linkRegex = /<link>(.*?)<\/link>/
          const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/
          const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/
          
          let match
          let count = 0
          
          while ((match = itemRegex.exec(xml)) !== null && count < maxResults) {
            const item = match[1]
            
            const titleMatch = titleRegex.exec(item)
            const linkMatch = linkRegex.exec(item)
            const pubDateMatch = pubDateRegex.exec(item)
            const descriptionMatch = descriptionRegex.exec(item)
            
            if (titleMatch && linkMatch) {
              articles.push({
                title: titleMatch[1],
                url: linkMatch[1],
                source: 'Google News',
                publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
                description: descriptionMatch ? descriptionMatch[1] : '',
                type: 'news'
              })
              count++
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Google News:', error)
      }
    }

    // Reddit search
    if (source === 'all' || source === 'reddit') {
      try {
        const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keywords)}&sort=hot&limit=${maxResults}`
        const response = await fetch(redditUrl, {
          headers: {
            'User-Agent': 'NewsDiscoveryBot/1.0'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          data.data?.children?.forEach((post: any) => {
            const postData = post.data
            articles.push({
              title: postData.title,
              url: `https://reddit.com${postData.permalink}`,
              source: 'Reddit',
              publishedAt: new Date(postData.created_utc * 1000).toISOString(),
              description: postData.selftext?.substring(0, 200) || '',
              type: 'discussion',
              score: postData.score,
              comments: postData.num_comments
            })
          })
        }
      } catch (error) {
        console.error('Error fetching Reddit:', error)
      }
    }

    // Hacker News search
    if (source === 'all' || source === 'hackernews') {
      try {
        const hnSearchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keywords)}&tags=story&hitsPerPage=${maxResults}`
        const response = await fetch(hnSearchUrl)
        
        if (response.ok) {
          const data = await response.json()
          
          data.hits?.forEach((hit: any) => {
            articles.push({
              title: hit.title,
              url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              source: 'Hacker News',
              publishedAt: hit.created_at,
              description: '',
              type: 'tech_news',
              score: hit.points,
              comments: hit.num_comments
            })
          })
        }
      } catch (error) {
        console.error('Error fetching Hacker News:', error)
      }
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
    const filteredArticles = timeFilter 
      ? articles.filter(article => {
          const articleTime = new Date(article.publishedAt).getTime()
          return (now - articleTime) <= timeFilter
        })
      : articles

    // Sort by published date and limit results
    const sortedArticles = filteredArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults)

    console.log(`Found ${sortedArticles.length} news articles`)

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
