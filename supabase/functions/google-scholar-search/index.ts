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
    const { 
      query, 
      maxResults = 20, 
      yearFrom, 
      yearTo, 
      includeAbstracts = true 
    } = await req.json()
    
    if (!query) {
      throw new Error('Search query is required')
    }

    const serpApiKey = Deno.env.get('SERP_API_KEY')
    if (!serpApiKey) {
      throw new Error('SERP_API_KEY environment variable is required')
    }

    console.log(`Searching Google Scholar for: "${query}"`)
    console.log(`Parameters: maxResults=${maxResults}, yearFrom=${yearFrom}, yearTo=${yearTo}, includeAbstracts=${includeAbstracts}`)
    
    // Build SerpAPI request parameters
    const params = new URLSearchParams({
      engine: 'google_scholar',
      q: query,
      api_key: serpApiKey,
      num: Math.min(maxResults, 20).toString(), // SerpAPI limit is 20 per request
    })

    // Add year filters if provided
    if (yearFrom) {
      params.append('as_ylo', yearFrom.toString())
    }
    if (yearTo) {
      params.append('as_yhi', yearTo.toString())
    }

    const serpApiUrl = `https://serpapi.com/search?${params.toString()}`
    
    console.log('Making request to SerpAPI...')
    const response = await fetch(serpApiUrl)
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`)
    }

    // Process the organic results
    const organicResults = data.organic_results || []
    
    const papers = organicResults.map((result: any) => ({
      title: result.title || 'Untitled Paper',
      authors: result.publication_info?.authors || [],
      year: extractYear(result.publication_info?.summary || ''),
      abstract: includeAbstracts ? (result.snippet || '') : '',
      url: result.link || '',
      citations: parseInt(result.inline_links?.cited_by?.total || '0'),
      venue: result.publication_info?.summary || 'Unknown Venue',
      pdf_link: result.resources?.find((r: any) => r.title?.toLowerCase().includes('pdf'))?.link || null,
      source: 'Google Scholar (SerpAPI)'
    }))

    console.log(`Found ${papers.length} academic papers`)

    return new Response(
      JSON.stringify({ 
        papers,
        query,
        totalFound: papers.length,
        searchParams: {
          maxResults,
          yearFrom,
          yearTo,
          includeAbstracts
        },
        source: 'SerpAPI'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in google-scholar-search:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      papers: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Helper function to extract year from publication info
function extractYear(publicationInfo: string): number {
  const yearMatch = publicationInfo.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()
}