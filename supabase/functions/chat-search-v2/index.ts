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

// Generate embeddings using Google's Gemini model with timeout
async function getGeminiEmbedding(text: string, timeoutMs: number = 8000): Promise<number[]> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  const cleanText = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000); // Shorter text for faster processing

  console.log(`Generating embedding for query: "${cleanText.substring(0, 100)}..."`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
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
    return data.embedding?.values || [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Embedding generation timed out');
    }
    throw error;
  }
}

// Vector search with fallback to keyword search
async function searchArticles(supabase: any, query: string, maxResults: number = 5) {
  try {
    // Try vector search first
    console.log('Attempting vector search...');
    const queryEmbedding = await getGeminiEmbedding(query, 6000); // 6 second timeout
    
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_articles_by_similarity', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.6, // Lower threshold for more results
      match_count: maxResults
    });

    if (!vectorError && vectorResults && vectorResults.length > 0) {
      console.log(`Vector search found ${vectorResults.length} results`);
      return { results: vectorResults, searchType: 'vector' };
    }

    console.log('Vector search failed or no results, falling back to keyword search...');
  } catch (error) {
    console.log('Vector search error, falling back to keyword search:', error.message);
  }

  // Fallback to keyword search
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const searchPattern = keywords.join(' | ');

  const { data: keywordResults, error: keywordError } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date')
    .eq('status', 'published')
    .or(`title.ilike.%${keywords[0]}%,excerpt.ilike.%${keywords[0]}%,content.ilike.%${keywords[0]}%`)
    .order('published_date', { ascending: false })
    .limit(maxResults);

  if (keywordError) {
    throw new Error(`Search failed: ${keywordError.message}`);
  }

  return { results: keywordResults || [], searchType: 'keyword' };
}

// Generate AI response with timeout
async function generateGeminiResponse(query: string, searchResults: any[], timeoutMs: number = 8000): Promise<string> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  const context = searchResults.map(article => 
    `Title: ${article.title}\nContent: ${article.excerpt || article.content?.substring(0, 500) || 'No content available'}`
  ).join('\n\n');

  const prompt = `You are a helpful dental AI assistant. Based on the following articles from our dental technology website, answer the user's question comprehensively and accurately.

User Question: "${query}"

Available Articles:
${context}

Instructions:
- Only use information from the provided articles
- Be specific and helpful
- If the articles don't contain relevant information, say so politely
- Keep response under 200 words
- Focus on practical, actionable information

Response:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 300,
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response at this time.';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Response generation timed out');
    }
    throw error;
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

    // Search articles
    const { results: searchResults, searchType } = await searchArticles(supabase, query, maxResults);

    if (searchResults.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        answer: "I couldn't find any relevant articles about that topic in our database. Please try rephrasing your question or ask about dental AI tools, diagnostics, or practice management.",
        references: [],
        resultsCount: 0,
        searchType,
        provider: 'google-gemini'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI response
    const answer = await generateGeminiResponse(query, searchResults, 6000); // 6 second timeout

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
    console.error('Error in chat-search-v2:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      answer: "I'm sorry, I encountered an error while searching our articles. Please try again.",
      references: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 