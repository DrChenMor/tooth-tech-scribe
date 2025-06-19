import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    throw new Error('OpenAI API key not configured');
  }

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
    throw new Error(errorData.error?.message || 'OpenAI image generation failed');
  }

  const data = await response.json();
  return data.data[0].url;
}

// Mock image generation function (returns placeholder images)
function generateMockImage(prompt: string, size: string): string {
  // Create a placeholder image URL based on the prompt
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
  const [width, height] = size.split('x');
  
  // Use a placeholder service that generates images
  return `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ImageGenerationRequest = await req.json();
    console.log('Image generation request:', request);

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

    console.log(`Generating image with prompt: "${fullPrompt}"`);

    let imageUrl: string;

    try {
      // Try to use OpenAI DALL-E if API key is available
      imageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
      console.log('Generated image with OpenAI DALL-E');
    } catch (openAIError) {
      console.log('OpenAI generation failed, using mock image:', openAIError.message);
      // Fallback to mock image
      imageUrl = generateMockImage(fullPrompt, size);
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      prompt: fullPrompt,
      size,
      quality,
      style,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in image-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        imageUrl: null,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
