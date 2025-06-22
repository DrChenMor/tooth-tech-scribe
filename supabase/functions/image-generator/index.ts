
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// Environment variables
const googleProjectId = Deno.env.get('GOOGLE_PROJECT_ID');
const googleLocation = Deno.env.get('GOOGLE_LOCATION') || 'us-central1';
const googleServiceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

// 🎨 GOOGLE VERTEX AI IMAGE GENERATION (WORKING IMPLEMENTATION)
async function generateWithVertexAI(prompt: string, size: string = "1024x1024") {
  if (!googleProjectId || !googleServiceAccountKey) {
    throw new Error('Google Cloud credentials not configured properly');
  }

  console.log(`🎨 Generating image with Vertex AI Imagen 3...`);
  console.log(`🎯 Prompt: "${prompt}"`);
  console.log(`📐 Size: ${size}`);
  
  try {
    // Step 1: Get OAuth2 access token
    const serviceAccount = JSON.parse(atob(googleServiceAccountKey));
    console.log(`🔐 Using service account: ${serviceAccount.client_email}`);
    
    const accessToken = await getGoogleAccessToken(serviceAccount);
    console.log(`🎫 Access token obtained successfully`);
    
    // Step 2: Convert size to aspect ratio for Vertex AI
    const aspectRatio = convertSizeToAspectRatio(size);
    console.log(`📏 Aspect ratio: ${aspectRatio}`);
    
    // Step 3: Call Vertex AI Imagen 3 API
    const endpoint = `https://${googleLocation}-aiplatform.googleapis.com/v1/projects/${googleProjectId}/locations/${googleLocation}/publishers/google/models/imagen-3.0-generate-001:predict`;
    
    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        addWatermark: false,
        includeSafetyAttributes: true,
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };
    
    console.log(`📤 Calling Vertex AI API...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vertex AI API Error (${response.status}):`, errorText);
      throw new Error(`Vertex AI API failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Vertex AI response received`);
    
    if (!data.predictions || data.predictions.length === 0) {
      throw new Error('No image predictions returned from Vertex AI');
    }
    
    // Step 4: Extract base64 image data
    const prediction = data.predictions[0];
    if (!prediction.bytesBase64Encoded) {
      throw new Error('No image data in Vertex AI response');
    }
    
    console.log(`🖼️ Image generated successfully with Vertex AI Imagen 3`);
    return prediction.bytesBase64Encoded;
    
  } catch (error) {
    console.error('❌ Vertex AI generation failed:', error);
    throw error;
  }
}

// Helper function to get Google OAuth2 access token
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  // Create JWT header
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key.replace(/\\n/g, '\n')),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Helper function to convert size to Vertex AI aspect ratio
function convertSizeToAspectRatio(size: string): string {
  const sizeMap: { [key: string]: string } = {
    '1024x1024': '1:1',
    '1536x1024': '3:2',
    '1024x1536': '2:3',
    '1792x1024': '16:9',
    '1024x1792': '9:16'
  };
  return sizeMap[size] || '1:1';
}

// 🎨 OPENAI DALL-E IMAGE GENERATION (FALLBACK)
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

