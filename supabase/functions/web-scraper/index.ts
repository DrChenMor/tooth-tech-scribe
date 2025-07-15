// supabase/functions/web-scraper/index.ts
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

// List of realistic user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const userAgent = getRandomUserAgent();
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  };

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Fetching ${url} with User-Agent: ${userAgent.substring(0, 50)}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        // Add a small delay to seem more human-like
        ...(i > 0 && { 
          // Add random delay between retries
        })
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Successfully fetched ${url} (${response.status})`);
        return response;
      } else {
        console.warn(`⚠️ HTTP ${response.status} ${response.statusText} for ${url}`);
        if (response.status === 403 || response.status === 429) {
          // Rate limited or forbidden, wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        }
      }
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      
      // Progressive backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  
  throw new Error(`Failed to fetch after ${retries} attempts`);
}

function extractContent(doc: Document, selector?: string): string {
  let content = "";
  
  if (selector) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`⚠️ Selector "${selector}" did not match any elements. Trying fallback selectors...`);
      
      // Try common content selectors as fallbacks
      const fallbackSelectors = [
        'article',
        '.article-content',
        '.content',
        '.post-content',
        '.entry-content',
        'main',
        '.main-content'
      ];
      
      for (const fallbackSelector of fallbackSelectors) {
        const fallbackElements = doc.querySelectorAll(fallbackSelector);
        if (fallbackElements.length > 0) {
          console.log(`✅ Using fallback selector: ${fallbackSelector}`);
          fallbackElements.forEach(el => {
            content += el.textContent + "\n\n";
          });
          break;
        }
      }
      
      // If still no content, fall back to body
      if (!content.trim()) {
        console.log(`🔄 Using body as final fallback`);
        content = doc.body?.textContent?.trim() || '';
      }
    } else {
      elements.forEach(el => {
        content += el.textContent + "\n\n";
      });
    }
  } else {
    // Try to get main content intelligently
    const contentSelectors = [
      'article',
      '.article-content',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.main-content',
      '.story-content',
      '.news-content'
    ];
    
    for (const contentSelector of contentSelectors) {
      const elements = doc.querySelectorAll(contentSelector);
      if (elements.length > 0) {
        console.log(`✅ Found content using selector: ${contentSelector}`);
        elements.forEach(el => {
          content += el.textContent + "\n\n";
        });
        break;
      }
    }
    
    // Fallback to body if no specific content found
    if (!content.trim()) {
      content = doc.body?.textContent?.trim() || '';
    }
  }
  
  // Clean up the content
  content = content
    .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newline
    .trim();
  
  return content;
}

function extractMetadata(doc: Document, url: string) {
  const title = doc.querySelector('title')?.textContent?.trim() || 
                doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                'Untitled';
  
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                     doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                     '';
  
  return {
    title,
    description,
    url,
    type: 'web',
    date: new Date().toISOString()
  };
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

    if (!isValidUrl(url)) {
      throw new Error("Invalid URL provided");
    }

    console.log(`🕷️ Scraping URL: ${url} with selector: ${selector || 'auto-detect'}`);

    const response = await fetchWithRetry(url);
    const html = await response.text();

    if (!html || html.length < 100) {
      throw new Error("Received empty or very short response");
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error("Failed to parse HTML document");
    }

    const content = extractContent(doc, selector);
    const metadata = extractMetadata(doc, url);

    if (!content || content.length < 50) {
      console.warn(`⚠️ Very short content extracted (${content.length} chars)`);
    }

    console.log(`✅ Scraped content: ${content.length} characters`);

    // Create source reference
    const source_reference = {
      title: metadata.title,
      url: url,
      type: 'web',
      date: new Date().toISOString()
    };

    return new Response(JSON.stringify({ 
      content, 
      source_reference,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        content_length: content.length,
        scraped_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Error in web-scraper:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('Forbidden')) {
      errorMessage = "Website blocked the request (403 Forbidden). The site may have anti-bot protection.";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Request timed out. The website may be slow or unresponsive.";
    } else if (error.message.includes('network')) {
      errorMessage = "Network error occurred. Please check the URL and try again.";
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      url: req.url,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});