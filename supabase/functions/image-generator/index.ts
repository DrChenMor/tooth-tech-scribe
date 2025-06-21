import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔥 DEBUG VERSION IS RUNNING!');
    
    const request = await req.json();
    console.log('Request received:', request.prompt);

    // Build prompt
    let finalPrompt = request.prompt || 'a vampire eating ice cream';
    console.log('Using prompt:', finalPrompt);

    // Check API key
    console.log('API Key exists:', !!openAIApiKey);
    console.log('API Key starts with sk-:', openAIApiKey?.startsWith('sk-'));
    console.log('API Key length:', openAIApiKey?.length);

    // ALWAYS generate new image - NO CACHE
    const timestamp = Date.now();
    const fileName = `img-debug-${timestamp}.jpg`;
    console.log('DEBUG filename:', fileName);

    // Generate with OpenAI
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    if (!openAIApiKey.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY does not start with sk- (invalid format)');
    }

    console.log('Making OpenAI API call...');
    
    const requestBody = {
      model: 'dall-e-3',
      prompt: finalPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    };
    
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response ok:', response.ok);

    const responseText = await response.text();
    console.log('OpenAI raw response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Unknown OpenAI error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || `OpenAI API error: ${response.status}`;
        console.log('Parsed error:', errorData);
      } catch (parseError) {
        errorMessage = `OpenAI API error: ${response.status} - ${responseText}`;
        console.log('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      throw new Error('Could not parse OpenAI response as JSON');
    }

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('OpenAI response missing image URL');
    }

    const imageUrl = data.data[0].url;
    console.log('✅ OpenAI generated image URL:', imageUrl);

    // Upload to storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Downloading image from OpenAI...');
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    console.log('Image downloaded, size:', imageBuffer.byteLength);

    console.log('Uploading to Supabase storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.log('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log('✅ DEBUG SUCCESS - Final URL:', publicUrl);

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl,
      prompt: finalPrompt,
      fileName,
      generatedWith: 'OpenAI DALL-E 3 (Debug)',
      wasReused: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ DEBUG Error:', error.message);
    console.error('❌ Full error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      debug: true
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
