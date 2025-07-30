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

// Generate embeddings using Google's Gemini model
async function getGeminiEmbedding(text: string): Promise<number[]> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  // Clean and limit text
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
    .substring(0, 10000);    // Limit to 10k chars

  console.log(`Generating embedding for text of length: ${cleanText.length}`);

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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  if (!data.embedding?.values) {
    throw new Error('No embedding values in response');
  }

  return data.embedding.values;
}

// Process articles one by one
async function processArticle(supabase: any, article: any, forceUpdate: boolean = false) {
  try {
    if (article.embedding && !forceUpdate) {
      console.log(`Skipping article ${article.id} - embedding exists`);
      return { success: true, skipped: true };
    }

    // Combine article text
    const combinedText = [
      article.title || '',
      article.excerpt || '',
      article.content || ''
    ].join(' ').trim();

    if (!combinedText) {
      console.log(`Skipping article ${article.id} - no content`);
      return { success: true, skipped: true };
    }

    console.log(`Processing article ${article.id}: "${article.title?.substring(0, 50)}..."`);

    // Generate embedding
    const embedding = await getGeminiEmbedding(combinedText);
    
    // Update database
    const { error } = await supabase.rpc('update_article_embedding', {
      article_id: article.id,
      new_embedding: embedding
    });

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`✅ Updated embedding for article ${article.id}`);
    return { success: true, processed: true };

  } catch (error) {
    console.error(`❌ Error processing article ${article.id}:`, error);
    return { success: false, error: error.message };
  }
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

    const batchSize = Math.min(request.batchSize || 3, 5); // Max 5 at a time
    const forceUpdate = request.forceUpdate || false;

    // Build query
    let query = supabase
      .from('articles')
      .select('id, title, excerpt, content, embedding')
      .eq('status', 'published');

    if (request.articleIds && request.articleIds.length > 0) {
      query = query.in('id', request.articleIds);
    } else if (!forceUpdate) {
      query = query.is('embedding', null);
    }

    const { data: articles, error: fetchError } = await query.limit(batchSize);

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
        model: 'gemini-embedding-001'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${articles.length} articles with Google Gemini...`);

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process articles one by one with delay
    for (const article of articles) {
      const result = await processArticle(supabase, article, forceUpdate);
      
      if (result.success) {
        if (result.processed) processed++;
        if (result.skipped) skipped++;
      } else {
        errors.push(`Article ${article.id}: ${result.error}`);
      }

      // Add delay between requests to avoid rate limiting
      if (articles.indexOf(article) < articles.length - 1) {
        console.log('Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const response = {
      success: true,
      message: `Processed ${articles.length} articles`,
      processed,
      skipped,
      total: articles.length,
      errors,
      provider: 'google-gemini',
      model: 'gemini-embedding-001',
      cost: '$0.00 (FREE)',
      batchSize
    };

    console.log('Final result:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-embeddings-batch:', error);
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