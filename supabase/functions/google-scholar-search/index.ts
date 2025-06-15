
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
    const { query, maxResults = 20, yearFrom, yearTo, includeAbstracts = true } = await req.json()
    
    if (!query) {
      throw new Error('Search query is required')
    }

    console.log(`Searching Google Scholar for: ${query}`)
    
    // Construct search URL with parameters
    let searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&num=${maxResults}`
    
    if (yearFrom && yearTo) {
      searchUrl += `&as_ylo=${yearFrom}&as_yhi=${yearTo}`
    }

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Scholar: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Simple HTML parsing to extract paper information
    const papers = []
    const titleRegex = /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a><\/h3>/g
    const authorRegex = /<div[^>]*class="gs_a"[^>]*>([^<]+)</g
    const abstractRegex = /<span[^>]*class="gs_rs"[^>]*>([^<]+)</g
    
    let titleMatch
    let authorMatch
    let abstractMatch
    let paperIndex = 0
    
    while ((titleMatch = titleRegex.exec(html)) !== null && paperIndex < maxResults) {
      const paper = {
        title: titleMatch[2],
        url: titleMatch[1],
        authors: '',
        abstract: '',
        year: ''
      }
      
      // Try to get author info
      if ((authorMatch = authorRegex.exec(html)) !== null) {
        paper.authors = authorMatch[1].replace(/<[^>]*>/g, '').trim()
        // Extract year from author string
        const yearMatch = paper.authors.match(/(\d{4})/)
        if (yearMatch) {
          paper.year = yearMatch[1]
        }
      }
      
      // Try to get abstract if requested
      if (includeAbstracts && (abstractMatch = abstractRegex.exec(html)) !== null) {
        paper.abstract = abstractMatch[1].replace(/<[^>]*>/g, '').trim()
      }
      
      papers.push(paper)
      paperIndex++
    }

    console.log(`Found ${papers.length} papers from Google Scholar`)

    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in google-scholar-search:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