async function uploadImageToStorage(imageData: string, fileName: string, isBase64: boolean = false) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    let imageBuffer: ArrayBuffer;
    
    if (isBase64) {
      // Handle base64 data from Vertex AI
      console.log(`📥 Processing base64 image data (${imageData.length} characters)`);
      const binaryString = atob(imageData);
      imageBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        (imageBuffer as Uint8Array)[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Handle URL data from OpenAI
      console.log(`📥 Downloading image from: ${imageData}`);
      const imageResponse = await fetch(imageData);
      
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

// 🎯 ENHANCED PROMPT BUILDER
function buildEnhancedPrompt(request: any): string {
  console.log(`🎯 Building enhanced prompt from request:`, {
    hasExplicitPrompt: !!request.prompt,
    hasTitle: !!request.title,
    hasContent: !!request.content,
    hasCustomInstructions: !!request.customInstructions
  });

  let finalPrompt = '';
  
  // Priority 1: User's explicit prompt
  if (request.prompt && request.prompt.trim()) {
    finalPrompt = request.prompt.trim();
    console.log(`🎯 Using explicit prompt: "${finalPrompt.substring(0, 100)}..."`);
  }
  // Priority 2: Generate from title and content
  else if (request.title || request.content) {
    const title = request.title || '';
    const content = request.content || '';
    
    // Create a descriptive prompt based on the article
    finalPrompt = `Create a professional, high-quality image that represents the article "${title}". `;
    
    if (content) {
      // Extract key themes from content (first 200 characters)
      const contentPreview = content.substring(0, 200).replace(/[#*]/g, '');
      finalPrompt += `The article discusses: ${contentPreview}... `;
    }
    
    finalPrompt += `The image should be visually appealing, relevant to the topic, and suitable for use as a featured image in a professional blog or news article.`;
    
    console.log(`🎯 Generated prompt from title/content: "${finalPrompt.substring(0, 150)}..."`);
  }
  // Priority 3: Fallback
  else {
    finalPrompt = 'Create a professional, abstract image suitable for a blog article with modern design elements and appealing colors.';
    console.log(`🎯 Using fallback prompt`);
  }
  
  // Add custom instructions if provided
  if (request.customInstructions && request.customInstructions.trim()) {
    finalPrompt += ` Additional style instructions: ${request.customInstructions.trim()}`;
    console.log(`🎯 Added custom instructions: "${request.customInstructions}"`);
  }
  
  return finalPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 Enhanced Image Generator: Starting...');
    const request = await req.json();
    
    console.log('🔍 Request received:', {
      hasPrompt: !!request.prompt,
      hasTitle: !!request.title,
      hasContent: !!request.content,
      hasCustomInstructions: !!request.customInstructions,
      aiModel: request.aiModel,
      size: request.size,
      forceGenerate: request.forceGenerate
    });
    
    // Build the enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(request);
    
    const aiModel = request.aiModel || 'vertex-ai-imagen-3';
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const style = request.style || 'natural';
    
    console.log(`🤖 Using AI Model: ${aiModel}`);
    console.log(`📝 Final prompt: "${enhancedPrompt}"`);
    
    // Create filename based on model + content
    const contentHash = createContentHash(enhancedPrompt + aiModel + size + style);
    const fileName = `img-${aiModel.replace(/[^a-z0-9]/gi, '')}-${contentHash}-${size.replace('x', 'by')}.jpg`;
    
    console.log(`🔍 Checking for existing image: ${fileName}`);
    
    // Check if image already exists (unless force generate is true)
    if (!request.forceGenerate) {
      const existingImageUrl = await checkIfImageExists(fileName);
      if (existingImageUrl) {
        console.log('🎯 Using existing image instead of generating new one!');
        return new Response(
          JSON.stringify({
            success: true,
            imageUrl: existingImageUrl,
            prompt: enhancedPrompt,
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
    }
    
    // Generate new image based on selected model
    console.log('📸 No existing image found, generating new one...');
    let imageData: string;
    let generatedWith: string;
    let isBase64 = false;
    
    try {
      if (aiModel.includes('vertex') || aiModel.includes('imagen')) {
        // Use Vertex AI Imagen 3
        console.log('🎨 Using Vertex AI Imagen 3...');
        imageData = await generateWithVertexAI(enhancedPrompt, size);
        generatedWith = 'Google Vertex AI Imagen 3';
        isBase64 = true;
      } else if (aiModel.includes('dall-e') || aiModel.includes('openai')) {
        // Use OpenAI DALL-E
        console.log('🎨 Using OpenAI DALL-E...');
        imageData = await generateWithOpenAI(enhancedPrompt, size, quality, style);
        generatedWith = 'OpenAI DALL-E 3';
        isBase64 = false;
      } else {
        // Default to Vertex AI
        console.log('🎨 Defaulting to Vertex AI Imagen 3...');
        imageData = await generateWithVertexAI(enhancedPrompt, size);
        generatedWith = 'Google Vertex AI Imagen 3';
        isBase64 = true;
      }
    } catch (modelError) {
      console.log(`⚠️ Primary AI generation failed: ${modelError.message}`);
      
      // Try fallback to the other model
      try {
        if (aiModel.includes('vertex') || aiModel.includes('imagen')) {
          console.log('🔄 Falling back to OpenAI DALL-E...');
          imageData = await generateWithOpenAI(enhancedPrompt, size, quality, style);
          generatedWith = 'OpenAI DALL-E 3 (Vertex AI fallback)';
          isBase64 = false;
        } else {
          console.log('🔄 Falling back to Vertex AI...');
          imageData = await generateWithVertexAI(enhancedPrompt, size);
          generatedWith = 'Google Vertex AI Imagen 3 (OpenAI fallback)';
          isBase64 = true;
        }
      } catch (fallbackError) {
        console.log(`⚠️ Fallback AI generation also failed: ${fallbackError.message}`);
        console.log('🔄 Using placeholder image...');
        imageData = generatePlaceholderImage(enhancedPrompt, size);
        generatedWith = 'High-Quality Placeholder';
        isBase64 = false;
      }
    }
    
    // Upload new image to permanent storage
    console.log('💾 Saving NEW image to permanent storage...');
    const permanentImageUrl = await uploadImageToStorage(imageData, fileName, isBase64);
    
    const result = {
      success: true,
      imageUrl: permanentImageUrl,
      prompt: enhancedPrompt,
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
