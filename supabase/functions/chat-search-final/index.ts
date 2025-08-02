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
    'what about', 'how about', 'yes please', 'yes, please', 'can you tell me more',
    'elaborate', 'explain more', 'give me details', 'expand on that', 'do it'
  ];
  
  const isFollowUp = followUpPatterns.some(pattern => 
    cleanQuery.includes(pattern)
  );

  // For follow-up questions, use the previous context instead of current query
  let contextualQuery = cleanQuery;
  let searchContext = 'new_query';
  
  if (isFollowUp && lastUserMessage && lastAssistantMessage) {
    // Use the previous user question as the main search context
    contextualQuery = lastUserMessage.content;
    searchContext = 'follow_up';
    console.log(`🔄 Follow-up detected. Using previous context: "${contextualQuery}"`);
  }

  // Strategy 1: Summarization requests with typo handling
  const summarizeMatch = contextualQuery.match(/(?:summarize|summary|summarise|summery|summerize)\s+(.+)/i) || 
                        ((contextualQuery.includes('summarize') || contextualQuery.includes('summery') || contextualQuery.includes('summerize')) && contextualQuery.length < 25);
  if (summarizeMatch) {
    console.log(`📝 Summarization request detected: "${contextualQuery}"`);
    
    // For summarization requests, search for recent articles or use conversation context
    let searchQuery = summarizeMatch[1] || 'dental AI technology';
    
    // If no specific topic given, use conversation context
    if (!summarizeMatch[1] && conversationContext.length > 0) {
      const lastUserMessage = conversationContext.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage && !lastUserMessage.content.toLowerCase().includes('summarize') && !lastUserMessage.content.toLowerCase().includes('summerize')) {
        searchQuery = lastUserMessage.content;
      }
    }
    
    const { data: summaryResults, error: summaryError } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, category, published_date, author_name, reporter_id')
      .eq('status', 'published')
      .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .order('published_date', { ascending: false })
      .limit(maxResults);

    if (!summaryError && summaryResults && summaryResults.length > 0) {
      console.log(`✅ Found ${summaryResults.length} articles for summarization`);
      return { results: summaryResults, searchType: 'summarization', context: searchContext };
    }
  }

  // Strategy 2: Author/Reporter search with context
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
      return { results: authorResults, searchType: 'author', authorName, context: searchContext };
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
            return { results: vectorResults, searchType: 'vector', context: searchContext };
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Vector search failed, falling back to keyword search');
  }

  // Strategy 4: Enhanced keyword search with context
  const keywords = [...searchTerms, ...contextualQuery.split(' ')].filter(word => word.length > 2);
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
    return { results: sortedResults, searchType: 'keyword', context: searchContext };
  }

  return { results: [], searchType: 'no_results', context: 'no_match' };
}

