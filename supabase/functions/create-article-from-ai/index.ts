
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateArticleRequest {
  content: string;
  category?: string;
  provider: string;
  status?: 'draft' | 'published';
}

function extractTitleFromContent(content: string): string {
  // Try to extract title from markdown heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1];
  }
  
  // Fallback: use first sentence or first 60 characters
  const firstLine = content.split('\n')[0];
  return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractExcerpt(content: string): string {
  // Remove markdown headings and get first paragraph
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
  
  const firstParagraph = cleanContent.split('\n\n')[0];
  return firstParagraph.length > 200 
    ? firstParagraph.substring(0, 200) + '...' 
    : firstParagraph;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CreateArticleRequest = await req.json();
    console.log('Creating article from AI content:', request);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract article components from AI-generated content
    const title = extractTitleFromContent(request.content);
    const slug = generateSlug(title);
    const excerpt = extractExcerpt(request.content);

    // Check if slug already exists and make it unique if needed
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('slug')
      .eq('slug', slug)
      .single();

    const finalSlug = existingArticle 
      ? `${slug}-${Date.now()}` 
      : slug;
      
    const status = request.status || 'draft';
    const published_date = status === 'published' ? new Date().toISOString() : new Date(0).toISOString();

    // Create the article
    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title,
          slug: finalSlug,
          content: request.content,
          excerpt,
          category: request.category || 'AI Generated',
          author_name: `AI Content Generator (${request.provider})`,
          author_avatar_url: null,
          status: status,
          published_date: published_date,
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create article: ${error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      article: data,
      message: `Article created successfully as ${status}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-article-from-ai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

