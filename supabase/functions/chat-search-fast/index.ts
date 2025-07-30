import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatSearchRequest {
  query: string;
  language?: string;
  maxResults?: number;
}

// Quick keyword search - always works
async function quickKeywordSearch(supabase: any, query: string, maxResults: number = 3) {
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const mainKeyword = keywords[0] || '';

  console.log(`Quick keyword search for: "${mainKeyword}"`);

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date')
    .eq('status', 'published')
    .or(`title.ilike.%${mainKeyword}%,excerpt.ilike.%${mainKeyword}%,content.ilike.%${mainKeyword}%`)
    .order('published_date', { ascending: false })
    .limit(maxResults);

  if (error) {
    console.error('Keyword search error:', error);
    return [];
  }

  return data || [];
}

// Try vector search with very short timeout
async function tryVectorSearch(supabase: any, query: string, maxResults: number = 3) {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Very short text for fast embedding
    const cleanText = query.trim().substring(0, 200);
    console.log(`Attempting vector search for: "${cleanText}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Very short 3-second timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: cleanText }] },
        outputDimensionality: 768
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values;

    if (!embedding) {
      throw new Error('No embedding received');
    }

    // Try vector search
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_articles_by_similarity', {
      query_embedding: embedding,
      similarity_threshold: 0.5,
      match_count: maxResults
    });

    if (!vectorError && vectorResults && vectorResults.length > 0) {
      console.log(`Vector search successful: ${vectorResults.length} results`);
      return { results: vectorResults, searchType: 'vector' };
    }

    throw new Error('Vector search returned no results');

  } catch (error) {
    console.log(`Vector search failed: ${error.message}`);
    return null;
  }
}

// Generate simple response from articles
function generateSimpleResponse(query: string, searchResults: any[]): string {
  if (searchResults.length === 0) {
    return "I couldn't find any relevant articles about that topic. Please try asking about dental AI tools, diagnostics, practice management, or dental technology.";
  }

  const articleTitles = searchResults.map(article => article.title).join(', ');
  const firstArticle = searchResults[0];
  const excerpt = firstArticle.excerpt || firstArticle.content?.substring(0, 200) + '...' || '';

  return `Based on our articles, I found relevant information about your question. Our articles "${articleTitles}" contain details about this topic. ${excerpt} You can explore these articles for more comprehensive information.`;
}

// Try Gemini response with very short timeout
async function tryGeminiResponse(query: string, searchResults: any[]): Promise<string | null> {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      return null;
    }

    const context = searchResults.slice(0, 2).map(article => 
      `Title: ${article.title}\nExcerpt: ${article.excerpt || article.content?.substring(0, 300) || ''}`
    ).join('\n\n');

    const prompt = `Based on these dental articles, answer briefly in 2-3 sentences:

Question: ${query}

Articles:
${context}

Answer:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.trim()) {
      console.log('Gemini response successful');
      return answer.trim();
    }

    throw new Error('No valid response from Gemini');

  } catch (error) {
    console.log(`Gemini response failed: ${error.message}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ChatSearchRequest = await req.json();
    const { query, language = 'en', maxResults = 3 } = request;

    if (!query?.trim()) {
      throw new Error('Query is required');
    }

    console.log(`Processing chat search: "${query}"`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let searchResults: any[] = [];
    let searchType = 'keyword';

    // Try vector search first (with short timeout)
    const vectorResult = await tryVectorSearch(supabase, query, maxResults);
    if (vectorResult) {
      searchResults = vectorResult.results;
      searchType = vectorResult.searchType;
    } else {
      // Fallback to keyword search
      console.log('Falling back to keyword search...');
      searchResults = await quickKeywordSearch(supabase, query, maxResults);
    }

    // Generate response
    let answer: string;
    const geminiAnswer = await tryGeminiResponse(query, searchResults);
    
    if (geminiAnswer) {
      answer = geminiAnswer;
    } else {
      answer = generateSimpleResponse(query, searchResults);
    }

    // Format references
    const references = searchResults.map(article => ({
      title: article.title,
      url: `/article/${article.slug}`,
      excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      category: article.category || 'Article'
    }));

    return new Response(JSON.stringify({
      success: true,
      answer,
      references,
      resultsCount: searchResults.length,
      searchType,
      provider: 'google-gemini',
      model: 'gemini-1.5-flash',
      language
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-search-fast:', error);
    
    // Emergency fallback response
    return new Response(JSON.stringify({
      success: true,
      answer: "I'm here to help you with questions about dental AI, tools, and technology. Please ask me about topics like dental diagnostics, AI-powered tools, practice management, or dental imaging. What would you like to know?",
      references: [],
      resultsCount: 0,
      searchType: 'fallback',
      provider: 'fallback',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 