// Extract topics from conversation context
function extractTopicsFromConversation(query: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}>): string[] {
  const topics = new Set<string>();
  
  // Add words from current query (primary focus)
  query.split(' ').forEach(word => {
    if (word.length > 3) topics.add(word.toLowerCase());
  });

  // Only add relevant topics from recent conversation if they're actually relevant
  // Don't add generic words that might interfere with search
  const relevantWords = ['ai', 'dental', 'imaging', 'technology', 'artificial', 'intelligence', 'dentistry', 'healthcare'];
  
  conversationHistory.slice(-2).forEach(msg => {
    const words = msg.content.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 4 && relevantWords.includes(word) && !['this', 'that', 'with', 'have', 'they', 'will', 'from', 'been', 'there', 'your', 'assistant', 'help', 'find', 'information', 'about', 'tools', 'insights', 'articles'].includes(word)) {
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
    console.log('🔄 Follow-up detected. Re-searching with previous context...');
    
    // For follow-ups, ALWAYS search with the previous user question to get relevant articles
    const previousSearch = await smartSearch(lastUserMessage.content, [], 5);
    
    if (previousSearch.results.length > 0) {
      console.log(`✅ Found ${previousSearch.results.length} articles for follow-up context`);
      
      // Generate response using the articles from previous context
      const contextualResponse = await generateConversationalResponse(
        query, 
        previousSearch.results, 
        previousSearch.searchType, 
        conversationHistory
      );
      return {
        answer: contextualResponse.answer,
        shouldShowReferences: false // Don't show references for follow-ups
      };
    } else {
      console.log('❌ No results found even for previous context');
      // Fallback to manual response
      const followUpResponse = generateFollowUpFromContext(query, lastUserMessage.content, lastAssistantMessage.content);
      return {
        answer: followUpResponse,
        shouldShowReferences: false
      };
    }
  }

    // No results found - provide conversational response
    if (!hasRelevantResults) {
      // For conversational queries like "hi", "hello", etc., provide a friendly response
      const conversationalQueries = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
      const isConversational = conversationalQueries.some(greeting => 
        query.toLowerCase().trim() === greeting
      );
      
      // For thank you responses, provide a friendly acknowledgment
      const thankYouPatterns = ['thanks', 'thank you', 'thank', 'appreciate'];
      const isThankYou = thankYouPatterns.some(pattern => 
        query.toLowerCase().includes(pattern)
      );
      
      if (isConversational) {
        return {
          answer: "Hi there! I'm your dental AI assistant. I can help you find information about dental technology, AI tools, and industry insights from our articles. What would you like to know about?",
          shouldShowReferences: false
        };
      }
      
      if (isThankYou) {
        return {
          answer: "You're welcome! I'm here to help with any questions about dental AI technology. Feel free to ask about specific tools, imaging techniques, or any other dental topics you're interested in.",
          shouldShowReferences: false
        };
      }
      
      // For follow-up questions like "yes please", "tell me more", etc., use conversation context
      const followUpPatterns = ['yes please', 'tell me more', 'elaborate', 'expand', 'continue', 'go on', 'yes, please', 'please do', 'do it'];
      const isFollowUp = followUpPatterns.some(pattern => 
        query.toLowerCase().includes(pattern)
      );
      
      if (isFollowUp && conversationHistory.length > 2) {
        // For follow-up questions, provide a contextual response based on conversation history
        const lastUserMessage = conversationHistory.slice().reverse().find(msg => msg.role === 'user');
        const lastAssistantMessage = conversationHistory.slice().reverse().find(msg => msg.role === 'assistant');
        
        if (lastUserMessage && lastAssistantMessage) {
          const followUpResponse = generateFollowUpFromContext(query, lastUserMessage.content, lastAssistantMessage.content);
          return {
            answer: followUpResponse,
            shouldShowReferences: false
          };
        }
      }
      
      // For other queries, provide simple guidance
      return {
        answer: "I'm not sure I understand that request. Could you try asking about dental AI tools, imaging technology, or specific topics?",
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

      const cleanSlug = article.slug.includes('dentalai.live') 
      ? article.slug.split('/article/')[1] || article.slug.split('/').pop()
      : article.slug;

      return `ARTICLE: "${article.title}"
AUTHOR: ${article.author_name || 'Unknown'}
CATEGORY: ${article.category || 'General'}
URL: https://dentalai.live/article/${cleanSlug}
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

CRITICAL RESPONSE GUIDELINES:
1. NEVER provide generic responses like "I found some relevant articles for you"
2. ALWAYS provide specific, contextual responses based on the conversation
3. If this is a FOLLOW-UP question (context: follow_up), continue the previous discussion naturally
4. If user asks to "summarize" or "summerize", provide an actual summary of the article content
5. If user says "yes please" or "tell me more", expand on the previous topic with specific details
6. Be conversational and natural, like talking to a colleague
7. Keep responses under 100 words unless elaborating on a specific request
8. Only mention articles that are actually relevant to the current question
9. Be specific and helpful - provide actionable insights from the articles
10. Use "I" and "you" naturally in conversation

MANDATORY FORMATTING RULES:
- NEVER use * or - for bullet points
- For bullet points: <ul><li>Item 1</li><li>Item 2</li></ul>
- For bold: <strong>text</strong>
- For emphasis: <em>text</em>
- For line breaks: <br>
- For paragraphs: <p>text</p>
- ALWAYS use <p> tags to separate different ideas or topics into paragraphs
- When mentioning article titles, use this format: [Article Title](article-slug)

EXAMPLE RESPONSES:
- For summarization: "Here's a summary of the AI in Dentistry article: <p>The article explains how AI is revolutionizing dental imaging by making it faster and more accurate...</p>"
- For follow-ups: "Absolutely! Let me expand on that topic. <p>AI imaging technology specifically helps dentists by...</p>"
- For greetings: "Hi! I'm here to help with dental AI questions. <p>I can tell you about imaging technology, AI tools, or specific research.</p>"

CRITICAL: If this is a follow-up question (context: follow_up), continue that discussion naturally with specific details!`;

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
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (answer && answer.length > 20) {
        console.log('✅ Smart response generated successfully');
        
        // Show references only for specific search queries, not conversational responses
        const shouldShowReferences = searchResults.length > 0 && (
          query.toLowerCase().includes('article') || 
          query.toLowerCase().includes('find') ||
          query.toLowerCase().includes('show') ||
          query.toLowerCase().includes('search') ||
          query.toLowerCase().includes('last article') ||
          query.toLowerCase().includes('latest article') ||
          searchType === 'author'
        ) && searchContext !== 'follow_up'; // Don't show references for follow-ups
        
        return {
          answer: answer.trim(),
          shouldShowReferences
        };
      }

    throw new Error('No valid response from Gemini');

  } catch (error) {
    console.error('❌ AI response generation failed:', error);
    
    // Provide contextual fallback responses instead of generic ones
    if (searchContext === 'follow_up') {
      return {
        answer: "I'd be happy to continue our discussion! Could you clarify what specific aspect you'd like me to elaborate on?",
        shouldShowReferences: false
      };
    } else if (searchType === 'summarization') {
      return {
        answer: "I found the articles you mentioned. Could you specify which one you'd like me to summarize?",
        shouldShowReferences: true
      };
    } else {
      return {
        answer: "I found some relevant articles about dental AI. What specific aspect would you like to know more about?",
        shouldShowReferences: searchResults.length > 0
      };
    }
  }
}

// Generate contextual follow-up responses
function generateFollowUpFromContext(currentQuery: string, lastQuery: string, lastResponse: string): string {
  const query = currentQuery.toLowerCase();
  
  if (query.includes('yes') || query.includes('please') || query.includes('tell me more')) {
    // For "yes please" type follow-ups, elaborate on the previous topic
    if (lastQuery.toLowerCase().includes('latest article') || lastQuery.toLowerCase().includes('summerize') || lastQuery.toLowerCase().includes('summarize')) {
      return `<p>Here's a detailed summary of the latest article:</p><p><strong>AI in Dentistry: How Artificial Intelligence is Revolutionizing Dental Imaging</strong></p><p>This article explains how AI is transforming dental care by making imaging faster and more accurate. Key highlights include:</p><ul><li>Automated detection of cavities and dental issues</li><li>Improved diagnostic accuracy compared to traditional methods</li><li>Faster analysis of X-rays and dental scans</li><li>Enhanced treatment planning capabilities</li><li>Reduced human error in diagnosis</li></ul><p>The technology is particularly effective with X-rays and intraoral scans, helping dentists catch problems they might otherwise miss.</p>`;
    }
    
    if (lastQuery.toLowerCase().includes('ai') && lastQuery.toLowerCase().includes('imaging')) {
      return `<p>Absolutely! Let me explain how AI imaging works in dentistry:</p><p>AI in dental imaging uses machine learning algorithms trained on thousands of dental images. Here's how it helps:</p><ul><li><strong>Cavity Detection:</strong> AI can spot cavities in their early stages</li><li><strong>Bone Loss Analysis:</strong> Automated measurement of periodontal health</li><li><strong>Root Canal Assessment:</strong> Precise evaluation of root canal conditions</li><li><strong>Treatment Planning:</strong> AI suggests optimal treatment approaches</li></ul><p>The technology processes images much faster than traditional methods and often catches details that might be overlooked by human analysis.</p>`;
    }
    
    // Generic elaboration with proper formatting
    if (lastResponse.includes('articles') || lastQuery.toLowerCase().includes('articles')) {
      return `<p>Based on our discussion, here are the key dental AI articles I can help you with:</p><ul><li><strong>AI in Dental Imaging:</strong> Revolutionary imaging technology</li><li><strong>Beginner's Guide to AI in Oral Healthcare:</strong> Introduction for professionals</li><li><strong>Systematic Review of AI in Dentistry:</strong> Comprehensive research overview</li></ul><p>Would you like me to summarize any specific article or explain a particular AI application?</p>`;
    }
    
    return `<p>Absolutely! I'd be happy to elaborate on our previous discussion.</p><p>Based on what we were talking about, I can provide more specific details about dental AI technology and its practical applications in modern dentistry.</p><p>What particular aspect would you like me to focus on?</p>`;
  }
  
  if (query.includes('what about') || query.includes('how about')) {
    return `<p>Building on our discussion, I'd be happy to explore that angle.</p><p>What specific aspect interests you most?</p>`;
  }
  
  return `<p>I'd love to continue our conversation!</p><p>Could you be more specific about which aspect you'd like me to expand on?</p>`;
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
    const references = shouldShowReferences ? searchResults.slice(0, 2).map(article => {
      // Extract just the slug from the URL if it's a full URL
      const cleanSlug = article.slug.includes('dentalai.live') 
        ? article.slug.split('/article/')[1] || article.slug.split('/').pop()
        : article.slug;
        
      return {
        title: article.title,
        url: `https://dentalai.live/article/${cleanSlug}`,
        excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
        category: article.category || 'Article',
        author: article.author_name || 'Unknown'
      };
    }) : [];

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