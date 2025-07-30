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
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>;
}

// Enhanced search with multiple strategies
async function smartSearch(supabase: any, query: string, maxResults: number = 5) {
  const cleanQuery = query.toLowerCase().trim();
  console.log(`🧠 Smart search for: "${cleanQuery}"`);

  // Strategy 1: Author/Reporter search
  if (cleanQuery.includes('author') || cleanQuery.includes('reporter') || cleanQuery.includes('writer') || cleanQuery.includes('by')) {
    const authorMatch = cleanQuery.match(/(?:author|reporter|writer|by)\s+(.+)/i);
    if (authorMatch) {
      const authorName = authorMatch[1].trim();
      console.log(`👤 Searching for author: "${authorName}"`);
      
      const { data: authorResults, error: authorError } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
        .eq('status', 'published')
        .ilike('author_name', `%${authorName}%`)
        .order('published_date', { ascending: false })
        .limit(maxResults);

      if (!authorError && authorResults && authorResults.length > 0) {
        console.log(`✅ Found ${authorResults.length} articles by ${authorName}`);
        return { results: authorResults, searchType: 'author', authorName };
      }
    }
  }

  // Strategy 2: Category search
  if (cleanQuery.includes('category') || cleanQuery.includes('topic') || cleanQuery.includes('about')) {
    const categoryMatch = cleanQuery.match(/(?:category|topic|about)\s+(.+)/i);
    if (categoryMatch) {
      const category = categoryMatch[1].trim();
      console.log(`📂 Searching for category: "${category}"`);
      
      const { data: categoryResults, error: categoryError } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
        .eq('status', 'published')
        .ilike('category', `%${category}%`)
        .order('published_date', { ascending: false })
        .limit(maxResults);

      if (!categoryError && categoryResults && categoryResults.length > 0) {
        console.log(`✅ Found ${categoryResults.length} articles in category ${category}`);
        return { results: categoryResults, searchType: 'category', category };
      }
    }
  }

  // Strategy 3: Vector search with embeddings
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (googleApiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: cleanQuery.substring(0, 300) }] },
          outputDimensionality: 768
        })
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data.embedding?.values;

        if (embedding && embedding.length === 768) {
          const { data: vectorResults, error: vectorError } = await supabase
            .from('articles')
            .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
            .eq('status', 'published')
            .not('embedding', 'is', null)
            .order(`embedding <-> '[${embedding.join(',')}]'::vector`)
            .limit(maxResults);

          if (!vectorError && vectorResults && vectorResults.length > 0) {
            console.log(`✅ Vector search found ${vectorResults.length} results`);
            return { results: vectorResults, searchType: 'vector' };
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Vector search failed, falling back to keyword search');
  }

  // Strategy 4: Enhanced keyword search
  const keywords = cleanQuery.split(' ').filter(word => word.length > 2);
  
  let searchQuery = supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
    .eq('status', 'published');

  if (keywords.length > 0) {
    const conditions = keywords.map(keyword => 
      `or(title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%,content.ilike.%${keyword}%,author_name.ilike.%${keyword}%,category.ilike.%${keyword}%)`
    ).join(',');
    
    searchQuery = searchQuery.or(conditions);
  }

  const { data, error } = await searchQuery
    .order('published_date', { ascending: false })
    .limit(maxResults * 2);

  if (error) {
    console.error('❌ Keyword search error:', error);
    return { results: [], searchType: 'keyword' };
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No articles found');
    return { results: [], searchType: 'keyword' };
  }

  // Score and rank results
  const scoredResults = data.map(article => {
    let score = 0;
    const titleLower = article.title?.toLowerCase() || '';
    const excerptLower = article.excerpt?.toLowerCase() || '';
    const contentLower = article.content?.toLowerCase() || '';
    const authorLower = article.author_name?.toLowerCase() || '';
    const categoryLower = article.category?.toLowerCase() || '';

    keywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 10;
      if (excerptLower.includes(keyword)) score += 5;
      if (contentLower.includes(keyword)) score += 2;
      if (authorLower.includes(keyword)) score += 8;
      if (categoryLower.includes(keyword)) score += 6;
    });

    if (titleLower.includes(cleanQuery)) score += 20;
    if (excerptLower.includes(cleanQuery)) score += 10;

    const daysOld = (Date.now() - new Date(article.published_date).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysOld);

    return { ...article, relevance_score: score };
  });

  const sortedResults = scoredResults
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxResults);

  console.log(`✅ Keyword search found ${sortedResults.length} relevant articles`);
  return { results: sortedResults, searchType: 'keyword' };
}

