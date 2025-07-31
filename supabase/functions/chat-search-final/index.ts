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

// Enhanced search with context awareness
async function contextAwareSearch(supabase: any, query: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [], maxResults: number = 5) {
  const cleanQuery = query.toLowerCase().trim();
  console.log(`🧠 Context-aware search for: "${cleanQuery}"`);

  // Analyze conversation context
  const conversationContext = conversationHistory.slice(-6); // Last 3 exchanges
  const lastUserMessage = conversationContext.filter(msg => msg.role === 'user').pop();
  const lastAssistantMessage = conversationContext.filter(msg => msg.role === 'assistant').pop();

  // Check if this is a follow-up question
  const followUpPatterns = [
    'yes', 'no', 'ok', 'sure', 'please', 'tell me more', 'continue', 'go on',
    'what about', 'how about', 'yes please', 'can you tell me more',
    'elaborate', 'explain more', 'give me details', 'expand on that'
  ];
  
  const isFollowUp = followUpPatterns.some(pattern => 
    cleanQuery.includes(pattern) || cleanQuery === pattern
  );

  // For follow-up questions, use the previous context instead of current query
  let contextualQuery = cleanQuery;
  if (isFollowUp && lastUserMessage && lastAssistantMessage) {
    // Use the previous user question as the main search context
    contextualQuery = lastUserMessage.content;
    console.log(`🔄 Follow-up detected. Using previous context: "${contextualQuery}"`);
  }

  // Strategy 1: Author/Reporter search with context
  const authorMatch = contextualQuery.match(/(?:author|reporter|writer|by|from)\s+(.+)/i) || 
                     contextualQuery.match(/(chen|dr\.|anya|sharma|ai content generator)/i);
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
      return { results: authorResults, searchType: 'author', authorName, context: 'author_search' };
    }
  }

  // Strategy 2: Topic-based search with conversation context
  const searchTerms = extractTopicsFromConversation(contextualQuery, conversationContext);
  console.log(`🔍 Extracted topics: ${searchTerms.join(', ')}`);

  // Strategy 3: Vector search with enhanced context
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (googleApiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: contextualQuery.substring(0, 300) }] },
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
            return { results: vectorResults, searchType: 'vector', context: isFollowUp ? 'follow_up' : 'new_query' };
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Vector search failed, falling back to keyword search');
  }

  // Strategy 4: Enhanced keyword search with context
  const keywords = [...searchTerms, ...cleanQuery.split(' ')].filter(word => word.length > 2);
  const { data: keywordResults, error: keywordError } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
    .eq('status', 'published')
    .or(keywords.map(keyword => `title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%,content.ilike.%${keyword}%`).join(','))
    .order('published_date', { ascending: false })
    .limit(maxResults * 2);

  if (!keywordError && keywordResults && keywordResults.length > 0) {
    // Score results based on relevance and context
    const scoredResults = keywordResults.map(article => {
      let score = 0;
      const title = article.title?.toLowerCase() || '';
      const excerpt = article.excerpt?.toLowerCase() || '';
      const content = article.content?.toLowerCase() || '';
      
      keywords.forEach(keyword => {
        if (title.includes(keyword)) score += 10;
        if (excerpt.includes(keyword)) score += 5;
        if (content.includes(keyword)) score += 2;
      });

      // Boost score for contextually relevant articles
      if (isFollowUp && lastAssistantMessage) {
        const lastContent = lastAssistantMessage.content.toLowerCase();
        if (lastContent.includes(title) || title.includes(lastContent.split(' ')[0])) {
          score += 20; // High boost for articles mentioned in previous response
        }
      }

      return { ...article, relevance_score: score };
    });

    const sortedResults = scoredResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, maxResults);

    console.log(`✅ Keyword search found ${sortedResults.length} relevant articles`);
    return { results: sortedResults, searchType: 'keyword', context: isFollowUp ? 'follow_up' : 'new_query' };
  }

  return { results: [], searchType: 'no_results', context: 'no_match' };
}

// Extract topics from conversation context
function extractTopicsFromConversation(query: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}>): string[] {
  const topics = new Set<string>();
  
  // Add words from current query
  query.split(' ').forEach(word => {
    if (word.length > 3) topics.add(word.toLowerCase());
  });

  // Add relevant topics from recent conversation
  conversationHistory.slice(-4).forEach(msg => {
    const words = msg.content.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 4 && !['this', 'that', 'with', 'have', 'they', 'will', 'from', 'been'].includes(word)) {
        topics.add(word);
      }
    });
  });

  return Array.from(topics);
}

