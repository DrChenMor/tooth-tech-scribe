import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// 🔧 Configuration for different AI models
const AI_MODELS = {
  'google-imagen-3': {
    name: 'Google Imagen 3',
    provider: 'google',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage',
    requiresAuth: 'GOOGLE_API_KEY',
    supportedSizes: ['1024x1024', '1152x896', '896x1152', '1536x640', '640x1536'],
    pricing: '$0.03 per image'
  },
  'openai-gpt-image-1': {
    name: 'OpenAI GPT-Image-1',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/images/generations',
    requiresAuth: 'OPENAI_API_KEY',
    supportedSizes: ['1024x1024', '1024x1536', '1536x1024'],
    pricing: 'Token-based pricing'
  }
};

// 🎨 GOOGLE IMAGEN 3 GENERATION
async function generateWithGoogleImagen3(prompt: string, size: string, aspectRatio?: string) {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  
  if (!googleApiKey) {
    console.error('❌ Google API key not found');
    throw new Error('Google API key not configured. Please add GOOGLE_API_KEY to Supabase secrets.');
  }

  console.log('🎨 Generating with Google Imagen 3...');
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`📐 Size: ${size}`);

  // Clean and enhance prompt for Imagen 3
  let cleanPrompt = prompt.trim();
  if (cleanPrompt.length < 20) {
    cleanPrompt = `High-quality, detailed artistic representation of ${cleanPrompt}, professional composition, excellent lighting`;
  }

  // Imagen 3 specific request body
  const requestBody = {
    prompt: cleanPrompt,
    aspectRatio: aspectRatio || '1:1', // '1:1', '9:16', '16:9', '4:3', '3:4'
    config: {
      aspectRatio: aspectRatio || '1:1',
      negativePrompt: 'blurry, low quality, distorted, deformed',
      outputMimeType: 'image/jpeg'
    }
  };

  console.log('📡 Sending to Google Imagen 3:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📡 Google Imagen 3 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Google Imagen 3 Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Google API key is invalid or expired.');
      } else if (response.status === 403) {
        throw new Error('Google API access denied. Check if Imagen 3 is enabled for your project.');
      } else if (response.status === 400) {
        throw new Error(`Google Imagen 3 rejected the request: Invalid prompt or parameters.`);
      } else {
        throw new Error(`Google Imagen 3 API error (${response.status}): ${errorData}`);
      }
    }

    const data = await response.json();
    console.log('✅ Google Imagen 3 generated successfully!');

    // Google returns base64 image data
    if (data.generatedImage && data.generatedImage.imageBytes) {
      // Convert base64 to data URL
      const imageUrl = `data:image/jpeg;base64,${data.generatedImage.imageBytes}`;
      return { imageUrl, format: 'base64' };
    } else {
      console.error('❌ Unexpected response format from Google Imagen 3:', data);
      throw new Error('Invalid response format from Google Imagen 3');
    }

  } catch (fetchError) {
    console.error('❌ Network error with Google Imagen 3:', fetchError);
    throw fetchError;
  }
}

