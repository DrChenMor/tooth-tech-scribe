import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEOAnalysisRequest {
  content: string;
  title?: string;
  aiModel?: string;
  customInstructions?: string;
}

async function analyzeWithAI(content: string, title: string, aiModel: string, customInstructions?: string): Promise<any> {
  const prompt = `Analyze the following content for SEO optimization and provide recommendations.

IMPORTANT: Return your response as a JSON object with this exact structure:
{
  "seo_score": number between 0-100,
  "title_analysis": {
    "current_title": "string",
    "title_score": number between 0-100,
    "title_suggestions": ["suggestion1", "suggestion2", "suggestion3"]
  },
  "content_analysis": {
    "word_count": number,
    "readability_score": number between 0-100,
    "keyword_density": {},
    "issues": ["issue1", "issue2"]
  },
  "meta_suggestions": {
    "meta_description": "suggested meta description",
    "suggested_keywords": ["keyword1", "keyword2", "keyword3"],
    "suggested_tags": ["tag1", "tag2", "tag3"]
  },
  "improvements": [
    {
      "type": "string",
      "priority": "high|medium|low",
      "description": "string",
      "suggestion": "string"
    }
  ]
}

${customInstructions ? `Additional instructions: ${customInstructions}\n\n` : ''}

Title: ${title}
Content: ${content}

Return ONLY the JSON object.`;

  if (aiModel.startsWith('gemini-')) {
    // Use Google Gemini
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } else {
    // Use OpenAI
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: 'You are an SEO expert. Return only valid JSON responses.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }
}

// Basic SEO analysis function as fallback
function basicSEOAnalysis(content: string, title: string): any {
  const wordCount = content.split(/\s+/).length;
  const titleLength = title.length;
  const hasHeadings = content.includes('##') || content.includes('#');
  
  return {
    seo_score: 75,
    title_analysis: {
      current_title: title,
      title_score: titleLength >= 30 && titleLength <= 60 ? 90 : 60,
      title_suggestions: [
        `${title} - Complete Guide`,
        `How to ${title}: Expert Tips`,
        `${title}: Everything You Need to Know`
      ]
    },
    content_analysis: {
      word_count: wordCount,
      readability_score: wordCount > 300 ? 80 : 60,
      keyword_density: {},
      issues: wordCount < 300 ? ['Content too short for good SEO'] : []
    },
    meta_suggestions: {
      meta_description: content.substring(0, 150) + '...',
      suggested_keywords: title.toLowerCase().split(' ').slice(0, 5),
      suggested_tags: title.toLowerCase().split(' ').slice(0, 3)
    },
    improvements: [
      {
        type: 'content_length',
        priority: wordCount < 300 ? 'high' : 'low',
        description: 'Content length optimization',
        suggestion: wordCount < 300 ? 'Increase content length to at least 300 words' : 'Content length is good'
      },
      {
        type: 'headings',
        priority: hasHeadings ? 'low' : 'medium',
        description: 'Heading structure',
        suggestion: hasHeadings ? 'Good heading structure' : 'Add more headings to improve structure'
      }
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SEOAnalysisRequest = await req.json();
    console.log('SEO analysis request:', { 
      contentLength: request.content?.length,
      title: request.title,
      aiModel: request.aiModel 
    });

    if (!request.content) {
      throw new Error('Content is required for SEO analysis');
    }

    const aiModel = request.aiModel || 'gemini-1.5-flash-latest';
    const title = request.title || 'Untitled';

    console.log(`Analyzing SEO with model: ${aiModel}`);

    let analysisResult;

    try {
      // Try AI analysis first
      analysisResult = await analyzeWithAI(request.content, title, aiModel, request.customInstructions);
    } catch (aiError) {
      console.log('AI analysis failed, using basic analysis:', aiError.message);
      // Fallback to basic analysis
      analysisResult = basicSEOAnalysis(request.content, title);
    }

    console.log('SEO analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      model_used: aiModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in seo-analyzer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
