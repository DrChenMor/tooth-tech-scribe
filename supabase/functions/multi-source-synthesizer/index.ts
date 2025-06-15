
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
    if (model.startsWith('gpt-')) return 'OpenAI';
    if (model.startsWith('gemini-')) return 'Google';
    if (model.startsWith('claude-')) return 'Anthropic';
    return 'Google';
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
        { role: 'system', content: 'You are an expert content synthesizer. Create comprehensive, well-structured articles from multiple sources while maintaining proper attribution.' },
        { role: 'user', content: prompt }
      ],
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
          parts: [{ text: `You are an expert content synthesizer. Create comprehensive, well-structured articles from multiple sources while maintaining proper attribution. ${prompt}` }]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google AI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
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
        { role: 'user', content: `You are an expert content synthesizer. Create comprehensive, well-structured articles from multiple sources while maintaining proper attribution. ${prompt}` }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  if (!data.content || data.content.length === 0 || !data.content[0].text) {
    throw new Error("Anthropic AI returned no content.");
  }

  return data.content[0].text;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sources, 
      style = 'comprehensive', 
      targetLength = 'medium', 
      maintainAttribution = true, 
      resolveConflicts = true,
      aiModel = 'gemini-1.5-flash-latest'
    } = await req.json();
    
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      throw new Error('Sources array is required');
    }

    console.log(`Synthesizing content from ${sources.length} sources`);

    const lengthGuides = {
      short: '500-800 words',
      medium: '800-1500 words',
      long: '1500+ words'
    };

    const styleGuides = {
      summary: 'Create a concise summary that captures the key points from all sources.',
      comprehensive: 'Create a detailed, comprehensive article that thoroughly covers the topic using information from all sources.',
      comparison: 'Create a comparative analysis that examines different perspectives and viewpoints from the sources.',
      narrative: 'Create a narrative-style article that tells a coherent story using information from all sources.'
    };

    let prompt = `${styleGuides[style as keyof typeof styleGuides]}\n\n`;
    prompt += `Target length: ${lengthGuides[targetLength as keyof typeof lengthGuides]}\n\n`;
    
    if (maintainAttribution) {
      prompt += 'IMPORTANT: Maintain proper attribution to sources throughout the article. Use inline citations where appropriate.\n\n';
    }
    
    if (resolveConflicts) {
      prompt += 'IMPORTANT: When sources contain conflicting information, acknowledge the differences and provide balanced coverage.\n\n';
    }

    prompt += 'Sources to synthesize:\n\n';
    
    sources.forEach((source: any, index: number) => {
      prompt += `Source ${index + 1}:\n`;
      prompt += `Title: ${source.title || 'Untitled'}\n`;
      prompt += `URL: ${source.url || 'No URL'}\n`;
      prompt += `Content: ${source.content || source.description || 'No content available'}\n\n`;
    });

    prompt += '\nPlease create a well-structured article with proper headings, subheadings, and clear flow between sections.';

    const provider = getProviderForModel(aiModel);
    let synthesizedContent;
    
    console.log(`Processing with provider: ${provider}, model: ${aiModel}`);

    if (provider === 'Google') {
      synthesizedContent = await handleGoogleRequest(aiModel, prompt);
    } else if (provider === 'Anthropic') {
      synthesizedContent = await handleAnthropicRequest(aiModel, prompt);
    } else {
      synthesizedContent = await handleOpenAIRequest(aiModel, prompt);
    }

    console.log(`Successfully synthesized content (${synthesizedContent.length} characters)`);

    return new Response(JSON.stringify({ 
      synthesizedContent,
      sourceCount: sources.length,
      style,
      targetLength,
      model: aiModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in multi-source-synthesizer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
