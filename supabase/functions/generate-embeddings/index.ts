import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmbeddingsRequest {
  articleIds?: number[];
  batchSize?: number;
  forceUpdate?: boolean;
}

// Generate embeddings using Google's #1 model
async function getGeminiEmbedding(text: string): Promise<number[]> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  const cleanText = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 12000);

  console.log(`Generating Gemini embedding for text of length: ${cleanText.length}`);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text: cleanText }] },
      outputDimensionality: 768
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

async function processArticlesBatch(supabase: any, articles: any[], forceUpdate: boolean = false) {
  let processed = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      if (article.embedding && !forceUpdate) {
        console.log(`Skipping article ${article.id} - embedding exists`);
        continue;
      }

      const combinedText = [
        article.title || '',
        article.excerpt || '',
        article.content || ''
      ].join(' ');

      if (!combinedText.trim()) {
        console.log(`Skipping article ${article.id} - no content`);
        continue;
      }

      console.log(`Processing article ${article.id}: "${article.title?.substring(0, 50)}..."`);

      const embedding = await getGeminiEmbedding(combinedText);
      
      const { error } = await supabase.rpc('update_article_embedding', {
        article_id: article.id,
        new_embedding: embedding
      });

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      processed++;
      console.log(`✅ Updated embedding for article ${article.id}`);

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      const errorMsg = `Article ${article.id}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  return { processed, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GenerateEmbeddingsRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const batchSize = request.batchSize || 5;
    const forceUpdate = request.forceUpdate || false;

    let query = supabase
      .from('articles')
      .select('id, title, excerpt, content, embedding')
      .eq('status', 'published');

    if (request.articleIds && request.articleIds.length > 0) {
      query = query.in('id', request.articleIds);
    } else if (!forceUpdate) {
      query = query.is('embedding', null);
    }

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles found to process',
        processed: 0,
        total: 0,
        provider: 'google-gemini',
        model: 'gemini-embedding-001 (#1 in world)',
        cost: '$0.00 (FREE!)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${articles.length} articles to process with Google Gemini`);

    let totalProcessed = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(articles.length / batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches}`);

      const { processed, errors } = await processArticlesBatch(supabase, batch, forceUpdate);
      
      totalProcessed += processed;
      allErrors.push(...errors);

      if (i + batchSize < articles.length) {
        console.log('Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const response = {
      success: true,
      message: `Completed processing ${articles.length} articles`,
      processed: totalProcessed,
      total: articles.length,
      errors: allErrors,
      provider: 'google-gemini',
      model: 'gemini-embedding-001 (#1 in world)',
      cost: '$0.00 (FREE!)',
      dailyLimit: '15,000 requests'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      helpUrl: 'https://aistudio.google.com/app/apikey'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});