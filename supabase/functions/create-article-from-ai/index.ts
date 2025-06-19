// UPDATED create-article-from-ai/index.ts
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

function parseAIContent(content: string): { 
  title: string; 
  subtitle?: string; 
  actualContent: string;
  slug?: string;
  image_url?: string; // 🖼️ NEW: Support for image URLs
  isRTL?: boolean;
  targetLanguage?: string;
} {
  console.log('Raw content received:', content.substring(0, 200) + '...');
  
  // First, try to parse as JSON if it looks like JSON
  if (content.trim().startsWith('{') || content.includes('"title"') || content.includes('"Content"')) {
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanContent);
      console.log('Parsed JSON structure:', Object.keys(parsed));
      
      const title = parsed.title || parsed.Title || 'Untitled Article';
      const subtitle = parsed.subtitle || parsed.Subtitle || undefined;
      const actualContent = parsed.content || parsed.Content || '';
      
      // 🚀 Extract additional info including image URL
      const slug = parsed.slug || undefined;
      const image_url = parsed.image_url || undefined; // 🖼️ NEW
      const isRTL = parsed.isRTL || false;
      const targetLanguage = parsed.targetLanguage || 'en';
      
      console.log('Extracted:', { title, subtitle, contentLength: actualContent.length, slug, image_url, isRTL, targetLanguage });
      
      return {
        title: title.trim(),
        subtitle: subtitle?.trim(),
        actualContent: actualContent.trim(),
        slug: slug,
        image_url: image_url, // 🖼️ NEW
        isRTL: isRTL,
        targetLanguage: targetLanguage
      };
    } catch (e) {
      console.log('Failed to parse as JSON, treating as text:', e.message);
    }
  }
  
  // If not JSON or JSON parsing failed, check if it's clean markdown
  if (content.trim().startsWith('#')) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    const actualContent = content.replace(/^#\s+.+$/m, '').trim();

    return {
      title,
      subtitle: undefined,
      actualContent,
      isRTL: false,
      targetLanguage: 'en'
    };
  }

  // Fallback: treat as plain text
  const lines = content.split('\n');
  let title = 'Untitled Article';
  
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 10 && line.length < 100 && !line.includes('{') && !line.includes('"')) {
      title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  return {
    title,
    subtitle: undefined,
    actualContent: content,
    isRTL: false,
    targetLanguage: 'en'
  };
}

// 🚀 UPDATED: Always create English-compatible slugs
function generateSlug(title: string, forceSlug?: string): string {
  // If we have a forced English slug from translator, use it
  if (forceSlug && forceSlug.trim()) {
    return forceSlug.trim();
  }
  
  // Try to create slug from title
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-English characters
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
    
  // 🚀 FIXED: If slug is empty or too short (common with non-English titles)
  if (!slug || slug.length < 3) {
    const timestamp = Date.now().toString().slice(-6);
    slug = `article-${timestamp}`;
  }
  
  return slug;
}

function extractExcerpt(content: string): string {
  // Remove markdown syntax and get first meaningful paragraph
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, '') // Remove headings
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .trim();
  
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 20);
  const firstParagraph = paragraphs[0] || cleanContent.split('\n').find(line => line.trim().length > 20) || '';
  
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
      provider: request.provider,
      contentPreview: request.content?.substring(0, 100)
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the AI-generated content properly
    const { title, subtitle, actualContent, slug: forceSlug, isRTL, targetLanguage } = parseAIContent(request.content);
    
    // 🚀 UPDATED: Use forced English slug or generate English-compatible one
    const slug = generateSlug(title, forceSlug);
    const excerpt = extractExcerpt(actualContent);

    console.log('Final parsed content:', { 
      title, 
      subtitle, 
      contentLength: actualContent.length, 
      excerptLength: excerpt.length,
      slug: slug,
      isRTL: isRTL,
      targetLanguage: targetLanguage
    });

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

    // 🚀 UPDATED: Add RTL and language info to author name for identification
    let authorName = `AI Content Generator (${request.provider})`;
    if (targetLanguage && targetLanguage !== 'en') {
      authorName += ` - ${targetLanguage.toUpperCase()}`;
      if (isRTL) {
        authorName += ' RTL';
      }
    }

    // Create the article with properly formatted content
    const articleData = {
      title,
      slug: finalSlug, // 🚀 Always English slug!
      content: actualContent,
      excerpt,
      category: request.category || 'AI Generated',
      author_name: authorName,
      author_avatar_url: null,
      status: status,
      published_date: published_date,
    };

    console.log('Creating article with final data:', {
      title: articleData.title,
      slug: articleData.slug,
      contentLength: articleData.content.length,
      excerptLength: articleData.excerpt.length,
      authorName: articleData.author_name
    });

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
      message: `Article "${title}" created successfully as ${status}`,
      isRTL: isRTL,
      targetLanguage: targetLanguage
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
