import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

interface ImageGenerationRequest {
  prompt: string;
  aiModel?: string;
  style?: 'natural' | 'digital_art' | 'photographic' | 'vivid';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  customInstructions?: string;
  title?: string;
  content?: string;
  forceGenerate?: boolean;
}

// Create hash function
function createContentHash(text: string): string {
  let hash = 0;
  if (text.length === 0) return hash.toString();
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const positiveHash = Math.abs(hash);
  const timeComponent = Date.now().toString().slice(-4);
  return `${positiveHash}-${timeComponent}`;
}

// ALWAYS create unique filename with timestamp
function createUniqueFileName(finalPrompt: string, aiModel: string, size: string, style: string): string {
  const timestamp = Date.now();
  const randomComponent = Math.random().toString(36).substring(2, 8);
  const uniqueContent = `${finalPrompt}|${aiModel}|${size}|${style}|${timestamp}|${randomComponent}`;
  const hash = createContentHash(uniqueContent);
  const modelName = aiModel.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const sizeFormatted = size.replace('x', 'by');
  
  return `img-${modelName}-${hash}-${timestamp}-${sizeFormatted}.jpg`;
}

// DISABLED: We will skip cache checking for now to force new generation
async function checkIfImageExists(fileName: string): Promise<string | null> {
  console.log('🚫 Cache checking DISABLED - Always generating new images');
  return null; // Always return null to force new generation
}

// OpenAI DALL-E generation
async function generateWithOpenAI(prompt: string, size: string, quality: string, style: string): Promise<string> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
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
  console.log('✅ OpenAI DALL-E generated successfully');
  return data.data[0].url;
}

// Google Imagen generation (simplified for testing)
async function generateWithGemini(prompt: string, size: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error('Google API key not configured');
  }

  console.log(`🎨 Attempting Google Imagen generation: "${prompt.substring(0, 100)}..."`);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        generationConfig: {
          number_of_images: 1,
          include_rai_info: false,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', errorText);
      throw new Error(`Google API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.generated_images && data.generated_images[0] && data.generated_images[0].image) {
      const base64Data = data.generated_images[0].image.image_bytes;
      if (base64Data) {
        console.log('✅ Google Imagen generated successfully');
        return `data:image/jpeg;base64,${base64Data}`;
      }
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].image) {
      const base64Data = data.candidates[0].image.data;
      if (base64Data) {
        console.log('✅ Google Imagen generated successfully');
        return `data:image/jpeg;base64,${base64Data}`;
      }
    }
    
    throw new Error('No image data in Google response');
    
  } catch (error) {
    console.error('Google generation failed:', error.message);
    throw error;
  }
}

// Placeholder image
function generatePlaceholderImage(prompt: string, size: string): string {
  const hash = createContentHash(prompt);
  const imageId = parseInt(hash) % 1000;
  const [width, height] = size.split('x');
  
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated placeholder image: ${imageUrl}`);
  return imageUrl;
}

