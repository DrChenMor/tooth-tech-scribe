import { serve } from 'std/server';

serve(async (req) => {
  try {
    const { platform, message, imageUrl, instagramAccountId, pageAccessToken } = await req.json();

    if (platform === 'instagram') {
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