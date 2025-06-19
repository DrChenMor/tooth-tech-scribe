import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ImageGenerationRequest {
  prompt: string;
  style?: 'natural' | 'digital_art' | 'photographic' | 'vivid';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  customInstructions?: string;
}

async function generateWithOpenAI(prompt: string, size: string, quality: string, style: string): Promise<string> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured in Supabase secrets');
  }

  console.log(`🎨 Generating image with OpenAI DALL-E: "${prompt.substring(0, 100)}..."`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: quality,
      style: style,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API Error:', errorData);
    throw new Error(errorData.error?.message || 'OpenAI image generation failed');
  }

  const data = await response.json();
  console.log('✅ OpenAI image generated successfully');
  return data.data[0].url;
}

// Mock image generation function (returns high-quality placeholder images)
function generateMockImage(prompt: string, size: string): string {
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
  const [width, height] = size.split('x');
  
  // Use a high-quality placeholder service
  const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  console.log(`🖼️ Generated mock image: ${imageUrl}`);
  return imageUrl;
}

serve(async (req) => {
  // CRITICAL: Handle OPTIONS preflight request FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Image Generator: Starting image generation...');
    
    const request: ImageGenerationRequest = await req.json();
    
    if (!request.prompt) {
      throw new Error('Image prompt is required');
    }

    // Build the full prompt with custom instructions
    let fullPrompt = request.prompt;
    if (request.customInstructions) {
      fullPrompt += `. Additional instructions: ${request.customInstructions}`;
    }

    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const style = request.style || 'natural';

    console.log(`📝 Image prompt: "${fullPrompt}"`);
    console.log(`🎛️ Settings: ${size}, ${quality} quality, ${style} style`);

    let imageUrl: string;
    let generatedWith: string;

    try {
      // Try to use OpenAI DALL-E if API key is available
      imageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
      generatedWith = 'OpenAI DALL-E 3';
    } catch (openAIError) {
      console.log('⚠️ OpenAI generation failed, using high-quality placeholder:', openAIError.message);
      // Fallback to high-quality placeholder image
      imageUrl = generateMockImage(fullPrompt, size);
      generatedWith = 'High-Quality Placeholder';
    }

    const result = {
      success: true,
      imageUrl,
      prompt: fullPrompt,
      size,
      quality,
      style,
      generatedWith,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Image generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Image Generator Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        imageUrl: null,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
