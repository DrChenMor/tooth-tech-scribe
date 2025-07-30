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
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

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

// Enhanced AI response generation with better prompting
async function generateSmartResponse(query: string, searchResults: any[]): Promise<string> {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    if (searchResults.length === 0) {
      return "I couldn't find any specific articles about that topic in our dental technology database. I specialize in dental AI tools, diagnostic technologies, practice management software, and dental imaging innovations. Please ask me about these topics for detailed information.";
    }

    // Get detailed content from articles
    const articlesContext = searchResults.map(article => {
      const content = article.content ? article.content.substring(0, 800) : article.excerpt || '';
      return `Article: "${article.title}"
Category: ${article.category}
Content: ${content}
---`;
    }).join('\n\n');

    const detailedPrompt = `You are an expert dental AI assistant with deep knowledge of dental technology, AI tools, and industry innovations. A user asked: "${query}"

Based on these specific articles from our dental technology website, provide a comprehensive and helpful answer:

${articlesContext}

INSTRUCTIONS:
1. Give a detailed, specific answer based on the article content above
2. Mention specific tools, technologies, or benefits mentioned in the articles  
3. Be helpful and educational - this is for dental professionals
4. Use information ONLY from the provided articles
5. If articles mention specific AI tools or technologies, name them
6. Keep response to 3-4 sentences but make them informative and specific
7. Write in a professional but friendly tone
8. Focus on practical benefits and applications

Your detailed response:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: detailedPrompt }] }],
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.3,
          topP: 0.8
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
      console.log('Smart Gemini response generated successfully');
      return answer.trim();
    }

    throw new Error('No valid response from Gemini');

  } catch (error) {
    console.log(`Smart response generation failed: ${error.message}`);
    
    // Enhanced fallback response
    if (searchResults.length > 0) {
      const topics = searchResults.map(article => article.title).join(', ');
      const firstExcerpt = searchResults[0].excerpt || searchResults[0].content?.substring(0, 200) || '';
      
      return `Based on our articles about ${topics}, here's what I found: ${firstExcerpt} These articles contain detailed information about your question. Click on the sources below to read the full content and learn more about the specific tools and technologies mentioned.`;
    }
    
    return "I found some relevant articles but couldn't generate a detailed response right now. Please check the source articles below for comprehensive information about your question.";
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

    console.log(`Processing smart chat search: "${query}"`);

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

    // Generate smart response
    const answer = await generateSmartResponse(query, searchResults);

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
      model: 'gemini-1.5-flash-smart',
      language
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-search-smart:', error);
    
    // Emergency fallback response
    return new Response(JSON.stringify({
      success: true,
      answer: "I'm your dental AI assistant specializing in dental technology, AI tools, diagnostics, and practice management. I can help you learn about the latest innovations in dentistry. What specific aspect would you like to know about?",
      references: [],
      resultsCount: 0,
      searchType: 'fallback',
      provider: 'fallback-smart',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});