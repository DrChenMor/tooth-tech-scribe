import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmbeddingsRequest {
  articleIds?: number[];
  forceRegenerate?: boolean;
}

// Generate embedding for a single article
async function generateArticleEmbedding(article: any, googleApiKey: string): Promise<number[] | null> {
  try {
    // Combine title, excerpt, and content for embedding
    const textForEmbedding = [
      article.title || '',
      article.excerpt || '',
      article.content?.substring(0, 1000) || ''
    ].filter(text => text.trim().length > 0).join('\n\n');

    if (textForEmbedding.trim().length < 10) {
      console.log(`⚠️ Article ${article.id} has insufficient text for embedding`);
      return null;
    }

    console.log(`🧠 Generating embedding for article: "${article.title}" (${textForEmbedding.length} chars)`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: textForEmbedding }] },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error for article ${article.id}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const embedding = data.embedding?.values;

    if (!embedding || embedding.length !== 768) {
      console.error(`❌ Invalid embedding for article ${article.id}: ${embedding?.length} dimensions`);
      return null;
    }

    console.log(`✅ Generated embedding for article ${article.id}: ${embedding.length} dimensions`);
    return embedding;

  } catch (error) {
    console.error(`❌ Error generating embedding for article ${article.id}:`, error);
    return null;
  }
}

// Update article embedding in database
async function updateArticleEmbedding(supabase: any, articleId: number, embedding: number[]): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_article_embedding', {
      article_id: articleId,
      new_embedding: embedding
    });

    if (error) {
      console.error(`❌ Error updating embedding for article ${articleId}:`, error);
      return false;
    }

    console.log(`✅ Updated embedding for article ${articleId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error updating embedding for article ${articleId}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GenerateEmbeddingsRequest = await req.json();
    const { articleIds, forceRegenerate = false } = request;

    console.log('🚀 Starting batch embedding generation...');

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get articles that need embeddings
    let query = supabase
      .from('articles')
      .select('id, title, excerpt, content, status')
      .eq('status', 'published');

    if (articleIds && articleIds.length > 0) {
      query = query.in('id', articleIds);
    }

    if (!forceRegenerate) {
      query = query.or('embedding.is.null');
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error('❌ Error fetching articles:', error);
      throw error;
    }

    if (!articles || articles.length === 0) {
      console.log('ℹ️ No articles found that need embeddings');
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles found that need embeddings',
        processed: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📚 Found ${articles.length} articles to process`);

    let processed = 0;
    let failed = 0;
    const results = [];

    // Process articles in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`);

      const batchPromises = batch.map(async (article) => {
        try {
          const embedding = await generateArticleEmbedding(article, googleApiKey);
          if (embedding) {
            const success = await updateArticleEmbedding(supabase, article.id, embedding);
            if (success) {
              processed++;
              return { id: article.id, success: true };
            } else {
              failed++;
              return { id: article.id, success: false, error: 'Failed to update database' };
            }
          } else {
            failed++;
            return { id: article.id, success: false, error: 'Failed to generate embedding' };
          }
        } catch (error) {
          failed++;
          return { id: article.id, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎉 Batch embedding generation completed: ${processed} processed, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Generated embeddings for ${processed} articles, ${failed} failed`,
      processed,
      failed,
      total: articles.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in generate-embeddings-batch:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 