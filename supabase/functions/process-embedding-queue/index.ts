import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessQueueRequest {
  batchSize?: number;
  maxRetries?: number;
}

// Generate embedding using Google Gemini
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

  console.log(`🧠 Generating Gemini embedding for text of length: ${cleanText.length}`);

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

async function processQueueItem(supabase: any, queueItem: any) {
  const { id: queueId, article_id: articleId, force_update: forceUpdate } = queueItem;
  
  try {
    console.log(`🚀 Processing queue item ${queueId} for article ${articleId}`);
    
    // Mark as processing
    await supabase
      .from('embedding_queue')
      .update({ 
        status: 'processing', 
        processed_at: new Date().toISOString() 
      })
      .eq('id', queueId);

    // Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, excerpt, content, embedding, status')
      .eq('id', articleId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch article: ${fetchError.message}`);
    }

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Only process published articles
    if (article.status !== 'published') {
      console.log(`⏭️ Skipping article ${articleId} - not published (status: ${article.status})`);
      
      // Mark as completed but skipped
      await supabase
        .from('embedding_queue')
        .update({ 
          status: 'completed',
          error_message: 'Article not published',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueId);
      
      return { success: true, skipped: true, reason: 'Article not published' };
    }

    // Skip if embedding exists and not forcing update
    if (article.embedding && !forceUpdate) {
      console.log(`⏭️ Skipping article ${articleId} - embedding already exists`);
      
      // Mark as completed but skipped
      await supabase
        .from('embedding_queue')
        .update({ 
          status: 'completed',
          error_message: 'Embedding already exists',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueId);
      
      return { success: true, skipped: true, reason: 'Embedding already exists' };
    }

    // Combine text for embedding
    const combinedText = [
      article.title || '',
      article.excerpt || '',
      article.content || ''
    ].join(' ');

    if (!combinedText.trim()) {
      throw new Error('No content to embed');
    }

    // Generate embedding
    const embedding = await getGeminiEmbedding(combinedText);
    
    // Update the article with the embedding
    const { error: updateError } = await supabase.rpc('update_article_embedding', {
      article_id: articleId,
      new_embedding: embedding
    });

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Mark queue item as completed
    await supabase
      .from('embedding_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueId);

    console.log(`✅ Successfully processed embedding for article ${articleId} (queue item ${queueId})`);
    
    return {
      success: true,
      articleId,
      queueId,
      dimensions: embedding.length,
      provider: 'google-gemini',
      model: 'gemini-embedding-001'
    };

  } catch (error) {
    console.error(`❌ Error processing queue item ${queueId}:`, error);
    
    // Mark as failed and increment retry count
    await supabase
      .from('embedding_queue')
      .update({ 
        status: 'failed',
        error_message: error.message,
        retry_count: supabase.raw('retry_count + 1'),
        processed_at: new Date().toISOString()
      })
      .eq('id', queueId);
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ProcessQueueRequest = await req.json().catch(() => ({}));
    const batchSize = request.batchSize || 5;
    const maxRetries = request.maxRetries || 3;
    
    console.log('🎯 Processing embedding queue...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch pending queue items
    const { data: queueItems, error: fetchError } = await supabase
      .from('embedding_queue')
      .select(`
        id,
        article_id,
        force_update,
        retry_count,
        created_at,
        articles!inner(title, status)
      `)
      .eq('status', 'pending')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch queue items: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('ℹ️ No pending queue items found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending items in queue',
        processed: 0,
        failed: 0,
        skipped: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📚 Found ${queueItems.length} items in queue to process`);

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    const results = [];

    // Process items sequentially to avoid rate limits
    for (const queueItem of queueItems) {
      try {
        const result = await processQueueItem(supabase, queueItem);
        if (result.skipped) {
          skipped++;
        } else {
          processed++;
        }
        results.push(result);
        
        // Small delay between items
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failed++;
        results.push({
          success: false,
          queueId: queueItem.id,
          articleId: queueItem.article_id,
          error: error.message
        });
        
        console.error(`Failed to process queue item ${queueItem.id}:`, error);
      }
    }

    console.log(`🎉 Queue processing completed: ${processed} processed, ${skipped} skipped, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${queueItems.length} queue items`,
      processed,
      failed,
      skipped,
      total: queueItems.length,
      results,
      provider: 'google-gemini',
      model: 'gemini-embedding-001'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in process-embedding-queue:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});