// 🎨 OPENAI GPT-IMAGE-1 GENERATION
async function generateWithOpenAIGPTImage1(prompt: string, size: string, quality: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('❌ OpenAI API key not found');
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.');
  }

  console.log('🎨 Generating with OpenAI GPT-Image-1...');
  console.log(`📝 Prompt: "${prompt}"`);
  console.log(`📐 Size: ${size}, Quality: ${quality}`);

  // Clean and enhance prompt for GPT-Image-1
  let cleanPrompt = prompt.trim();
  if (cleanPrompt.length < 20) {
    cleanPrompt = `High-quality, detailed artistic representation of ${cleanPrompt}, professional composition, excellent lighting`;
  }

  // Validate size for GPT-Image-1
  const validSizes = ['1024x1024', '1024x1536', '1536x1024'];
  const validSize = validSizes.includes(size) ? size : '1024x1024';

  // Validate quality
  const validQualities = ['low', 'medium', 'high'];
  const validQuality = validQualities.includes(quality) ? quality : 'medium';

  const requestBody = {
    model: 'gpt-image-1',
    prompt: cleanPrompt,
    size: validSize,
    quality: validQuality,
    n: 1,
    output_format: 'b64_json', // GPT-Image-1 returns base64
    background: 'auto'
  };

  console.log('📡 Sending to OpenAI GPT-Image-1:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📡 OpenAI GPT-Image-1 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI GPT-Image-1 Error:', JSON.stringify(errorData, null, 2));
      
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (response.status === 403) {
        throw new Error('OpenAI API access denied. Your account may need verification for GPT-Image-1.');
      } else if (response.status === 400) {
        const errorMsg = errorData.error?.message || 'Bad request';
        if (errorMsg.includes('safety') || errorMsg.includes('policy')) {
          throw new Error(`OpenAI rejected the prompt for safety reasons: ${errorMsg}`);
        } else {
          throw new Error(`OpenAI GPT-Image-1 validation error: ${errorMsg}`);
        }
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded.');
      } else {
        throw new Error(`OpenAI GPT-Image-1 API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    console.log('✅ OpenAI GPT-Image-1 generated successfully!');

    // OpenAI returns base64 image data
    if (data.data && data.data[0] && data.data[0].b64_json) {
      const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      return { imageUrl, format: 'base64' };
    } else {
      console.error('❌ Unexpected response format from OpenAI GPT-Image-1:', data);
      throw new Error('Invalid response format from OpenAI GPT-Image-1');
    }

  } catch (fetchError) {
    console.error('❌ Network error with OpenAI GPT-Image-1:', fetchError);
    throw fetchError;
  }
}

// 🖼️ FALLBACK PLACEHOLDER IMAGE
function generatePlaceholderImage(prompt: string, size: string): string {
  let hash = 0;
  for(let i = 0; i < prompt.length; i++){
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const imageId = Math.abs(hash) % 1000;
  const [width, height] = size.split('x');
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated placeholder image: ${imageUrl}`);
  return imageUrl;
}

