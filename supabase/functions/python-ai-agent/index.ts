
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PythonAgentRequest {
  keywords: string[];
  sources: string[];
  quality_threshold: number;
  auto_publish: boolean;
  python_agent_url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: PythonAgentRequest = await req.json();
    console.log('Python AI Agent request:', request);

    // Call the Python agent
    const pythonResponse = await fetch(`${request.python_agent_url}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: request.keywords,
        sources: request.sources,
        quality_threshold: request.quality_threshold,
        auto_publish: request.auto_publish
      })
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python agent responded with status: ${pythonResponse.status}`);
    }

    const result = await pythonResponse.json();

    // If auto_publish is enabled, save articles to database
    if (request.auto_publish && result.articles && result.articles.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
      const supabase = createClient(supabaseUrl, supabaseKey);

      for (const article of result.articles) {
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        await supabase
          .from('articles')
          .insert([
            {
              title: article.title,
              slug: `${slug}-${Date.now()}`,
              content: article.content,
              excerpt: article.seo_description,
              category: 'AI Generated (Python)',
              author_name: 'Python AI Agent',
              author_avatar_url: null,
              status: 'draft',
              published_date: new Date().toISOString(),
            }
          ]);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in python-ai-agent:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        articles_found: 0,
        articles_processed: 0,
        articles_published: 0,
        articles: [],
        average_quality: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
