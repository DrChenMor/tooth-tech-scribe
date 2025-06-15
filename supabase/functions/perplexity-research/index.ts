
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, depth = 'medium', includeSources = true } = await req.json();
    
    if (!query) {
      throw new Error('Research query is required');
    }

    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured in Supabase secrets');
    }

    console.log(`Conducting Perplexity research: ${query}`);

    const depthPrompts = {
      quick: 'Provide a brief overview of: ',
      medium: 'Conduct thorough research and provide a comprehensive analysis of: ',
      deep: 'Conduct deep, multi-faceted research with detailed analysis, covering various perspectives and recent developments on: '
    };

    const prompt = depthPrompts[depth as keyof typeof depthPrompts] + query;
    
    if (includeSources) {
      prompt += '. Please include citations and sources for all claims.';
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant that provides comprehensive, well-sourced information. Always cite your sources when possible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: depth === 'deep' ? 2000 : depth === 'medium' ? 1500 : 1000,
        return_images: false,
        return_related_questions: true,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Perplexity API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const research = data.choices[0].message.content;
    const relatedQuestions = data.related_questions || [];

    // Extract sources if available (simple pattern matching)
    const sources = [];
    const sourceRegex = /\[(.*?)\]\((https?:\/\/[^\)]+)\)/g;
    let sourceMatch;
    
    while ((sourceMatch = sourceRegex.exec(research)) !== null) {
      sources.push({
        title: sourceMatch[1],
        url: sourceMatch[2]
      });
    }

    console.log(`Completed research with ${sources.length} sources`);

    return new Response(JSON.stringify({ 
      research,
      sources,
      relatedQuestions,
      query,
      depth 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in perplexity-research function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
