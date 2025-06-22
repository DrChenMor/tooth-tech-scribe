import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
// Create a simple hash from text for consistent filenames
function createContentHash(text) {
  let hash = 0;
  for(let i = 0; i < text.length; i++){
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}
async function checkIfImageExists(fileName) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.storage.from('article-images').list('', {
      search: fileName
    });
    if (error) {
      console.log('Error checking storage:', error);
      return null;
    }
    if (data && data.length > 0) {
      const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName);
      console.log(`✅ Found existing image: ${fileName}`);
      return publicUrl;
    }
    return null;
  } catch (error) {
    console.log('Error checking for existing image:', error);
    return null;
  }
}
// 🎨 GOOGLE GEMINI IMAGE GENERATION (using Imagen)
async function generateWithGemini(prompt, size) {
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }
  console.log(`🎨 Generating image with Google Imagen: "${prompt.substring(0, 100)}..."`);
  // Google's Imagen API endpoint
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
  "instances": [
    {
      "prompt":
    }
  ],
  "parameters": {
    "sampleCount": 1
  }
}
)
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Imagen API Error:', errorData);
    throw new Error(errorData.error?.message || 'Google Imagen generation failed');
  }
  const data = await response.json();
  console.log('✅ Google Imagen generated successfully');
  // Google returns base64 image data
  if (data.candidates && data.candidates[0] && data.candidates[0].image) {
    const base64Data = data.candidates[0].image.data;
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;
    return dataUrl;
  }
  throw new Error('No image data returned from Google Imagen');
}
// 🎨 OPENAI DALL-E IMAGE GENERATION
async function generateWithOpenAI(prompt, size, quality, style) {
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
function generatePlaceholderImage(prompt, size) {
  const hash = createContentHash(prompt);
  const imageId = parseInt(hash) % 1000;
  const [width, height] = size.split('x');
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated consistent placeholder image: ${imageUrl}`);
  return imageUrl;
}
// 🔄 CONVERT BASE64 TO BLOB FOR UPLOAD
async function base64ToBlob(base64Data) {
  // Remove data URL prefix if present
  const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  // Convert base64 to binary
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for(let i = 0; i < binaryString.length; i++){
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
async function uploadImageToStorage(imageUrl, fileName) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let imageBuffer;
    // Handle different image formats
    if (imageUrl.startsWith('data:image')) {
      // Base64 image (from Google Imagen)
      console.log(`📥 Processing base64 image data`);
      imageBuffer = await base64ToBlob(imageUrl);
    } else {
      // URL image (from OpenAI or placeholder)
      console.log(`📥 Downloading image from: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      const imageBlob = await imageResponse.blob();
      imageBuffer = await imageBlob.arrayBuffer();
    }
    console.log(`📤 Uploading to storage as: ${fileName}`);
    const { data, error } = await supabase.storage.from('article-images').upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName);
    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
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
    const aiModel = request.aiModel || 'dall-e-3'; // Default to OpenAI
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
      return new Response(JSON.stringify({
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
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Generate new image based on selected model
    console.log('📸 No existing image found, generating new one...');
    let temporaryImageUrl;
    let generatedWith;
    try {
      if (aiModel.includes('gemini') || aiModel.includes('imagen')) {
        // Use Google Imagen
        temporaryImageUrl = await generateWithGemini(fullPrompt, size);
        generatedWith = 'Google Imagen';
      } else if (aiModel.includes('dall-e') || aiModel.includes('gpt') || aiModel.includes('openai')) {
        // Use OpenAI DALL-E
        temporaryImageUrl = await generateWithOpenAI(fullPrompt, size, quality, style);
        generatedWith = 'OpenAI DALL-E 3';
      } else {
        // Unknown model, use placeholder
        throw new Error(`Unsupported image model: ${aiModel}`);
      }
    } catch (modelError) {
      console.log(`⚠️ ${aiModel} generation failed: ${modelError.message}`);
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
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Image Generator Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      imageUrl: null,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
