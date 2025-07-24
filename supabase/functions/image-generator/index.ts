// supabase/functions/image-generator/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// 🎨 GOOGLE IMAGEN 3 GENERATION
async function generateWithGoogleImagen3(prompt, size, quality) {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) throw new Error('Google API key not configured.');
  
  console.log(`🎨 Generating with Google Imagen 3... Size: ${size}`);
  
  const sizeToAspect = {
    '1024x1024': '1:1',
    '1152x896': '4:3',
    '896x1152': '3:4',
    '1536x640': '16:9',
    '640x1536': '9:16',
    '1024x1536': '9:16',
    '1536x1024': '16:9'
  };
  
  const aspectRatio = sizeToAspect[size] || '1:1';
  
  const correctUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${googleApiKey}`;
  
  const requestBody = {
    "instances": [
      {
        "prompt": prompt
      }
    ],
    "parameters": {
      "sampleCount": 1,
      "aspectRatio": aspectRatio
    }
  };
  
  const response = await fetch(correctUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google Imagen 3 Error:', errorText);
    if (response.status === 403) {
      throw new Error(`Google API error (403): Permission denied. Check if the "Vertex AI API" is enabled and your API key is correct.`);
    }
    throw new Error(`Google Imagen 3 API error (${response.status})`);
  }
  
  const data = await response.json();
  
  if (data.predictions?.[0]?.bytesBase64Encoded) {
    return {
      imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
      format: 'base64'
    };
  }
  
  console.error("❌ Unexpected response format from Imagen 3:", data);
  throw new Error('Invalid response format from Google Imagen 3');
}

// 🎨 OPENAI GENERATION (DALL-E 3 and GPT-Image-1)
async function generateWithOpenAI(prompt, size, quality, model) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) throw new Error('OpenAI API key not configured.');
  
  console.log(`🎨 Generating with OpenAI (${model})... Size: ${size}, Quality: ${quality}`);
  
  const requestBody = {
    model: model,
    prompt: prompt,
    size: size,
    quality: quality === 'high' ? 'hd' : 'standard',
    n: 1,
    response_format: 'b64_json'
  };
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`❌ OpenAI (${model}) Error:`, JSON.stringify(errorData, null, 2));
    throw new Error(`OpenAI (${model}) API error (${response.status})`);
  }
  
  const data = await response.json();
  
  if (data.data?.[0]?.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${data.data[0].b64_json}`,
      format: 'base64'
    };
  }
  
  throw new Error(`Invalid response format from OpenAI (${model})`);
}

// 🖼️ FALLBACK PLACEHOLDER IMAGE
function generatePlaceholderImage(prompt, size) {
  let hash = 0;
  for(let i = 0; i < prompt.length; i++){
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const imageId = Math.abs(hash) % 1000;
  const [width, height] = size.split('x');
  const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
  console.log(`🖼️ Generated placeholder image: ${imageUrl}`);
  return imageUrl;
}

// 💾 UPLOAD TO SUPABASE STORAGE
async function uploadImageToStorage(imageData, fileName, format = 'url') {
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  
  let imageBuffer;
  if (format === 'base64') {
    const base64Data = imageData.split(',')[1];
    imageBuffer = Uint8Array.from(atob(base64Data), (c)=>c.charCodeAt(0)).buffer;
  } else {
    const imageResponse = await fetch(imageData);
    if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    imageBuffer = await imageResponse.arrayBuffer();
  }
  
  console.log(`📤 Uploading to storage as: ${fileName}`);
  
  const { error } = await supabase.storage.from('article-images').upload(fileName, imageBuffer, {
    contentType: 'image/jpeg',
    upsert: true
  });
  
  if (error) {
    console.error('❌ Storage upload error:', error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName);
  console.log(`✅ Image uploaded successfully: ${publicUrl}`);
  return publicUrl;
}

// 🔧 BUILD ENHANCED PROMPT
function buildEnhancedPrompt(request) {
  let prompt = request.prompt?.trim() || `High-quality digital artwork representing: "${request.title?.trim()}"`;
  
  if (request.customInstructions?.trim()) {
    prompt += `. Additional style requirements: ${request.customInstructions.trim()}`;
  }
  
  return prompt;
}

// AI MODEL CONFIGURATION (defined after functions to avoid reference errors)
const AI_MODELS = {
  'google-imagen-3': {
    name: 'Google Imagen 3',
    provider: 'google',
    apiCall: generateWithGoogleImagen3
  },
  'openai-gpt-image-1': {
    name: 'OpenAI GPT-Image-1',
    provider: 'openai',
    apiCall: generateWithOpenAI
  },
  'dall-e-3': {
    name: 'DALL-E 3',
    provider: 'openai',
    apiCall: generateWithOpenAI
  }
};

// 🎯 MAIN FUNCTION - Only one serve() call
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });

  try {
    console.log('🚀 Image Generator: Starting...');
    const request = await req.json();
    const { aiModel = 'google-imagen-3', size = '1024x1024', quality = 'medium' } = request;

    const modelConfig = AI_MODELS[aiModel];
    if (!modelConfig) {
      throw new Error(`Unsupported AI model: ${aiModel}`);
    }

    const enhancedPrompt = buildEnhancedPrompt(request);
    console.log(`📝 Final enhanced prompt: "${enhancedPrompt}"`);

    const timestamp = Date.now();
    const modelPrefix = aiModel.replace(/[^a-z0-9]/gi, '');
    const fileName = `img-${modelPrefix}-${timestamp}-${size.replace('x', 'by')}.jpg`;

    let imageResult;
    let generatedWith = 'unknown';
    let wasSuccessful = false;

    try {
      console.log(`🎨 Attempting AI generation with ${modelConfig.name}...`);
      imageResult = await modelConfig.apiCall(enhancedPrompt, size, quality, aiModel);
      generatedWith = modelConfig.name;
      wasSuccessful = true;
    } catch (modelError) {
      console.error(`❌ AI generation failed: ${modelError.message}`);
      const placeholderUrl = generatePlaceholderImage(enhancedPrompt, size);
      imageResult = {
        imageUrl: placeholderUrl,
        format: 'url'
      };
      generatedWith = `Placeholder (failed: ${modelConfig.name})`;
    }

    const finalImageUrl = await uploadImageToStorage(imageResult.imageUrl, fileName, imageResult.format);

    const result = {
      success: true,
      imageUrl: finalImageUrl,
      prompt: enhancedPrompt,
      wasAIGenerated: wasSuccessful,
      generatedWith: generatedWith,
      fileName
    };

    console.log(`🎉 Image generation completed!`);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 CRITICAL ERROR in Image Generator:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});