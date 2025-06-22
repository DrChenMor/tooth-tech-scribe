import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
// Note: Vertex AI requires different authentication - see comments below
const googleProjectId = Deno.env.get('GOOGLE_PROJECT_ID');
const googleLocation = Deno.env.get('GOOGLE_LOCATION') || 'us-central1';

// Create a simple hash from text for consistent filenames
function createContentHash(text: string): string {
  let hash = 0;
  for(let i = 0; i < text.length; i++){
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}

async function checkIfImageExists(fileName: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .list('', {
        search: fileName
      });
    
    if (error) {
      console.log('Error checking storage:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);
      console.log(`✅ Found existing image: ${fileName}`);
      return publicUrl;
    }
    
    return null;
  } catch (error) {
    console.log('Error checking for existing image:', error);
    return null;
  }
}

// 🎨 GOOGLE VERTEX AI IMAGE GENERATION
// IMPORTANT: This requires proper authentication setup
// Option 1: Use Google Cloud Service Account with JSON key
// Option 2: Use Google Cloud Run with automatic authentication
async function generateWithVertexAI(prompt: string, aspectRatio: string = "1:1") {
  if (!googleProjectId) {
    throw new Error('Google Project ID not configured');
  }

  console.log(`🎨 Attempting Vertex AI image generation (requires auth setup)`);
  
  // NOTE: Vertex AI requires OAuth2 authentication, not API keys
  // This is a simplified example - actual implementation needs:
  // 1. Service account JSON key stored securely
  // 2. OAuth2 token generation
  // 3. Proper authentication headers
  
  // For now, throwing an error with guidance
  throw new Error(
    'Vertex AI image generation requires OAuth2 authentication. ' +
    'Please use OpenAI DALL-E or set up proper Google Cloud authentication. ' +
    'See: https://cloud.google.com/vertex-ai/docs/authentication'
  );

  // When properly authenticated, the API call would look like:
  /*
  const endpoint = `https://${googleLocation}-aiplatform.googleapis.com/v1/projects/${googleProjectId}/locations/${googleLocation}/publishers/google/models/imagen-3.0-generate-001:predict`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`, // OAuth2 token needed
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        // addWatermark: false, // if available
      }
    })
  });
  */
}

// 🎨 OPENAI DALL-E IMAGE GENERATION (WORKING)
async function generateWithOpenAI(prompt: string, size: string, quality: string, style: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  console.log(`🎨 Generating image with OpenAI DALL-E: "${prompt.substring(0, 100)}..."`);
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: quality,
      style: style,
      n: 1
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API Error:', errorData);
    throw new Error(errorData.error?.message || 'OpenAI image generation failed');
  }
  
  const data = await response.json();
  console.log('✅ OpenAI DALL-E generated successfully');
  return data.data[0].url;
}

// 🖼️ FALLBACK PLACEHOLDER IMAGE
function generatePlaceholderImage(prompt: string, size: string): string {
  const hash = createContentHash(prompt);
  const imageId = parseInt(hash) % 1000;
  const [width, height] = size.split('x');
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated consistent placeholder image: ${imageUrl}`);
  return imageUrl;
}

async function uploadImageToStorage(imageUrl: string, fileName: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    console.log(`📥 Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    console.log(`📤 Uploading to storage as: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 Image Generator: Starting...');
    const request = await req.json();
    
    if (!request.prompt) {
      throw new Error('Image prompt is required');
    }
    
    // Build the full prompt with custom instructions
    let fullPrompt = request.prompt;
    if (request.customInstructions) {
      fullPrompt += `. Additional instructions: ${request.customInstructions}`;
    }
    
    const aiModel = request.aiModel || 'dall-e-3';
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const style = request.style || 'natural';
    
    console.log(`🤖 Using AI Model: ${aiModel}`);
    console.log(`📝 Image prompt: "${fullPrompt}"`);
    
    // Create filename based on model + content
    const contentHash = createContentHash(fullPrompt + aiModel + size + style);
    const fileName = `img-${aiModel.replace(/[^a-z0-9]/gi, '')}-${contentHash}-${size.replace('x', 'by')}.jpg`;
    
    console.log(`🔍 Checking for existing image: ${fileName}`);
    
    // Check if image already exists
    const existingImageUrl = await checkIfImageExists(fileName);
    if (existingImageUrl) {
      console.log('🎯 Using existing image instead of generating new one!');
      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: existingImageUrl,
          prompt: fullPrompt,
          aiModel,
          size,
          quality,
          style,
          generatedWith: `Existing Image (${aiModel})`,
          fileName,
          wasReused: true,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Generate new image based on selected model
    console.log('📸 No existing image found, generating new one...');
    let temporaryImageUrl: string;
    let generatedWith: string;
    
    try {
      if (aiModel.includes('vertex') || aiModel.includes('imagen')) {
        // Vertex AI requires OAuth2 authentication
        console.log('⚠️ Vertex AI requested but requires OAuth2 setup');
        console.log('🔄 Falling back to OpenAI DALL-E...');
        temporaryImageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
        generatedWith = 'OpenAI DALL-E 3 (Vertex AI unavailable)';
      } else {
        // Use OpenAI DALL-E
        temporaryImageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
        generatedWith = 'OpenAI DALL-E 3';
      }
    } catch (modelError) {
      console.log(`⚠️ AI generation failed: ${modelError.message}`);
      console.log('🔄 Falling back to placeholder image...');
      temporaryImageUrl = generatePlaceholderImage(fullPrompt, size);
      generatedWith = 'High-Quality Placeholder';
    }
    
    // Upload new image to permanent storage
    console.log('💾 Saving NEW image to permanent storage...');
    const permanentImageUrl = await uploadImageToStorage(temporaryImageUrl, fileName);
    
    const result = {
      success: true,
      imageUrl: permanentImageUrl,
      prompt: fullPrompt,
      aiModel,
      size,
      quality,
      style,
      generatedWith,
      fileName,
      wasReused: false,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ NEW image generation completed with ${generatedWith}!`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
