// FIXED create-article-from-ai/index.ts
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
  reporterId?: string;
  source_references?: Array<{
    title: string;
    url: string;
    type: string;
    date: string;
  }>;
}

function parseAIContent(content: string): { 
  title: string; 
  subtitle?: string; 
  actualContent: string;
  slug?: string;
  image_url?: string;
  isRTL?: boolean;
  targetLanguage?: string;
} {
  console.log('Raw content received:', content.substring(0, 200) + '...');
  
  // Clean any JSON formatting that might have slipped through
  let cleanedContent = content;
  
  // Remove markdown code blocks if present
  if (content.includes('```json') || content.includes('```')) {
    cleanedContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  // First, try to parse as JSON if it looks like JSON
  if (cleanedContent.trim().startsWith('{') || cleanedContent.includes('"title"') || cleanedContent.includes('"Content"')) {
    try {
      const parsed = JSON.parse(cleanedContent);
      console.log('Parsed JSON structure:', Object.keys(parsed));
      
      const title = parsed.title || parsed.Title || 'Untitled Article';
      const subtitle = parsed.subtitle || parsed.Subtitle || undefined;
      const actualContent = parsed.content || parsed.Content || '';
      
      const slug = parsed.slug || undefined;
      const image_url = parsed.image_url || undefined;
      const isRTL = parsed.isRTL || false;
      const targetLanguage = parsed.targetLanguage || 'en';
      
      console.log('Extracted:', { title, subtitle, contentLength: actualContent.length, slug, image_url, isRTL, targetLanguage });
      
      return {
        title: title.trim(),
        subtitle: subtitle?.trim(),
        actualContent: actualContent.trim(),
        slug: slug,
        image_url: image_url,
        isRTL: isRTL,
        targetLanguage: targetLanguage
      };
    } catch (e) {
      console.log('Failed to parse as JSON, treating as markdown:', e.message);
    }
  }
  
  // If not JSON or JSON parsing failed, treat as markdown content
  const lines = content.split('\n').filter(line => line.trim() !== '');
  let title = 'Untitled Article';
  let actualContent = content;
  
  // Look for various title formats
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for markdown headings (# Title)
    if (line.startsWith('#')) {
      title = line.replace(/^#+\s*/, '').trim();
      // Remove the title line from content
      actualContent = content.replace(line, '').trim();
      break;
    }
    // Check for bold titles (**Title**)
    else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      title = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      // Remove the title line from content
      actualContent = content.replace(line, '').trim();
      break;
    }
    // Check for lines that look like titles (reasonable length, no special chars)
    else if (line.length > 10 && line.length < 120 && 
             !line.includes('{') && !line.includes('"') && 
             !line.includes('http') && !line.includes('www') &&
             !line.includes('://') && !line.includes('@')) {
      
      // Clean up potential title
      let potentialTitle = line
        .replace(/^\*\*/, '')  // Remove leading **
        .replace(/\*\*$/, '')  // Remove trailing **
        .replace(/^#+\s*/, '') // Remove markdown headers
        .replace(/^\d+\.\s*/, '') // Remove numbered list format
        .replace(/^-\s*/, '')  // Remove bullet points
        .trim();
      
      // If it looks like a reasonable title
      if (potentialTitle.length > 5 && potentialTitle.length < 120) {
        title = potentialTitle;
        // Remove the title line from content
        actualContent = content.replace(line, '').trim();
        break;
      }
    }
  }

  // Clean up the title further
  title = title
    .replace(/^\*\*/, '')  // Remove any remaining **
    .replace(/\*\*$/, '')  // Remove any remaining **
    .replace(/^#+\s*/, '') // Remove any remaining #
    .trim();

  // If title is still problematic, create a basic one
  if (!title || title.length < 3 || title === 'Untitled Article') {
    title = 'Generated Article';
  }

  console.log('Final extracted title:', title);

  return {
    title,
    subtitle: undefined,
    actualContent,
    isRTL: false,
    targetLanguage: 'en'
  };
}

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
    
  // If slug is empty or too short (common with non-English titles)
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

// SEO Analysis Function
async function calculateSEOScore(title: string, content: string): Promise<{score: number, details: any}> {
  let score = 0;
  const details: any = {
    title_analysis: {},
    content_analysis: {},
    readability: {},
    structure: {},
    analyzed_at: new Date().toISOString()
  };
  
  // Title Analysis (25 points)
  if (title) {
    const titleLength = title.length;
    if (titleLength >= 30 && titleLength <= 60) {
      score += 25;
      details.title_analysis.score = 25;
      details.title_analysis.status = "optimal";
    } else if (titleLength >= 20 && titleLength <= 80) {
      score += 15;
      details.title_analysis.score = 15;
      details.title_analysis.status = "good";
    } else {
      score += 5;
      details.title_analysis.score = 5;
      details.title_analysis.status = "needs_improvement";
    }
    details.title_analysis.length = titleLength;
    details.title_analysis.optimal_range = "30-60 characters";
  }
  
  // Content Length Analysis (25 points)
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount >= 300) {
    score += 25;
    details.content_analysis.score = 25;
    details.content_analysis.status = "optimal";
  } else if (wordCount >= 150) {
    score += 15;
    details.content_analysis.score = 15;
    details.content_analysis.status = "good";
  } else {
    score += 5;
    details.content_analysis.score = 5;
    details.content_analysis.status = "too_short";
  }
  details.content_analysis.word_count = wordCount;
  details.content_analysis.optimal_count = "300+ words";
  
  // Heading Structure Analysis (25 points)
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  const headingCount = headings.length;
  if (headingCount >= 3) {
    score += 25;
    details.structure.score = 25;
    details.structure.status = "excellent";
  } else if (headingCount >= 1) {
    score += 15;
    details.structure.score = 15;
    details.structure.status = "good";
  } else {
    score += 0;
    details.structure.score = 0;
    details.structure.status = "no_headings";
  }
  details.structure.heading_count = headingCount;
  details.structure.optimal_count = "3+ headings";
  
  // Readability Analysis (25 points)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / (sentences.length || 1);
  if (avgWordsPerSentence <= 20) {
    score += 25;
    details.readability.score = 25;
    details.readability.status = "excellent";
  } else if (avgWordsPerSentence <= 30) {
    score += 15;
    details.readability.score = 15;
    details.readability.status = "good";
  } else {
    score += 5;
    details.readability.score = 5;
    details.readability.status = "complex";
  }
  details.readability.avg_words_per_sentence = Math.round(avgWordsPerSentence);
  details.readability.sentence_count = sentences.length;
  details.readability.optimal_range = "15-20 words per sentence";
  
  // Overall Assessment
  details.overall_score = Math.min(100, score);
  if (score >= 80) {
    details.grade = "A";
    details.assessment = "Excellent SEO optimization";
  } else if (score >= 60) {
    details.grade = "B";
    details.assessment = "Good SEO optimization";
  } else if (score >= 40) {
    details.grade = "C";
    details.assessment = "Needs improvement";
  } else {
    details.grade = "D";
    details.assessment = "Poor SEO optimization";
  }
  
  return { score: Math.min(100, score), details };
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

    // 🔥 FIX: Use Deno.env.get() instead of process.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the AI-generated content properly
    const { title, subtitle, actualContent, slug: forceSlug, image_url, isRTL, targetLanguage } = parseAIContent(request.content);
    
    // Generate English-compatible slug
    const slug = generateSlug(title, forceSlug);
    const excerpt = extractExcerpt(actualContent);

    console.log('Final parsed content:', { 
      title, 
      subtitle, 
      contentLength: actualContent.length, 
      excerptLength: excerpt.length,
      slug: slug,
      image_url: image_url,
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
    const published_date = status === 'published' ? new Date().toISOString() : new Date().toISOString();

    // Get reporter info if reporterId is provided
    let authorName = `AI Content Generator (${request.provider})`;
    let authorAvatarUrl = null;
    
    if (request.reporterId) {
      console.log('Fetching reporter info for ID:', request.reporterId);
      const { data: reporter, error: reporterError } = await supabase
        .from('reporters')
        .select('name, avatar_url')
        .eq('id', request.reporterId)
        .eq('is_active', true)
        .single();
      
      if (reporter && !reporterError) {
        authorName = reporter.name;
        authorAvatarUrl = reporter.avatar_url;
        console.log('Using reporter info:', { name: authorName, avatar: authorAvatarUrl });
      } else {
        console.warn('Failed to fetch reporter or reporter not found:', reporterError);
      }
    }
    
    // Add RTL and language info to author name for identification (only for AI-generated)
    if (!request.reporterId && targetLanguage && targetLanguage !== 'en') {
      authorName += ` - ${targetLanguage.toUpperCase()}`;
      if (isRTL) {
        authorName += ' RTL';
      }
    }

    // Calculate SEO score
    const { score: seoScore, details: seoDetails } = await calculateSEOScore(title, actualContent);
        
    // Create the article with properly formatted content INCLUDING SEO DATA
    const articleData = {
      title,
      slug: finalSlug,
      content: actualContent,
      excerpt,
      image_url: image_url || null,
      category: request.category || 'AI Generated',
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      reporter_id: request.reporterId || null,
      status: status,
      published_date: published_date,
      seo_score: seoScore,
      seo_details: seoDetails,
      source_references: request.source_references || [] // Will be populated by workflows later
    };

    console.log('Creating article with final data:', {
      title: articleData.title,
      slug: articleData.slug,
      contentLength: articleData.content.length,
      excerptLength: articleData.excerpt.length,
      image_url: articleData.image_url,
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
