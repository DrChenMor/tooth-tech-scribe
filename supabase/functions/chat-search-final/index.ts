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

// Enhanced keyword search with better relevance
async function enhancedKeywordSearch(supabase: any, query: string, maxResults: number = 5) {
  const cleanQuery = query.toLowerCase().trim();
  const keywords = cleanQuery.split(' ').filter(word => word.length > 2);
  
  console.log(`🔍 Enhanced keyword search for: "${cleanQuery}" with keywords: [${keywords.join(', ')}]`);

  // Build a more sophisticated search query
  let searchQuery = supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date, status')
    .eq('status', 'published');

  // Add multiple search conditions for better relevance
  if (keywords.length > 0) {
    const conditions = keywords.map(keyword => 
      `or(title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%,content.ilike.%${keyword}%)`
    ).join(',');
    
    searchQuery = searchQuery.or(conditions);
  }

  const { data, error } = await searchQuery
    .order('published_date', { ascending: false })
    .limit(maxResults * 2); // Get more results to filter

  if (error) {
    console.error('❌ Keyword search error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No articles found in keyword search');
    return [];
  }

  // Score and rank results by relevance
  const scoredResults = data.map(article => {
    let score = 0;
    const titleLower = article.title?.toLowerCase() || '';
    const excerptLower = article.excerpt?.toLowerCase() || '';
    const contentLower = article.content?.toLowerCase() || '';

    // Score based on keyword matches
    keywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 10;
      if (excerptLower.includes(keyword)) score += 5;
      if (contentLower.includes(keyword)) score += 2;
    });

    // Bonus for exact phrase match
    if (titleLower.includes(cleanQuery)) score += 20;
    if (excerptLower.includes(cleanQuery)) score += 10;

    // Recency bonus
    const daysOld = (Date.now() - new Date(article.published_date).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysOld);

    return { ...article, relevance_score: score };
  });

  // Sort by relevance and return top results
  const sortedResults = scoredResults
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxResults);

  console.log(`✅ Keyword search found ${sortedResults.length} relevant articles`);
  return sortedResults;
}

// Improved vector search with better error handling
async function improvedVectorSearch(supabase: any, query: string, maxResults: number = 5) {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.log('⚠️ Google API key not configured, skipping vector search');
      return null;
    }

    const cleanText = query.trim().substring(0, 300);
    console.log(`🧠 Attempting vector search for: "${cleanText}"`);

    // Use the new Gemini embedding model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: cleanText }] },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini embedding API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const embedding = data.embedding?.values;

    if (!embedding || embedding.length !== 768) {
      console.error('❌ Invalid embedding received:', embedding?.length);
      return null;
    }

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // Use direct SQL query instead of RPC function
    const { data: vectorResults, error: vectorError } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, category, published_date')
      .eq('status', 'published')
      .not('embedding', 'is', null)
      .order(`embedding <-> '[${embedding.join(',')}]'::vector`)
      .limit(maxResults);

    if (vectorError) {
      console.error('❌ Vector search error:', vectorError);
      return null;
    }

    if (!vectorResults || vectorResults.length === 0) {
      console.log('⚠️ Vector search returned no results');
      return null;
    }

    console.log(`✅ Vector search successful: ${vectorResults.length} results`);
    
    return { results: vectorResults, searchType: 'vector' };

  } catch (error) {
    console.error('❌ Vector search failed:', error.message);
    return null;
  }
}

// Enhanced AI response generation
async function generateIntelligentResponse(query: string, searchResults: any[]): Promise<string> {
  if (searchResults.length === 0) {
    return "I couldn't find any specific articles about that topic in our dental technology database. I specialize in dental AI tools, diagnostic technologies, practice management software, and dental imaging innovations. Try asking about specific tools like 'AI diagnostic software' or 'dental imaging AI'.";
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Prepare article content for AI
    const articlesContent = searchResults.map(article => {
      const content = article.content ? article.content.substring(0, 800) : article.excerpt || 'No detailed content available';
      return `ARTICLE: "${article.title}"
CATEGORY: ${article.category || 'General'}
PUBLISHED: ${article.published_date}
CONTENT: ${content}
=======================================`;
    }).join('\n\n');

    const enhancedPrompt = `You are Dr. Sarah Chen, a leading expert in dental AI technology and innovation. A dental professional asked you: "${query}"

You have access to these specific research articles and industry reports:

${articlesContent}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Give a comprehensive, detailed answer (minimum 200 words)
2. Mention specific AI technologies, tools, or benefits found in the articles
3. Include practical examples and applications
4. Use professional dental terminology appropriately
5. Reference specific findings from the articles above
6. Be educational and informative - this is for dental professionals
7. If articles mention specific product names or technologies, include them
8. Explain HOW these AI tools benefit dentists practically
9. Only use information from the provided articles - don't make up facts

REQUIRED FORMAT:
- Start with: "Based on the latest research and industry analysis..."
- Include specific details from the articles
- End with practical implications for dental practice

Write your expert response now (minimum 200 words):`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.2,
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.trim() && answer.length > 150) {
      console.log('✅ Intelligent response generated successfully:', answer.length, 'characters');
      return answer.trim();
    }

    throw new Error('No valid detailed response from Gemini');

  } catch (error) {
    console.error('❌ AI response generation failed:', error);
    
    // Create intelligent fallback from article content
    const detailedInfo = searchResults.map(article => {
      const content = article.excerpt || article.content?.substring(0, 300) || '';
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
    const { query, language = 'en', maxResults = 5 } = request;

    if (!query?.trim()) {
      throw new Error('Query is required');
    }

    console.log(`🚀 Processing FINAL chat search: "${query}"`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let searchResults: any[] = [];
    let searchType = 'keyword';

    // Try vector search first
    const vectorResult = await improvedVectorSearch(supabase, query, maxResults);
    if (vectorResult && vectorResult.results.length > 0) {
      searchResults = vectorResult.results;
      searchType = vectorResult.searchType;
      console.log(`✅ Using vector search results: ${searchResults.length} articles`);
    } else {
      // Fallback to enhanced keyword search
      console.log('🔄 Falling back to enhanced keyword search...');
      searchResults = await enhancedKeywordSearch(supabase, query, maxResults);
      console.log(`✅ Using keyword search results: ${searchResults.length} articles`);
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

    console.log(`🎉 Search completed successfully: ${searchResults.length} results, ${searchType} search`);

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
    console.error('❌ Error in chat-search-final:', error);
    
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