// Conversational AI response generation
async function generateConversationalResponse(
  query: string, 
  searchResults: any[], 
  searchType: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<string> {
  if (searchResults.length === 0) {
    return "I couldn't find any specific articles about that topic in our dental technology database. I specialize in dental AI tools, diagnostic technologies, practice management software, and dental imaging innovations. Try asking about specific tools like 'AI diagnostic software' or 'dental imaging AI'. You can also ask me about specific authors, categories, or topics!";
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Prepare conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    // Prepare article content
    const articlesContent = searchResults.map(article => {
      const content = article.content ? article.content.substring(0, 800) : article.excerpt || 'No detailed content available';
      return `ARTICLE: "${article.title}"
AUTHOR: ${article.author_name || 'Unknown'}
CATEGORY: ${article.category || 'General'}
PUBLISHED: ${article.published_date}
URL: https://dentalai.live/article/${article.slug}
CONTENT: ${content}
=======================================`;
    }).join('\n\n');

    const enhancedPrompt = `You are Dr. Sarah Chen, a friendly and knowledgeable dental AI expert assistant. A user is chatting with you about dental technology and AI.

Current user question: "${query}"
Search type used: ${searchType}
${conversationContext}

You have access to these specific articles from our website:

${articlesContent}

CRITICAL INSTRUCTIONS:
1. Be conversational but CONCISE - keep responses under 100 words
2. Answer the user's question directly and briefly
3. Only mention articles that are actually relevant to the query
4. Use "I" and "you" to make it conversational
5. If asked about authors, mention their articles specifically
6. If asked about categories, list articles in that category
7. Don't be overly friendly or verbose - be helpful and direct
8. If the user asks follow-up questions, reference the conversation history
9. Focus on providing actionable information quickly

Generate a concise, helpful response now:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-2.0-flash-exp',
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.length > 50) {
      console.log('✅ Conversational response generated successfully');
      return answer.trim();
    }

    throw new Error('No valid response from Gemini');

  } catch (error) {
    console.error('❌ AI response generation failed:', error);
    
    // Create intelligent fallback
    const articleList = searchResults.map(article => 
      `• "${article.title}" by ${article.author_name || 'Unknown'} (${article.category}) - https://dentalai.live/article/${article.slug}`
    ).join('\n');

    return `I found some relevant articles for you! Here's what I discovered:

${articleList}

These articles should help answer your question about "${query}". Feel free to ask me more specific questions about any of these topics, authors, or categories!`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ChatSearchRequest = await req.json();
    const { query, language = 'en', maxResults = 5, conversationHistory = [] } = request;

    if (!query?.trim()) {
      throw new Error('Query is required');
    }

    console.log(`🚀 Processing smart chat search: "${query}"`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Perform smart search
    const searchResult = await smartSearch(supabase, query, maxResults);
    const { results: searchResults, searchType, authorName, category } = searchResult;

    // Generate conversational response
    const answer = await generateConversationalResponse(query, searchResults, searchType, conversationHistory);

    // Format references with full URLs
    const references = searchResults.map(article => ({
      title: article.title,
      url: `https://dentalai.live/article/${article.slug}`,
      excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      category: article.category || 'Article',
      author: article.author_name || 'Unknown'
    }));

    console.log(`🎉 Smart search completed: ${searchResults.length} results, ${searchType} search`);

    return new Response(JSON.stringify({
      success: true,
      answer,
      references,
      resultsCount: searchResults.length,
      searchType,
      authorName,
      category,
      provider: 'google-gemini',
      model: 'gemini-2.0-flash-exp',
      language,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in smart chat search:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      answer: "I'm experiencing some technical difficulties right now. Please try again in a moment, or ask me about specific dental AI topics, authors, or categories!",
      references: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});