// Convert base64 to blob
async function base64ToBlob(base64Data: string): Promise<ArrayBuffer> {
  const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Upload to storage
async function uploadImageToStorage(imageUrl: string, fileName: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let imageBuffer: ArrayBuffer;
    
    if (imageUrl.startsWith('data:image')) {
      console.log(`📥 Processing base64 image data`);
      imageBuffer = await base64ToBlob(imageUrl);
    } else {
      console.log(`📥 Downloading image from: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      const imageBlob = await imageResponse.blob();
      imageBuffer = await imageBlob.arrayBuffer();
    }
    
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

// Build smart prompt
function buildSmartImagePrompt(request: ImageGenerationRequest): string {
  console.log('🧠 Building smart prompt from request:', {
    hasPrompt: !!request.prompt,
    hasTitle: !!request.title,
    hasContent: !!request.content,
    hasCustomInstructions: !!request.customInstructions,
    promptPreview: request.prompt?.substring(0, 50),
    customInstructionsPreview: request.customInstructions?.substring(0, 50)
  });

  let finalPrompt = '';
  let promptSource = '';

  if (request.prompt && request.prompt.trim()) {
    finalPrompt = request.prompt.trim();
    promptSource = 'User Prompt';
    console.log('🎯 Using explicit user prompt as base');
  }
  else if (request.customInstructions && request.customInstructions.trim()) {
    finalPrompt = request.customInstructions.trim();
    promptSource = 'Custom Instructions';
    console.log('🎯 Using custom instructions as base');
  }
  else if (request.title && request.title.trim()) {
    const cleanTitle = request.title.replace(/[#*]/g, '').trim();
    finalPrompt = `Professional, high-quality illustration for an article titled: "${cleanTitle}"`;
    promptSource = 'Article Title';
    console.log('🎯 Built prompt from article title');
  }
  else if (request.content && request.content.trim()) {
    const contentPreview = request.content
      .replace(/[#*]/g, '')
      .split('\n')
      .find(line => line.trim().length > 20) || 
      request.content.substring(0, 100);
    finalPrompt = `Professional illustration for content about: ${contentPreview.trim()}`;
    promptSource = 'Content Preview';
    console.log('🎯 Built prompt from content');
  }
  else {
    finalPrompt = 'Professional, high-quality illustration for a modern technology article';
    promptSource = 'Generic Fallback';
    console.log('🎯 Using generic fallback prompt');
  }

  if (promptSource !== 'User Prompt' && request.title && request.title.trim()) {
    const cleanTitle = request.title.replace(/[#*]/g, '').trim();
    finalPrompt += `. This is for an article titled: "${cleanTitle}"`;
    console.log('🎯 Added title context to prompt');
  }

  if (promptSource !== 'Custom Instructions' && request.customInstructions && request.customInstructions.trim()) {
    finalPrompt += `. Additional instructions: ${request.customInstructions.trim()}`;
    console.log('🎯 Added custom instructions to prompt');
  }

  const qualityTerms = ['professional', 'high-quality', 'high quality'];
  const hasQualityTerms = qualityTerms.some(term => 
    finalPrompt.toLowerCase().includes(term.toLowerCase())
  );

  if (!hasQualityTerms) {
    finalPrompt += '. Style: professional, high-quality';
  }

  console.log('🎯 Final prompt built:', {
    source: promptSource,
    length: finalPrompt.length,
    preview: finalPrompt.substring(0, 100) + '...'
  });

  return finalPrompt;
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 FIXED Image Generator: Starting...');
    
    const request: ImageGenerationRequest = await req.json();
    
    console.log('📝 Received request:', {
      hasPrompt: !!request.prompt,
      promptPreview: request.prompt?.substring(0, 50),
      aiModel: request.aiModel,
      forceGenerate: request.forceGenerate
    });

    const smartPrompt = buildSmartImagePrompt(request);
    const aiModel = request.aiModel || 'dall-e-3';
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const style = request.style || 'natural';

    console.log(`🤖 Using AI Model: ${aiModel}`);
    console.log(`📝 Smart prompt: "${smartPrompt}"`);

    const fileName = createUniqueFileName(smartPrompt, aiModel, size, style);
    console.log(`🔍 Generated unique filename: ${fileName}`);

    // FORCE NEW GENERATION - NO CACHE
    console.log('🔄 ALWAYS GENERATING FRESH IMAGE - Cache disabled for testing');

    let temporaryImageUrl: string;
    let generatedWith: string;

    try {
      if (aiModel.includes('dall-e') || aiModel.includes('gpt') || aiModel.includes('openai')) {
        temporaryImageUrl = await generateWithOpenAI(smartPrompt, size, quality, style);
        generatedWith = 'OpenAI DALL-E 3';
      } else if (aiModel.includes('gemini') || aiModel.includes('imagen')) {
        temporaryImageUrl = await generateWithGemini(smartPrompt, size);
        generatedWith = 'Google Imagen 3';
      } else {
        throw new Error(`Unsupported image model: ${aiModel}`);
      }
    } catch (modelError) {
      console.log(`⚠️ AI generation failed: ${modelError.message}`);
      console.log('🔄 Using placeholder image...');
      
      temporaryImageUrl = generatePlaceholderImage(smartPrompt, size);
      generatedWith = 'Placeholder (AI Failed)';
    }

    console.log('💾 Saving NEW image to permanent storage...');
    const permanentImageUrl = await uploadImageToStorage(temporaryImageUrl, fileName);

    const result = {
      success: true,
      imageUrl: permanentImageUrl,
      prompt: smartPrompt,
      aiModel,
      size,
      quality,
      style,
      generatedWith,
      fileName,
      wasReused: false,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ FIXED: Image generation completed with ${generatedWith}!`);

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
