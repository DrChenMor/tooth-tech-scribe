
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSystemPrompt = (agentType: string) => {
    let prompt = `You are an expert AI agent configuration assistant. Your task is to generate a JSON configuration object for an AI agent based on its name, type, and description.

The JSON object should be well-structured and contain relevant parameters for the specified agent type.
The most important keys are "ai_model" and "prompt_template".
For "ai_model", choose between 'gpt-4o-mini' (for simple tasks) or 'gpt-4o' (for complex analysis).
The "prompt_template" should be a detailed instruction for another AI.

Always return ONLY the JSON object, without any markdown or extra text.
`;

    switch (agentType) {
        case 'trending':
        case 'enhanced_trending':
            prompt += `
For trending agents, the config must include:
- "ai_model": (string)
- "prompt_template": (string) A detailed prompt to identify trending content. It MUST ask for a JSON response with a "trending_articles" array. The placeholder {articles_data} will be replaced with article data.
- It can optionally include other parameters like "min_views_threshold": (number) or "trending_window_hours": (number).
`;
            break;
        case 'content_gap':
            prompt += `
For content gap agents, the config must include:
- "ai_model": (string)
- "prompt_template": (string) A prompt to analyze content for gaps.
- "analysis_depth": (string, e.g., 'medium' or 'high')
`;
            break;
        case 'summarization':
            prompt += `
For summarization agents, the config must include:
- "ai_model": (string)
- "prompt_template": (string) A prompt to summarize text.
- "max_summary_length": (number)
`;
            break;
    }
    return prompt;
}

const handleOpenAIRequest = async (systemPrompt: string, userPrompt: string) => {
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
      model: 'gpt-4o-mini', // Using a smart, fast model for config generation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, type, description } = await req.json();

    if (!name || !type) {
        return new Response(JSON.stringify({ error: "Agent name and type are required." }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const systemPrompt = getSystemPrompt(type);
    const userPrompt = `Generate a configuration for an agent with the following details:
- Name: "${name}"
- Type: "${type}"
- Description: "${description}"
`;
    
    console.log(`Generating config for: ${name} (${type})`);

    const suggestedConfigString = await handleOpenAIRequest(systemPrompt, userPrompt);
    const suggestedConfig = JSON.parse(suggestedConfigString);
    
    return new Response(JSON.stringify({ suggestedConfig }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-agent-config function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
