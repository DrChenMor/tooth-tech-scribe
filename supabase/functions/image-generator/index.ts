import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

// Generate a consistent mock image (same prompt = same image)
function generateMockImage(prompt: string, size: string): string {
  // Create a hash-like number from the prompt for consistency
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const imageId = Math.abs(hash) % 1000; // Use hash for consistent image
  const [width, height] = size.split('x');
  
  // Use a consistent placeholder image based on prompt hash
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated consistent mock image: ${imageUrl}`);
  return imageUrl;
}

async function uploadImageToStorage(imageUrl: string, fileName: string): Promise<string> {
  try {
    console.log(`📥 Downloading image from: ${imageUrl}`);
    
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`📤 Uploading to storage as: ${fileName}`);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);
    
    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle OPTIONS preflight request
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

    // Create a unique filename based on prompt hash
    let hash = 0;
    for (let i = 0; i < fullPrompt.length; i++) {
      const char = fullPrompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const fileName = `generated-${Math.abs(hash)}-${size.replace('x', 'by')}.jpg`;

    let temporaryImageUrl: string;
    let generatedWith: string;

    try {
      // Try to use OpenAI DALL-E if API key is available
      temporaryImageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
      generatedWith = 'OpenAI DALL-E 3';
    } catch (openAIError) {
      console.log('⚠️ OpenAI generation failed, using high-quality placeholder:', openAIError.message);
      // Fallback to consistent mock image
      temporaryImageUrl = generateMockImage(fullPrompt, size);
      generatedWith = 'High-Quality Placeholder';
    }

    // Upload image to permanent storage
    console.log('💾 Saving image to permanent storage...');
    const permanentImageUrl = await uploadImageToStorage(temporaryImageUrl, fileName);

    const result = {
      success: true,
      imageUrl: permanentImageUrl, // Return the permanent URL
      prompt: fullPrompt,
      size,
      quality,
      style,
      generatedWith,
      fileName,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Image generation and storage completed:', result);

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
