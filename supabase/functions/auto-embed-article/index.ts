import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoEmbedRequest {
  articleId: number;
  forceUpdate?: boolean;
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

async function processArticleEmbedding(supabase: any, articleId: number, forceUpdate: boolean = false) {
  try {
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
      return { success: true, message: 'Article not published, skipping embedding' };
    }

    // Skip if embedding exists and not forcing update
    if (article.embedding && !forceUpdate) {
      console.log(`⏭️ Skipping article ${articleId} - embedding already exists`);
      return { success: true, message: 'Embedding already exists' };
    }

    // Combine text for embedding
    const combinedText = [
      article.title || '',
      article.excerpt || '',
      article.content || ''
    ].join(' ');

    if (!combinedText.trim()) {
      console.log(`⚠️ Skipping article ${articleId} - no content to embed`);
      return { success: true, message: 'No content to embed' };
    }

    console.log(`🚀 Processing article ${articleId}: "${article.title?.substring(0, 50)}..."`);

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

    console.log(`✅ Successfully generated and saved embedding for article ${articleId}`);
    
    return {
      success: true,
      message: `Embedding generated for article "${article.title}"`,
      articleId,
      dimensions: embedding.length,
      provider: 'google-gemini',
      model: 'gemini-embedding-001'
    };

  } catch (error) {
    console.error(`❌ Error processing article ${articleId}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AutoEmbedRequest = await req.json();
    console.log('🎯 Auto-embed request received:', request);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const result = await processArticleEmbedding(
      supabase, 
      request.articleId, 
      request.forceUpdate || false
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in auto-embed-article:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      articleId: (await req.json().catch(() => ({})))?.articleId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});