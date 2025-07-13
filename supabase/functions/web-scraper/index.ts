
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  url: string;
  selector?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, selector }: ScrapeRequest = await req.json();
    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Scraping URL: ${url} with selector: ${selector || 'body'}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error("Failed to parse HTML document.");
    }

    let content = "";
    if (selector) {
      const elements = doc.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Selector "${selector}" did not match any elements. Falling back to body.`);
        content = doc.body?.textContent?.trim() || '';
      } else {
        elements.forEach(el => {
            content += el.textContent + "\n\n";
        });
      }
    } else {
      content = doc.body?.textContent?.trim() || '';
    }
    
    content = content.replace(/\s{2,}/g, ' ').trim();

    console.log(`Scraped content length: ${content.length}`);

    // Add source_reference to response
    const source_reference = {
      title: url,
      url: url,
      type: 'web',
      date: new Date().toISOString()
    };

    return new Response(JSON.stringify({ content, source_reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in web-scraper:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
