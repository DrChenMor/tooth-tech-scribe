import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateContentRequest {
  content: string;
  url?: string;
  provider: 'openai' | 'claude' | 'gemini';
  contentType: 'article' | 'summary' | 'analysis';
  category?: string;
  prompt?: string;
}

async function scrapeContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Basic content extraction (you can enhance this with more sophisticated parsing)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.substring(0, 8000); // Limit content length
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('Failed to scrape content from URL');
  }
}

async function generateWithOpenAI(content: string, contentType: string, customPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const systemPrompts = {
    article: 'You are a professional content writer. Transform the provided content into a well-structured, engaging article with proper headings, introduction, body, and conclusion. Use markdown formatting.',
    summary: 'You are a professional summarizer. Create a concise, informative summary of the provided content, highlighting key points and insights.',
    analysis: 'You are a professional analyst. Provide a detailed analysis of the provided content, including key insights, trends, implications, and actionable takeaways.'
  };
  const systemMessage = customPrompt || systemPrompts[contentType as keyof typeof systemPrompts];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: content }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API request failed');
  }

  return data.choices[0].message.content;
}

async function generateWithClaude(content: string, contentType: string, customPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic API key not configured');

  const systemPrompts = {
    article: 'Transform the provided content into a well-structured, engaging article with proper headings, introduction, body, and conclusion. Use markdown formatting.',
    summary: 'Create a concise, informative summary of the provided content, highlighting key points and insights.',
    analysis: 'Provide a detailed analysis of the provided content, including key insights, trends, implications, and actionable takeaways.'
  };
  const systemMessage = customPrompt || systemPrompts[contentType as keyof typeof systemPrompts];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemMessage,
      messages: [
        { role: 'user', content: content }
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Claude API request failed');
  }

  return data.content[0].text;
}

async function generateWithGemini(content: string, contentType: string, customPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) throw new Error('Google API key not configured');

  const systemPrompts = {
    article: 'Transform the provided content into a well-structured, engaging article with proper headings, introduction, body, and conclusion. Use markdown formatting.',
    summary: 'Create a concise, informative summary of the provided content, highlighting key points and insights.',
    analysis: 'Provide a detailed analysis of the provided content, including key insights, trends, implications, and actionable takeaways.'
  };
  const systemMessage = customPrompt || systemPrompts[contentType as keyof typeof systemPrompts];

  const fullPrompt = `${systemMessage}\n\nContent to process:\n${content}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API request failed');
  }

  return data.candidates[0].content.parts[0].text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GenerateContentRequest = await req.json();
    console.log('Processing request:', request);

    // Get content from URL or use provided content
    let contentToProcess = request.content;
    if (request.url && !contentToProcess) {
      contentToProcess = await scrapeContent(request.url);
    }

    if (!contentToProcess) {
      throw new Error('No content provided to process');
    }

    // Generate content based on provider
    let generatedContent: string;
    
    switch (request.provider) {
      case 'openai':
        generatedContent = await generateWithOpenAI(contentToProcess, request.contentType, request.prompt);
        break;
      case 'claude':
        generatedContent = await generateWithClaude(contentToProcess, request.contentType, request.prompt);
        break;
      case 'gemini':
        generatedContent = await generateWithGemini(contentToProcess, request.contentType, request.prompt);
        break;
      default:
        throw new Error('Unsupported AI provider');
    }

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-content-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
