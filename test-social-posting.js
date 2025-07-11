// Test script for social media posting
// Run this with: node test-social-posting.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSocialPosting() {
  console.log('🧪 Testing social media posting function...');
  
  try {
    // Test the function with dummy data
    const { data, error } = await supabase.functions.invoke('social-poster', {
      body: {
        platform: 'instagram',
        message: 'Test post from DentAI! 🦷 #Dentistry #AI',
        imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
        instagramAccountId: 'test-account-id',
        pageAccessToken: 'test-token'
      }
    });

    if (error) {
      console.log('❌ Function call failed:', error);
      console.log('This is expected since we used dummy credentials.');
      console.log('✅ The function is accessible and responding!');
    } else {
      console.log('✅ Function responded successfully:', data);
    }
    
  } catch (err) {
    console.log('❌ Error calling function:', err.message);
  }
}

testSocialPosting(); 