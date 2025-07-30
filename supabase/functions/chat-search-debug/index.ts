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

// Enhanced logging function
function debugLog(stage: string, data: any) {
  console.log(`🔍 DEBUG [${stage}]:`, JSON.stringify(data, null, 2));
}

// Quick keyword search with detailed logging
async function quickKeywordSearch(supabase: any, query: string, maxResults: number = 3) {
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const mainKeyword = keywords[0] || '';

  debugLog('KEYWORD_SEARCH_INPUT', { query, keywords, mainKeyword });

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date')
    .eq('status', 'published')
    .or(`title.ilike.%${mainKeyword}%,excerpt.ilike.%${mainKeyword}%,content.ilike.%${mainKeyword}%`)
    .order('published_date', { ascending: false })
    .limit(maxResults);

  if (error) {
    debugLog('KEYWORD_SEARCH_ERROR', error);
    return [];
  }

  debugLog('KEYWORD_SEARCH_RESULTS', { count: data?.length, titles: data?.map(a => a.title) });
  return data || [];
}

// Vector search with detailed logging
async function tryVectorSearch(supabase: any, query: string, maxResults: number = 3) {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      debugLog('VECTOR_SEARCH_ERROR', 'Google API key not configured');
      throw new Error('Google API key not configured');
    }

    const cleanText = query.trim().substring(0, 300);
    debugLog('VECTOR_SEARCH_INPUT', { originalQuery: query, cleanText, length: cleanText.length });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
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

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      debugLog('EMBEDDING_API_ERROR', { status: embeddingResponse.status, error: errorText });
      throw new Error(`Gemini API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.embedding?.values;

    if (!embedding) {
      debugLog('EMBEDDING_ERROR', 'No embedding values received');
      throw new Error('No embedding received');
    }

    debugLog('EMBEDDING_SUCCESS', { embeddingLength: embedding.length, firstFewValues: embedding.slice(0, 5) });

    // Try vector search
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_articles_by_similarity', {
      query_embedding: embedding,
      similarity_threshold: 0.4,
      match_count: maxResults
    });

    if (vectorError) {
      debugLog('VECTOR_DB_ERROR', vectorError);
      throw new Error(`Vector search error: ${vectorError.message}`);
    }

    debugLog('VECTOR_SEARCH_RESULTS', { 
      count: vectorResults?.length, 
      titles: vectorResults?.map(a => a.title),
      similarities: vectorResults?.map(a => a.similarity)
    });

    if (vectorResults && vectorResults.length > 0) {
      return { results: vectorResults, searchType: 'vector' };
    }

    throw new Error('Vector search returned no results');

  } catch (error) {
    debugLog('VECTOR_SEARCH_FAILED', { error: error.message });
    return null;
  }
}

// Enhanced AI response with detailed logging and improved prompting
async function generateDetailedResponse(query: string, searchResults: any[]): Promise<string> {
  if (searchResults.length === 0) {
    debugLog('AI_GENERATION_SKIPPED', 'No search results available');
    return "I couldn't find any specific articles about that topic in our dental technology database. Please try asking about dental AI tools, diagnostic technologies, or imaging innovations.";
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      debugLog('AI_GENERATION_ERROR', 'Google API key not configured');
      throw new Error('Google API key not configured');
    }

    // Extract detailed content from articles with better parsing
    const articlesWithContent = searchResults.map(article => {
      const title = article.title || 'Untitled';
      const category = article.category || 'General';
      
      // Get the longest available content
      let content = '';
      if (article.content && article.content.length > 100) {
        content = article.content.substring(0, 1000); // More content
      } else if (article.excerpt && article.excerpt.length > 50) {
        content = article.excerpt;
      } else {
        content = 'Content not available';
      }

      return {
        title,
        category,
        content,
        contentLength: content.length
      };
    });

    debugLog('ARTICLES_FOR_AI', { 
      count: articlesWithContent.length,
      articles: articlesWithContent.map(a => ({
        title: a.title,
        contentLength: a.contentLength,
        contentPreview: a.content.substring(0, 100) + '...'
      }))
    });

    // Create a much more specific prompt that forces the AI to use article content
    const prompt = `You are Dr. AI, a dental technology expert. Answer this question using ONLY the specific information from these articles.

QUESTION: "${query}"

ARTICLES TO USE:
${articlesWithContent.map((article, i) => `
ARTICLE ${i+1}: "${article.title}" (${article.category})
CONTENT: ${article.content}
===========================================`).join('\n')}

STRICT INSTRUCTIONS:
1. Write a detailed 200+ word response
2. Quote specific information from the articles above
3. Mention exact tools, technologies, or findings from the articles
4. Use phrases like "According to the article..." or "The research shows..."
5. Include specific details, not generic statements
6. If articles mention specific product names, include them
7. Reference actual content from the articles, not general knowledge

Write your response now (must be 200+ words and reference specific article content):`;

    debugLog('AI_PROMPT_SENT', { 
      promptLength: prompt.length,
      model: 'gemini-2.0-flash-exp'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.1, // Lower temperature for more focused responses
          topP: 0.9
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      debugLog('AI_API_ERROR', { status: aiResponse.status, error: errorText });
      throw new Error(`Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    debugLog('AI_RESPONSE_RECEIVED', { 
      responseLength: answer?.length,
      responsePreview: answer?.substring(0, 200) + '...',
      candidates: aiData.candidates?.length
    });

    if (answer && answer.trim() && answer.length > 100) {
      debugLog('AI_RESPONSE_SUCCESS', 'Generated detailed response from article content');
      return answer.trim();
    }

    throw new Error('AI response too short or empty');

  } catch (error) {
    debugLog('AI_GENERATION_FAILED', { error: error.message });
    
    // Enhanced fallback with article content
    const titles = searchResults.map(a => a.title).join(', ');
    const firstArticleContent = searchResults[0]?.content || searchResults[0]?.excerpt || '';
    
    return `Based on our research articles "${titles}", here's what I found: ${firstArticleContent.substring(0, 500)}... 

The articles provide detailed technical information about your question. For complete specifications and implementation details, please review the full articles linked below.`;
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
      debugLog('REQUEST_ERROR', 'Empty query received');
      throw new Error('Query is required');
    }

    debugLog('REQUEST_START', { query, language, maxResults });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let searchResults: any[] = [];
    let searchType = 'keyword';

    // Try vector search first
    const vectorResult = await tryVectorSearch(supabase, query, maxResults);
    if (vectorResult) {
      searchResults = vectorResult.results;
      searchType = vectorResult.searchType;
      debugLog('SEARCH_SUCCESS', { type: 'vector', count: searchResults.length });
    } else {
      // Fallback to keyword search
      debugLog('SEARCH_FALLBACK', 'Falling back to keyword search');
      searchResults = await quickKeywordSearch(supabase, query, maxResults);
      debugLog('SEARCH_SUCCESS', { type: 'keyword', count: searchResults.length });
    }

    // Generate detailed response
    const answer = await generateDetailedResponse(query, searchResults);

    // Format references
    const references = searchResults.map(article => ({
      title: article.title,
      url: `/article/${article.slug}`,
      excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      category: article.category || 'Article'
    }));

    const response = {
      success: true,
      answer,
      references,
      resultsCount: searchResults.length,
      searchType,
      provider: 'google-gemini',
      model: 'gemini-2.0-flash-exp-debug',
      language,
      timestamp: new Date().toISOString(),
      debug: {
        queryProcessed: query,
        articlesFound: searchResults.length,
        responseLength: answer.length
      }
    };

    debugLog('RESPONSE_FINAL', { 
      success: true, 
      responseLength: answer.length,
      articlesCount: searchResults.length,
      searchType
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    debugLog('REQUEST_FAILED', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      answer: "I'm experiencing technical difficulties with detailed analysis. Please try a different question or contact support.",
      references: [],
      debug: {
        errorOccurred: true,
        errorMessage: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});