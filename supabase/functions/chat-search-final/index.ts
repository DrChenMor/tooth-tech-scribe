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

// Try vector search
async function tryVectorSearch(supabase: any, query: string, maxResults: number = 3) {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const cleanText = query.trim().substring(0, 300);
    console.log(`Attempting vector search for: "${cleanText}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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

    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_articles_by_similarity', {
      query_embedding: embedding,
      similarity_threshold: 0.4,
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

// Enhanced AI response with forced detailed output
async function generateIntelligentResponse(query: string, searchResults: any[]): Promise<string> {
  if (searchResults.length === 0) {
    return "I couldn't find any specific articles about that topic in our dental technology database. I specialize in dental AI tools, diagnostic technologies, practice management software, and dental imaging innovations. Try asking about specific tools like 'AI diagnostic software' or 'dental imaging AI'.";
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Get rich content from articles
    const articlesContent = searchResults.map(article => {
      const content = article.content ? article.content.substring(0, 600) : article.excerpt || 'No detailed content available';
      return `ARTICLE: "${article.title}"
CATEGORY: ${article.category}
DETAILED CONTENT: ${content}
=======================================`;
    }).join('\n\n');

    // Force detailed response with specific instructions
    const enhancedPrompt = `You are Dr. Sarah Chen, a leading expert in dental AI technology and innovation. A dental professional asked you: "${query}"

You have access to these specific research articles and industry reports:

${articlesContent}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Give a comprehensive, detailed answer (minimum 150 words)
2. Mention specific AI technologies, tools, or benefits found in the articles
3. Include practical examples and applications
4. Use professional dental terminology appropriately
5. Reference specific findings from the articles above
6. Be educational and informative - this is for dental professionals
7. If articles mention specific product names or technologies, include them
8. Explain HOW these AI tools benefit dentists practically

REQUIRED FORMAT:
- Start with: "Based on the latest research and industry analysis..."
- Include specific details from the articles
- End with practical implications for dental practice

Write your expert response now (minimum 150 words):`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.2,
          topP: 0.9
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.trim() && answer.length > 100) {
      console.log('Intelligent response generated successfully:', answer.length, 'characters');
      return answer.trim();
    }

    throw new Error('No valid detailed response from Gemini');

  } catch (error) {
    console.error('AI response generation failed:', error);
    
    // Create intelligent fallback from article content
    const articleTitles = searchResults.map(a => a.title).join(', ');
    const detailedInfo = searchResults.map(article => {
      const content = article.excerpt || article.content?.substring(0, 200) || '';
      return `"${article.title}": ${content}`;
    }).join('\n\n');

    return `Based on the latest research and industry analysis from our dental technology database, here's what I found about your question:

${detailedInfo}

These articles provide comprehensive information about AI applications in dentistry. The research shows significant advancements in diagnostic accuracy, treatment planning efficiency, and patient care quality. For detailed technical specifications and implementation guidelines, I recommend reviewing the complete articles linked below.`;
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

    console.log(`Processing FINAL chat search: "${query}"`);

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
    } else {
      // Fallback to keyword search
      console.log('Falling back to keyword search...');
      searchResults = await quickKeywordSearch(supabase, query, maxResults);
    }

    // Generate intelligent response
    const answer = await generateIntelligentResponse(query, searchResults);

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
      model: 'gemini-2.0-flash-exp-final',
      language,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-search-final:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      answer: "I'm experiencing technical difficulties. Please try again in a moment, or ask me about specific dental AI topics like 'diagnostic imaging AI' or 'practice management tools'.",
      references: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});