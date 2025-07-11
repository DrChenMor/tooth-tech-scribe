// Test if the social-poster function is accessible
import { createClient } from '@supabase/supabase-js';

// You'll need to replace this with your actual anon key from Supabase dashboard
const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDgxNzMsImV4cCI6MjA2NzgyNDE3M30.55aee77b'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctionAccess() {
  console.log('🧪 Testing social-poster function accessibility...');
  
  try {
    const { data, error } = await supabase.functions.invoke('social-poster', {
      body: {
        platform: 'facebook',
        message: 'Test message',
        pageId: '2236564493453162',
        pageAccessToken: 'test-token'
      }
    });

    if (error) {
      console.log('❌ Function call failed:', error);
      console.log('This might be expected if the token is invalid, but the function should be accessible.');
    } else {
      console.log('✅ Function is accessible and responding!');
      console.log('Response:', data);
    }
    
  } catch (err) {
    console.log('❌ Error calling function:', err.message);
    console.log('This suggests the function might not be deployed or there\'s a network issue.');
  }
}

testFunctionAccess(); 