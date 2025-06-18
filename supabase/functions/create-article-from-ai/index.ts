
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

function parseAIContent(content: string): { title: string; subtitle?: string; actualContent: string } {
  // First check if it's clean markdown (starts with # heading)
  if (content.trim().startsWith('#')) {
    const lines = content.split('\n');
    let title = '';
    let actualContent = content;

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // Remove the title line from content to avoid duplication
      actualContent = content.replace(/^#\s+.+$/m, '').trim();
    }

    return {
      title: title || 'Untitled Article',
      subtitle: undefined,
      actualContent: actualContent
    };
  }

  // Try to parse as JSON if it doesn't look like markdown
  try {
    const parsed = JSON.parse(content);
    
    // Handle various JSON structures
    if (typeof parsed === 'object' && parsed !== null) {
      const title = parsed.Title || parsed.title || parsed.main_title || '';
      const subtitle = parsed.Subtitle || parsed.subtitle || undefined;
      let actualContent = parsed.Content || parsed.content || '';
      
      // If content is still an object, try to extract meaningful text
      if (typeof actualContent === 'object') {
        actualContent = JSON.stringify(actualContent, null, 2);
      }
      
      if (title && actualContent) {
        return {
          title,
          subtitle,
          actualContent
        };
      }
    }
  } catch (e) {
    // Not JSON, treat as plain text
  }

  // Fallback: treat as plain text and try to extract title
  const lines = content.split('\n');
  let title = 'Untitled Article';
  
  // Try to find a title in the first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 10 && line.length < 100) {
      title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  return {
    title,
    subtitle: undefined,
    actualContent: content
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function extractExcerpt(content: string): string {
  // Remove markdown syntax and get first meaningful paragraph
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, '') // Remove headings
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .trim();
  
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 20);
  const firstParagraph = paragraphs[0] || cleanContent.split('\n')[0] || '';
  
  return firstParagraph.length > 200 
    ? firstParagraph.substring(0, 200).trim() + '...' 
    : firstParagraph.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CreateArticleRequest = await req.json();
    console.log('Creating article from AI content:', { 
      contentLength: request.content?.length,
      category: request.category,
      provider: request.provider
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the AI-generated content properly
    const { title, subtitle, actualContent } = parseAIContent(request.content);
    const slug = generateSlug(title);
    const excerpt = extractExcerpt(actualContent);

    console.log('Parsed content:', { title, subtitle, contentLength: actualContent.length });

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

    // Create the article with properly formatted content
    const articleData = {
      title,
      slug: finalSlug,
      content: actualContent, // Use the clean content, not the raw JSON
      excerpt,
      category: request.category || 'AI Generated',
      author_name: `AI Content Generator (${request.provider})`,
      author_avatar_url: null,
      status: status,
      published_date: published_date,
    };

    console.log('Creating article with data:', articleData);

    const { data, error } = await supabase
      .from('articles')
      .insert([articleData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create article: ${error.message}`);
    }

    console.log('Article created successfully:', data.id);

    return new Response(JSON.stringify({ 
      success: true, 
      article: data,
      message: `Article "${title}" created successfully as ${status}`
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
