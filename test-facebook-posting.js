// Test Facebook posting with your credentials
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFacebookPosting() {
  console.log('🧪 Testing Facebook posting...');
  
  try {
    const pageId = '2236564493453162';
    const pageAccessToken = 'EAAfyJMAmR2oBPLulOOf0vvpwHUMpHpg0RSlYoVm1UzXGMhzt2Bb2IESZBgwebppTRa6vjaehv1JZAFgL2O5L5nk0ZCPPW9J520daofmGbPZC3vuRTX6GLDfHIUhaU4SWZAq1wQMYcFSJVIZAjglw3ZCZBCcz4oulZAgGsUS0MypklB5ALoZAbzAcbk0HxNrCKcMrNtQDT2tbztHfarOD1XmUb7ji3AT4G9VsysWbR1';
    
    const { data, error } = await supabase.functions.invoke('social-poster', {
      body: {
        platform: 'facebook',
        message: '🧪 Test post from DentAI! This is a test of our social media integration. #Dentistry #AI #Test',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
        pageId,
        pageAccessToken
      }
    });

    if (error) {
      console.log('❌ Function call failed:', error);
    } else {
      console.log('✅ Function responded successfully:', data);
      if (data.success) {
        console.log('🎉 Facebook post successful! Post ID:', data.postId);
      } else {
        console.log('❌ Facebook posting failed:', data.error);
      }
    }
    
  } catch (err) {
    console.log('❌ Error calling function:', err.message);
  }
}

testFacebookPosting(); 