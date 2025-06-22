import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// 🎨 SIMPLE IMAGE GENERATION WITH BETTER ERROR HANDLING
async function generateWithOpenAI(prompt: string, size: string, quality: string, style: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  // 🔍 STEP 1: Check if we have the API key
  if (!openAIApiKey) {
    console.error('❌ FATAL: OpenAI API key not found in environment variables');
    console.error('📝 Please add OPENAI_API_KEY to your Supabase Edge Function secrets');
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.');
  }
  
  // 🔍 STEP 2: Log what we're trying to do
  console.log(`🎨 Attempting to generate image with OpenAI DALL-E`);
  console.log(`📝 Prompt: "${prompt.substring(0, 100)}..."`);
  console.log(`📐 Size: ${size}, Quality: ${quality}, Style: ${style}`);
  console.log(`🔑 API Key exists: ${openAIApiKey ? 'YES' : 'NO'}`);
  console.log(`🔑 API Key length: ${openAIApiKey ? openAIApiKey.length : 0} characters`);
  console.log(`🔑 API Key starts with: ${openAIApiKey ? openAIApiKey.substring(0, 8) + '...' : 'N/A'}`);
  
  try {
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
    
    // 🔍 STEP 3: Check the response status
    console.log(`📡 OpenAI API Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error Details:', JSON.stringify(errorData, null, 2));
      
      // 🔍 STEP 4: Give helpful error messages
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or expired. Please check your API key in Supabase secrets.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error(`OpenAI API rejected the request: ${errorData.error?.message || 'Bad request'}`);
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }
    
    const data = await response.json();
    console.log('✅ OpenAI DALL-E generated successfully!');
    console.log(`🖼️ Image URL received: ${data.data[0].url.substring(0, 50)}...`);
    return data.data[0].url;
    
  } catch (fetchError) {
    console.error('❌ Network or API Error:', fetchError);
    if (fetchError.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to OpenAI API. Check your internet connection.');
    }
    throw fetchError;
  }
}

// 🖼️ FALLBACK PLACEHOLDER IMAGE
function generatePlaceholderImage(prompt: string, size: string): string {
  // Create a simple hash for consistent images
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

async function uploadImageToStorage(imageUrl: string, fileName: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`📥 Downloading image from: ${imageUrl.substring(0, 50)}...`);
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 Image Generator: Starting...');
    const request = await req.json();
    
    // 🔍 STEP 1: Validate the request
    console.log('📋 Request details:', {
      hasPrompt: !!request.prompt,
      hasTitle: !!request.title,
      hasContent: !!request.content,
      aiModel: request.aiModel,
      forceGenerate: request.forceGenerate
    });
    
    // Build the image prompt - prioritize user's explicit prompt
    let imagePrompt = '';
    
    if (request.prompt && request.prompt.trim()) {
      // User provided explicit prompt - use it!
      imagePrompt = request.prompt.trim();
      console.log('✅ Using user-provided explicit prompt');
    } else if (request.title && request.title.trim()) {
      // No explicit prompt, use title
      imagePrompt = `Create a professional, engaging illustration for an article titled: "${request.title}"`;
      console.log('✅ Generated prompt from article title');
    } else if (request.content && request.content.trim()) {
      // No title either, use content
      const contentPreview = request.content.substring(0, 200);
      imagePrompt = `Create a professional illustration representing this content: ${contentPreview}`;
      console.log('✅ Generated prompt from article content');
    } else {
      // Fallback
      imagePrompt = 'A professional, modern illustration for a blog article';
      console.log('⚠️ Using fallback prompt');
    }
    
    // Add custom instructions if provided
    if (request.customInstructions && request.customInstructions.trim()) {
      imagePrompt += `. Additional instructions: ${request.customInstructions}`;
    }
    
    const aiModel = request.aiModel || 'dall-e-3';
    const size = request.size || '1024x1024';
    const quality = request.quality || 'standard';
    const style = request.style || 'natural';
    
    console.log(`🤖 Using AI Model: ${aiModel}`);
    console.log(`📝 Final image prompt: "${imagePrompt}"`);
    
    // Create filename - simpler approach
    const timestamp = Date.now();
    const promptHash = imagePrompt.length; // Simple hash alternative
    const fileName = `img-${timestamp}-${promptHash}-${size.replace('x', 'by')}.jpg`;
    
    console.log(`📁 Image filename: ${fileName}`);
    
    // 🔍 STEP 2: Try to generate image
    let temporaryImageUrl: string;
    let generatedWith: string;
    let wasSuccessful = false;
    
    try {
      console.log('🎨 Attempting AI image generation...');
      temporaryImageUrl = await generateWithOpenAI(imagePrompt, size, quality, style);
      generatedWith = 'OpenAI DALL-E 3';
      wasSuccessful = true;
      console.log('✅ AI generation successful!');
    } catch (modelError) {
      console.log(`❌ AI generation failed: ${modelError.message}`);
      console.log('🔄 Falling back to placeholder image...');
      temporaryImageUrl = generatePlaceholderImage(imagePrompt, size);
      generatedWith = 'High-Quality Placeholder (AI failed)';
      wasSuccessful = false;
    }
    
    // 🔍 STEP 3: Upload to storage
    console.log('💾 Uploading image to permanent storage...');
    let finalImageUrl: string;
    
    try {
      finalImageUrl = await uploadImageToStorage(temporaryImageUrl, fileName);
      console.log('✅ Upload successful!');
    } catch (uploadError) {
      console.log(`❌ Upload failed: ${uploadError.message}`);
      console.log('🔄 Using temporary URL as fallback...');
      finalImageUrl = temporaryImageUrl;
    }
    
    const result = {
      success: true,
      imageUrl: finalImageUrl,
      prompt: imagePrompt,
      aiModel,
      size,
      quality,
      style,
      generatedWith,
      fileName,
      wasReused: false,
      wasAIGenerated: wasSuccessful,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🎉 Image generation completed!`);
    console.log(`📊 Result: ${wasSuccessful ? 'AI Generated' : 'Placeholder'} - ${generatedWith}`);
    
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
    console.error('💥 CRITICAL ERROR in Image Generator:', error);
    console.error('💥 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check the Edge Function logs for more details',
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
