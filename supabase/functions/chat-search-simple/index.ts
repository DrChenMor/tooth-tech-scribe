import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatSearchRequest {
  query: string;
  maxResults?: number;
  language?: string;
}

// Keyword search function
async function searchArticlesByKeyword(supabase: any, query: string, maxResults: number = 5) {
  console.log(`Searching for: ${query}`);
  
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, content, category, published_date')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .order('published_date', { ascending: false })
    .limit(maxResults);

  if (error) {
    console.error('Database error:', error);
    return [];
  }

  console.log(`Found ${data?.length || 0} articles`);
  return data || [];
}

// Generate response using Google Gemini
async function generateGeminiResponse(query: string, searchResults: any[], language: string = 'en') {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  if (searchResults.length === 0) {
    const noResultsMessage = language === 'he' 
      ? "לא הצלחתי למצוא מידע רלוונטי במאמרים שלנו על הנושא הזה. תוכל לנסות לנסח מחדש את השאלה?"
      : "I couldn't find relevant information in our articles about that topic. Could you try rephrasing your question?";
    
    return { 
      answer: noResultsMessage, 
      references: [] 
    };
  }

  const context = searchResults
    .slice(0, 3)
    .map(article => `Title: ${article.title}\nExcerpt: ${article.excerpt}\nContent: ${article.content?.substring(0, 500)}...`)
    .join('\n\n---\n\n');

  const prompts = {
    en: `You are a helpful assistant for a dental AI website. Answer the user's question based ONLY on the provided context from our articles.

Context from our articles:
${context}

User Question: ${query}

Instructions:
- Only use information from the provided context
- Be specific and helpful
- If you can't answer from the context, say "I don't have enough information in our articles to answer that question"
- Keep responses conversational but informative (around 100-200 words)
- Don't make up information

Answer:`,
    
    he: `אתה עוזר מועיל לאתר בינה מלאכותית דנטלית. ענה על שאלת המשתמש בהתבסס אך ורק על ההקשר שסופק מהמאמרים שלנו.

הקשר מהמאמרים שלנו:
${context}

שאלת המשתמש: ${query}

הוראות:
- השתמש רק במידע מההקשר שסופק
- היה ספציפי ומועיל
- אם אינך יכול לענות מההקשר, אמר "אין לי מספיק מידע במאמרים שלנו כדי לענות על השאלה הזו"
- שמור על תגובות שיחתיות אך אינפורמטיביות
- אל תמציא מידע

תשובה:`
  };

  const prompt = prompts[language as keyof typeof prompts] || prompts.en;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";

    const references = searchResults.slice(0, 3).map(article => ({
      title: article.title,
      url: `/article/${article.slug}`,
      excerpt: article.excerpt,
      category: article.category
    }));

    return { answer, references };
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback response
    const fallbackAnswer = `Based on our articles about "${query}", I found ${searchResults.length} relevant article${searchResults.length === 1 ? '' : 's'}. Please check the sources below for detailed information.`;
    
    const references = searchResults.slice(0, 3).map(article => ({
      title: article.title,
      url: `/article/${article.slug}`,
      excerpt: article.excerpt,
      category: article.category
    }));

    return { answer: fallbackAnswer, references };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ChatSearchRequest = await req.json();
    
    if (!request.query?.trim()) {
      throw new Error('Query is required');
    }

    console.log(`Chat search request: ${request.query}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const maxResults = request.maxResults || 5;
    const language = request.language || 'en';

    // Search articles using keyword search
    const searchResults = await searchArticlesByKeyword(supabase, request.query, maxResults);
    
    // Generate AI response
    const { answer, references } = await generateGeminiResponse(request.query, searchResults, language);

    const response = {
      success: true,
      answer,
      references,
      resultsCount: searchResults.length,
      provider: 'google-gemini',
      model: 'gemini-1.5-flash',
      searchType: 'keyword',
      language
    };

    console.log(`Returning response with ${references.length} references`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-search-simple:', error);
    
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