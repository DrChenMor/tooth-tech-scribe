
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { parse } from 'https://deno.land/x/xml@2.1.3/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { urls } = await req.json()
    if (!urls || !Array.isArray(urls)) {
      throw new Error('Missing "urls" array in request body.')
    }

    const allArticles = [];

    for (const url of urls) {
      try {
        console.log(`Fetching RSS feed from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.statusText}`);
          continue; // Skip this URL
        }
        const xml = await response.text();
        const doc: any = parse(xml);
        
        let items = [];
        // RSS 2.0
        if (doc.rss && doc.rss.channel && doc.rss.channel.item) {
          items = Array.isArray(doc.rss.channel.item) ? doc.rss.channel.item : [doc.rss.channel.item];
        } 
        // Atom
        else if (doc.feed && doc.feed.entry) {
          items = Array.isArray(doc.feed.entry) ? doc.feed.entry : [doc.feed.entry];
        }

        const articles = items.map((item: any) => {
          // RSS 2.0 mapping
          if (doc.rss) {
            return {
              title: item.title,
              link: item.link,
              description: item.description,
              pubDate: item.pubDate,
            };
          }
          // Atom mapping
          if (doc.feed) {
             return {
              title: item.title,
              link: typeof item.link === 'object' ? item.link['@href'] : item.link,
              description: item.summary || item.content,
              pubDate: item.updated,
            };
          }
          return null;
        }).filter(Boolean);

        allArticles.push(...articles);
        console.log(`Found ${articles.length} articles in ${url}`);

      } catch (feedError) {
        console.error(`Error processing feed ${url}:`, feedError.message);
      }
    }

    return new Response(
      JSON.stringify({ articles: allArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