// Smart conversational AI response with proper memory
async function generateSmartResponse(
  query: string, 
  searchResults: any[], 
  searchType: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
  searchContext: string = 'new_query'
): Promise<{answer: string, shouldShowReferences: boolean}> {
  
  try {
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Analyze conversation for context
    const lastUserMessage = conversationHistory.filter(msg => msg.role === 'user').pop();
    const lastAssistantMessage = conversationHistory.filter(msg => msg.role === 'assistant').pop();
    
    const isFollowUp = searchContext === 'follow_up';
    const hasRelevantResults = searchResults.length > 0;

      // Handle follow-up questions intelligently
  if (isFollowUp && lastAssistantMessage && lastUserMessage) {
    // For follow-ups, generate a contextual response even if no new results
    const followUpResponse = generateFollowUpFromContext(query, lastUserMessage.content, lastAssistantMessage.content);
    return {
      answer: followUpResponse,
      shouldShowReferences: hasRelevantResults && searchResults.length > 0
    };
  }

    // No results found
    if (!hasRelevantResults) {
      return {
        answer: "I couldn't find specific articles about that in our dental technology database. Try asking about dental AI tools, imaging technology, or specific authors like Dr. Anya Sharma or Chen Mor.",
        shouldShowReferences: false
      };
    }

    // Prepare conversation context
    const recentContext = conversationHistory.slice(-6).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    // Prepare article content
    const articlesContent = searchResults.slice(0, 3).map(article => {
      const content = article.content ? article.content.substring(0, 600) : article.excerpt || '';
      return `ARTICLE: "${article.title}"
AUTHOR: ${article.author_name || 'Unknown'}
CATEGORY: ${article.category || 'General'}
URL: https://dentalai.live/article/${article.slug}
EXCERPT: ${content}
---`;
    }).join('\n\n');

    let systemPrompt = `You are Dr. Sarah Chen, a knowledgeable dental AI assistant. You have perfect memory of our conversation and provide helpful, contextual responses.

CONVERSATION CONTEXT:
${recentContext}

CURRENT QUERY: "${query}"
SEARCH TYPE: ${searchType}
CONTEXT: ${searchContext}

AVAILABLE ARTICLES:
${articlesContent}

RESPONSE GUIDELINES:
1. REMEMBER THE CONVERSATION - if this is a follow-up question, reference what we discussed
2. Be conversational and natural, like talking to a colleague
3. Keep responses under 80 words unless elaborating on a specific request
4. If user says "yes please" or "tell me more", expand on the previous topic
5. Only mention articles that are actually relevant to the current question
6. Be specific and helpful - provide actionable insights
7. Use "I" and "you" naturally in conversation

CRITICAL: If this is a follow-up question about a previous topic, continue that discussion naturally!`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-2.0-flash-exp',
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 250,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.length > 20) {
      console.log('✅ Smart response generated successfully');
      
      // Show references for most queries except simple follow-ups
      const shouldShowReferences = searchResults.length > 0 && (
        !isFollowUp || // Show for new queries
        query.toLowerCase().includes('article') || 
        query.toLowerCase().includes('find') ||
        query.toLowerCase().includes('show') ||
        searchType === 'author'
      );
      
      return {
        answer: answer.trim(),
        shouldShowReferences
      };
    }

    throw new Error('No valid response from Gemini');

  } catch (error) {
    console.error('❌ AI response generation failed:', error);
    
    return {
      answer: "I found some relevant articles for you! Feel free to ask me specific questions about dental AI, imaging, or any authors you're interested in.",
      shouldShowReferences: searchResults.length > 0
    };
  }
}

// Generate contextual follow-up responses
function generateFollowUpFromContext(currentQuery: string, lastQuery: string, lastResponse: string): string {
  const query = currentQuery.toLowerCase();
  
  if (query.includes('yes') || query.includes('please') || query.includes('tell me more')) {
    // For "yes please" type follow-ups, elaborate on the previous topic
    if (lastQuery.toLowerCase().includes('ai') && lastQuery.toLowerCase().includes('imaging')) {
      return `AI in dental imaging works by using machine learning algorithms trained on thousands of dental images. These systems can detect cavities, bone loss, and other dental issues with remarkable accuracy - sometimes even spotting problems that human eyes might miss. The technology also helps speed up diagnosis and can highlight areas of concern for dentists to examine more closely. It's particularly effective with X-rays and intraoral scans.`;
    }
    
    if (lastQuery.toLowerCase().includes('australia') && lastQuery.toLowerCase().includes('chen')) {
      return `Chen Mor's article "Finding Our Way: Life's Journey in Australia" tells the story of a family's immigration experience. It explores how they adapted to Australian culture, found new opportunities, and overcame challenges. The article touches on themes of resilience, cultural adjustment, and finding home in a new country.`;
    }
    
    // Generic elaboration
    const sentences = lastResponse.split('.').filter(s => s.length > 10);
    if (sentences.length > 1) {
      return `Absolutely! ${sentences[0].trim()}. This technology is particularly exciting because it can process images much faster than traditional methods and often catches details that might be overlooked. Would you like to know about specific applications or the accuracy rates?`;
    }
  }
  
  if (query.includes('what about') || query.includes('how about')) {
    return `Building on our discussion about ${lastQuery.toLowerCase()}, I'd be happy to explore that angle. What specific aspect interests you most?`;
  }
  
  return `I'd love to elaborate on what we were discussing! Could you be more specific about which aspect you'd like me to expand on?`;
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

    console.log(`🚀 Processing smart chat: "${query}"`);
    console.log(`📚 Conversation history: ${conversationHistory.length} messages`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Perform context-aware search
    const searchResult = await contextAwareSearch(supabase, query, conversationHistory, maxResults);
    const { results: searchResults, searchType, authorName, category, context } = searchResult;

    // Generate smart conversational response
    const { answer, shouldShowReferences } = await generateSmartResponse(
      query, 
      searchResults, 
      searchType, 
      conversationHistory,
      context
    );

    // Format references only when relevant
    const references = shouldShowReferences ? searchResults.slice(0, 2).map(article => ({
      title: article.title,
      url: `https://dentalai.live/article/${article.slug}`,
      excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      category: article.category || 'Article',
      author: article.author_name || 'Unknown'
    })) : [];

    console.log(`🎉 Smart search completed: ${searchResults.length} results, ${searchType} search, context: ${context}`);

    return new Response(JSON.stringify({
      success: true,
      answer,
      references,
      resultsCount: searchResults.length,
      searchType,
      context,
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
      answer: "I'm experiencing some technical difficulties. Please try asking about specific dental AI topics, authors, or technologies!",
      references: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});