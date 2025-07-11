import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('🚀 Social Poster function started');
    
    const requestBody = await req.json();
    console.log('📨 Request received:', {
      platform: requestBody.platform,
      hasMessage: !!requestBody.message,
      hasImageUrl: !!requestBody.imageUrl,
      hasPageId: !!requestBody.pageId,
      hasPageAccessToken: !!requestBody.pageAccessToken,
      messageLength: requestBody.message?.length || 0
    });
    
    const { platform, message, imageUrl, pageId, pageAccessToken } = requestBody;

    // Validate required fields
    if (!platform) {
      throw new Error('Platform is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }

    if (platform === 'facebook') {
      if (!pageId) {
        throw new Error('Page ID is required for Facebook posting');
      }
      
      if (!pageAccessToken) {
        throw new Error('Page access token is required for Facebook posting');
      }

      console.log('📘 Starting Facebook posting process...');
      
      // Step 1: Validate the access token first
      console.log('🔐 Step 1: Validating access token...');
      const tokenValidationUrl = `https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`;
      
      const tokenResponse = await fetch(tokenValidationUrl);
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('❌ Access token validation failed:', tokenData);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Access token validation failed: ${tokenData.error?.message || 'Invalid token'}`,
          facebook: tokenData
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ Access token valid for user:', tokenData.name);
      
      // Step 2: Check page access
      console.log('🏠 Step 2: Checking page access...');
      const pageCheckUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=name,id,access_token&access_token=${pageAccessToken}`;
      
      const pageCheckResponse = await fetch(pageCheckUrl);
      const pageCheckData = await pageCheckResponse.json();
      
      if (!pageCheckResponse.ok) {
        console.error('❌ Page access check failed:', pageCheckData);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Page access failed: ${pageCheckData.error?.message || 'Cannot access page'}`,
          facebook: pageCheckData
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ Page access confirmed for:', pageCheckData.name);
      
      // Step 3: Prepare the post data
      console.log('📝 Step 3: Preparing post data...');
      const postData: any = {
        message: message,
        access_token: pageAccessToken,
      };

      // Add image/link if provided
      if (imageUrl) {
        // For Facebook, we can either use 'link' for external URLs or upload the image
        postData.link = imageUrl;
        console.log('🖼️ Added image URL to post:', imageUrl);
      }

      console.log('📤 Step 4: Posting to Facebook...');
      console.log('Post data prepared:', {
        hasMessage: !!postData.message,
        messageLength: postData.message?.length,
        hasLink: !!postData.link,
        pageId: pageId
      });

      // Step 4: Make the actual post
      const postUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'DentalAI-SocialPoster/1.0'
        },
        body: JSON.stringify(postData),
      });

      const postResult = await postResponse.json();
      
      console.log('📊 Facebook API response:', {
        status: postResponse.status,
        statusText: postResponse.statusText,
        result: postResult
      });
      
      if (!postResponse.ok) {
        console.error('❌ Facebook post failed:', postResult);
        
        // Provide more specific error messages
        let errorMessage = 'Unknown Facebook API error';
        if (postResult.error) {
          errorMessage = postResult.error.message;
          
          // Add helpful context for common errors
          if (postResult.error.code === 200) {
            errorMessage += ' (Permissions error - check if your access token has "pages_manage_posts" permission)';
          } else if (postResult.error.code === 190) {
            errorMessage += ' (Access token expired or invalid)';
          } else if (postResult.error.code === 368) {
            errorMessage += ' (Temporary user restriction)';
          }
        }
        
        return new Response(JSON.stringify({ 
          success: false,
          error: errorMessage,
          facebook: postResult,
          debug: {
            pageId,
            tokenValid: true,
            pageAccessible: true
          }
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('🎉 Facebook post successful!');
      return new Response(JSON.stringify({ 
        success: true, 
        facebook: postResult,
        postId: postResult.id,
        platform: 'facebook'
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (platform === 'instagram') {
      console.log('📸 Starting Instagram posting process...');
      
      const { instagramAccountId } = requestBody;
      
      if (!instagramAccountId) {
        throw new Error('Instagram Account ID is required for Instagram posting');
      }
      
      if (!pageAccessToken) {
        throw new Error('Page access token is required for Instagram posting');
      }
      
      if (!imageUrl) {
        throw new Error('Image URL is required for Instagram posting');
      }
      
      console.log('📝 Step 1: Creating Instagram media object...');
      
      // 1. Create media object
      const createMediaResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message,
          access_token: pageAccessToken,
        }),
      });
      
      const createMediaData = await createMediaResponse.json();
      console.log('📊 Create media response:', createMediaData);
      
      if (!createMediaResponse.ok || !createMediaData.id) {
        console.error('❌ Failed to create Instagram media object:', createMediaData);
        return new Response(JSON.stringify({ 
          success: false,
          error: createMediaData.error?.message || 'Failed to create Instagram media object.',
          instagram: createMediaData
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ Media object created:', createMediaData.id);
      
      // 2. Publish media object
      console.log('📤 Step 2: Publishing Instagram media...');
      const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: createMediaData.id,
          access_token: pageAccessToken,
        }),
      });
      
      const publishData = await publishResponse.json();
      console.log('📊 Publish response:', publishData);
      
      if (!publishResponse.ok) {
        console.error('❌ Failed to publish Instagram media:', publishData);
        return new Response(JSON.stringify({ 
          success: false,
          error: publishData.error?.message || 'Failed to publish Instagram media.',
          instagram: publishData
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('🎉 Instagram post successful!');
      return new Response(JSON.stringify({ 
        success: true, 
        instagram: publishData,
        postId: publishData.id,
        platform: 'instagram'
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unsupported platform
    return new Response(JSON.stringify({ 
      success: false,
      error: `Unsupported platform: ${platform}` 
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Critical error in social-poster:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error',
      stack: error.stack
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});