import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  try {
    const { platform, message, imageUrl, pageId, pageAccessToken } = await req.json();

    if (platform === 'facebook') {
      // Post to Facebook Page
      const postData: any = {
        message: message,
        access_token: pageAccessToken,
      };

      // Add image if provided
      if (imageUrl) {
        postData.link = imageUrl;
      }

      const postRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      const postResult = await postRes.json();
      
      if (!postRes.ok) {
        console.error('Facebook API error:', postResult);
        return new Response(JSON.stringify({ 
          error: postResult.error?.message || 'Failed to post to Facebook.' 
        }), { status: 500 });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        facebook: postResult,
        postId: postResult.id 
      }), { status: 200 });
    }

    if (platform === 'instagram') {
      // Instagram posting logic (existing code)
      const { instagramAccountId } = await req.json();
      
      // 1. Create media object
      const createMediaRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message,
          access_token: pageAccessToken,
        }),
      });
      const createMediaData = await createMediaRes.json();
      if (!createMediaRes.ok || !createMediaData.id) {
        return new Response(JSON.stringify({ error: createMediaData.error || 'Failed to create Instagram media object.' }), { status: 500 });
      }
      // 2. Publish media object
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: createMediaData.id,
          access_token: pageAccessToken,
        }),
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) {
        return new Response(JSON.stringify({ error: publishData.error || 'Failed to publish Instagram media.' }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, instagram: publishData }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unsupported platform' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}); 