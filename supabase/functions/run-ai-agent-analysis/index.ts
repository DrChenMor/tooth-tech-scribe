
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getProviderForModel = (model: string): string => {
    if (model.startsWith('gpt-') || model.startsWith('o3-') || model.startsWith('o4-')) return 'OpenAI';
    if (model.startsWith('gemini-')) return 'Google';
    if (model.startsWith('claude-')) return 'Anthropic';
    return 'Google'; // Default fallback to Google
}

const handleOpenAIRequest = async (model: string, prompt: string) => {
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are an expert content generation assistant. Always respond with clean, well-formatted markdown content. Never include JSON formatting or code blocks unless specifically requested.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const handleGoogleRequest = async (model: string, prompt: string) => {
  if (!googleApiKey) {
    throw new Error("GOOGLE_API_KEY is not set in Supabase secrets.");
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `You are an expert content generation assistant. Always respond with clean, well-formatted markdown content. Never include JSON formatting or code blocks unless specifically requested. Here is the user request: ${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google AI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    console.error("Google AI response is missing candidates:", JSON.stringify(data, null, 2));
    throw new Error("Google AI returned no content.");
  }

  return data.candidates[0].content.parts[0].text;
};

const handleAnthropicRequest = async (model: string, prompt: string) => {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets.");
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: [
        { role: 'user', content: `You are an expert content generation assistant. Always respond with clean, well-formatted markdown content. Never include JSON formatting or code blocks unless specifically requested. Here is the user request: ${prompt}` }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  if (!data.content || data.content.length === 0 || !data.content[0].text) {
    console.error("Anthropic AI response is missing content:", JSON.stringify(data, null, 2));
    throw new Error("Anthropic AI returned no content.");
  }

  return data.content[0].text;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, agentConfig } = await req.json();
    const model = agentConfig?.ai_model || 'gemini-2.5-flash-preview-05-20';
    const provider = agentConfig?.provider || getProviderForModel(model);

    let analysis;
    
    console.log(`Processing request with provider: ${provider}, model: ${model}`);

    if (provider === 'Google') {
      analysis = await handleGoogleRequest(model, prompt);
    } else if (provider === 'Anthropic') {
      analysis = await handleAnthropicRequest(model, prompt);
    } else { // Default to OpenAI
      analysis = await handleOpenAIRequest(model, prompt);
    }
    
    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in run-ai-agent-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