// 💾 UPLOAD TO SUPABASE STORAGE
async function uploadImageToStorage(imageData: string, fileName: string, format: 'base64' | 'url' = 'url') {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let imageBuffer: ArrayBuffer;
    
    if (format === 'base64') {
      // Convert base64 data URL to buffer
      const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
      console.log(`📥 Converted base64 image (${bytes.length} bytes)`);
    } else {
      // Download from URL
      console.log(`📥 Downloading image from: ${imageData.substring(0, 50)}...`);
      const imageResponse = await fetch(imageData);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      
      imageBuffer = await imageResponse.arrayBuffer();
      console.log(`📥 Downloaded image (${imageBuffer.byteLength} bytes)`);
    }
    
    console.log(`📤 Uploading to storage as: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);
    
    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to storage:', error);
    throw error;
  }
}

// 🔧 BUILD ENHANCED PROMPT
function buildEnhancedPrompt(request: any): string {
  let prompt = '';
  
  if (request.prompt && request.prompt.trim()) {
    prompt = request.prompt.trim();
    console.log('✅ Using user-provided explicit prompt');
  } else if (request.title && request.title.trim()) {
    const title = request.title.trim();
    prompt = `Professional, high-quality digital artwork representing the concept: "${title}". Modern design, excellent composition, proper lighting, contemporary aesthetic, suitable for article illustration`;
    console.log('✅ Generated enhanced prompt from title');
  } else if (request.content && request.content.trim()) {
    const contentPreview = request.content.substring(0, 150);
    prompt = `Professional artistic illustration representing: "${contentPreview}". High-quality digital art, modern design, excellent composition`;
    console.log('✅ Generated enhanced prompt from content');
  } else {
    prompt = 'Professional, modern, minimalist digital artwork. High-quality illustration with excellent composition, contemporary design, suitable for blog article';
    console.log('⚠️ Using enhanced default prompt');
  }
  
  // Add custom instructions naturally
  if (request.customInstructions && request.customInstructions.trim()) {
    const instructions = request.customInstructions.trim();
    prompt = `${prompt}. Additional style requirements: ${instructions}`;
  }
  
  return prompt;
}

// 🎯 MAIN FUNCTION
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 NEW Image Generator: Starting...');
    const request = await req.json();
    
    console.log('📋 Request summary:', {
      hasPrompt: !!request.prompt,
      hasTitle: !!request.title,
      hasContent: !!request.content,
      aiModel: request.aiModel,
      size: request.size
    });
    
    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(request);
    console.log(`📝 Final enhanced prompt: "${enhancedPrompt}"`);
    
    const aiModel = request.aiModel || 'google-imagen-3';
    const size = request.size || '1024x1024';
    const quality = request.quality || 'medium';
    
    console.log(`🤖 Selected AI Model: ${aiModel}`);
    console.log(`📐 Image settings: ${size}, quality: ${quality}`);
    
    // Generate filename
    const timestamp = Date.now();
    const modelPrefix = aiModel.replace(/[^a-z0-9]/gi, '');
    const fileName = `img-${modelPrefix}-${timestamp}-${size.replace('x', 'by')}.jpg`;
    console.log(`📁 Image filename: ${fileName}`);
    
    // 🎨 TRY AI GENERATION
    let imageResult: any;
    let generatedWith: string;
    let wasSuccessful = false;
    
    try {
      console.log('🎨 Attempting AI image generation...');
      
      if (aiModel === 'google-imagen-3') {
        // Convert size to aspect ratio for Google
        let aspectRatio = '1:1';
        if (size === '1152x896') aspectRatio = '9:7';
        else if (size === '896x1152') aspectRatio = '7:9';
        else if (size === '1536x640') aspectRatio = '12:5';
        else if (size === '640x1536') aspectRatio = '5:12';
        
        imageResult = await generateWithGoogleImagen3(enhancedPrompt, size, aspectRatio);
        generatedWith = 'Google Imagen 3';
      } else if (aiModel === 'openai-gpt-image-1') {
        imageResult = await generateWithOpenAIGPTImage1(enhancedPrompt, size, quality);
        generatedWith = 'OpenAI GPT-Image-1';
      } else {
        throw new Error(`Unsupported AI model: ${aiModel}`);
      }
      
      wasSuccessful = true;
      console.log(`✅ AI generation successful with ${generatedWith}!`);
      
    } catch (modelError) {
      console.log(`❌ AI generation failed: ${modelError.message}`);
      console.log('🔄 Falling back to placeholder image...');
      
      const placeholderUrl = generatePlaceholderImage(enhancedPrompt, size);
      imageResult = { imageUrl: placeholderUrl, format: 'url' };
      generatedWith = `High-Quality Placeholder (${aiModel} failed)`;
      wasSuccessful = false;
    }
    
    // 💾 UPLOAD TO STORAGE
    console.log('💾 Uploading image to storage...');
    let finalImageUrl: string;
    
    try {
      finalImageUrl = await uploadImageToStorage(
        imageResult.imageUrl, 
        fileName, 
        imageResult.format || 'url'
      );
      console.log('✅ Upload successful!');
    } catch (uploadError) {
      console.log(`❌ Upload failed: ${uploadError.message}`);
      console.log('🔄 Using temporary URL as fallback...');
      finalImageUrl = imageResult.imageUrl;
    }
    
    // 📊 RETURN RESULT
    const result = {
      success: true,
      imageUrl: finalImageUrl,
      prompt: enhancedPrompt,
      aiModel,
      size,
      quality,
      generatedWith,
      fileName,
      wasAIGenerated: wasSuccessful,
      supportedModels: Object.keys(AI_MODELS),
      modelInfo: AI_MODELS[aiModel as keyof typeof AI_MODELS] || null,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🎉 Image generation completed!`);
    console.log(`📊 Final result: ${wasSuccessful ? 'AI Generated' : 'Placeholder'} - ${generatedWith}`);
    
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
    console.error('💥 CRITICAL ERROR in New Image Generator:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check the Edge Function logs for detailed error information',
        supportedModels: Object.keys(AI_MODELS),
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
