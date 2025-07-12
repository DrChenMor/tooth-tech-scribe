import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Article } from '@/types';
import React from 'react';
import { getAIAnalysis } from '@/services/aiModelService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'x', label: 'X (Twitter)' },
];

interface SocialPostModalProps {
  open: boolean;
  article: Article | null;
  onClose: () => void;
}

const defaultAISuggestion = (article: Article) =>
  `Check out our latest article: "${article.title}"! ${article.excerpt ? article.excerpt.slice(0, 100) : ''}`;

const defaultHashtags = (article: Article) =>
  article.category ? [
    `#${article.category.replace(/\s+/g, '')}`,
    '#Dentistry',
    '#AI',
  ] : ['#Dentistry', '#AI'];

const SocialPostModal = ({ open, article, onClose }: SocialPostModalProps) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [schedule, setSchedule] = useState<string>('');
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Initialize fields when article changes
  React.useEffect(() => {
    if (article) {
      setCaption(defaultAISuggestion(article));
      setHashtags(defaultHashtags(article));
      setImageUrl(article.image_url || '');
      setSchedule('');
      setCustomImage(null);
      setSelectedPlatforms(['facebook']);
    }
  }, [article]);

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHashtags(e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomImage(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRegenerateCaption = async () => {
    if (!article) return;
    setLoadingAI(true);
    try {
      const prompt = `Generate a short, engaging social media post for the following article, tailored for these platforms: ${selectedPlatforms.join(", ")}.\n\nTitle: ${article.title}\nExcerpt: ${article.excerpt || ''}\nCategory: ${article.category || ''}\n\nInclude a suggested caption and a list of 3-5 relevant hashtags.\nRespond in the following format:\nCaption: <your caption>\nHashtags: #tag1, #tag2, #tag3`;
      const aiResult = await getAIAnalysis(prompt, { ai_model: 'gpt-4o' });
      // Parse AI response
      let newCaption = '';
      let newHashtags: string[] = [];
      const captionMatch = aiResult.analysis.match(/Caption:(.*?)(?:\n|$)/i);
      if (captionMatch) {
        newCaption = captionMatch[1].trim();
      }
      const hashtagsMatch = aiResult.analysis.match(/Hashtags:(.*?)(?:\n|$)/i);
      if (hashtagsMatch) {
        newHashtags = hashtagsMatch[1].split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }
      if (newCaption) setCaption(newCaption);
      if (newHashtags.length > 0) setHashtags(newHashtags);
    } catch (err) {
      // fallback
      setCaption(defaultAISuggestion(article) + ' (AI error)');
    } finally {
      setLoadingAI(false);
    }
  };

  const testFacebookAccess = async (pageId: string, pageAccessToken: string) => {
    try {
      console.log('🧪 Testing Facebook Page access...');
      
      // Test 1: Validate the page access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`);
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('❌ Access token test failed:', tokenData);
        return { valid: false, error: `Token validation failed: ${tokenData.error?.message || 'Unknown error'}` };
      }
      
      console.log('✅ Access token is valid for:', tokenData.name);
      
      // Test 2: Check page permissions
      const pageResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=name,id,access_token&access_token=${pageAccessToken}`);
      const pageData = await pageResponse.json();
      
      if (!pageResponse.ok) {
        console.error('❌ Page access test failed:', pageData);
        return { valid: false, error: `Page access failed: ${pageData.error?.message || 'Unknown error'}` };
      }
      
      console.log('✅ Page access confirmed:', pageData.name);
      
      // Test 3: Check posting permissions
      const permissionsResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=permissions&access_token=${pageAccessToken}`);
      const permissionsData = await permissionsResponse.json();
      
      console.log('📋 Page permissions:', permissionsData);
      
      return { valid: true, pageData };
    } catch (error) {
      console.error('❌ Facebook access test error:', error);
      return { valid: false, error: `Connection failed: ${error.message}` };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article || selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform and ensure an article is selected.');
      return;
    }

    setIsPosting(true);
    
    try {
      // Facebook posting with enhanced debugging
      if (selectedPlatforms.includes('facebook')) {
        const pageId = '735337896323018'; // Your correct Facebook Page ID
        const pageAccessToken = 'EAAKXaWpuDrQBPHWSUzKzXDefc5sAdRDd2bZArLEkZArkyudU23cSGvJbD7N4BjYy0NrXMVevL7hEIpsMVDi4dhmjYEGPbstRmvb3l4GozS72u42XZB8ZAjqc9ZA6IF3q1Ogv1MGrJnAuz3kY2chAGOw0sy5p5V9ZCBlzZB0rWJmJvZCnseM6pWqZArfWFIZBqVRtKkgJWLtVA6UZBDutObQDxuTHDMKrcZCfKPNa';
        
        // Step 1: Test Facebook access before attempting to post
        console.log('🔍 Step 1: Testing Facebook access...');
        const accessTest = await testFacebookAccess(pageId, pageAccessToken);
        
        if (!accessTest.valid) {
          toast.error(`Facebook Access Error: ${accessTest.error}`);
          console.error('❌ Facebook access test failed:', accessTest.error);
          return;
        }
        
        console.log('✅ Facebook access test passed');
        
        // Step 2: Prepare the message
        const message = `${caption}\n\n${hashtags.join(' ')}`;
        const finalImageUrl = imageUrl || article.image_url;

        console.log('📝 Preparing Facebook post:', {
          pageId,
          messageLength: message.length,
          hasImage: !!finalImageUrl,
          messagePreview: message.substring(0, 100) + '...'
        });

        // Step 3: Make the actual post
        console.log('📤 Step 3: Attempting to post to Facebook...');
        
        const { data, error } = await supabase.functions.invoke('social-poster', {
          body: {
            platform: 'facebook',
            message,
            imageUrl: finalImageUrl,
            pageId,
            pageAccessToken
          }
        });

        console.log('📊 Supabase function response:', { data, error });

        if (error) {
          console.error('❌ Supabase function error:', error);
          toast.error(`Failed to post to Facebook: ${error.message}`);
          return;
        }

        if (data && data.success) {
          toast.success(`Successfully posted to Facebook! Post ID: ${data.postId || 'N/A'}`);
          console.log('🎉 Facebook post successful:', data);
          onClose();
        } else {
          const errorMsg = data?.error || 'Unknown error occurred';
          console.error('❌ Facebook posting failed:', data);
          toast.error(`Facebook posting failed: ${errorMsg}`);
          
          // Log detailed error information
          if (data?.facebook) {
            console.error('🔍 Detailed Facebook API response:', data.facebook);
          }
        }
      }
      
      // Instagram posting (existing code with similar debugging)
      if (selectedPlatforms.includes('instagram')) {
        // You'll need to replace these with your actual values
        const instagramAccountId = 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID';
        const pageAccessToken = 'YOUR_PAGE_ACCESS_TOKEN';
        
        if (instagramAccountId === 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID' || pageAccessToken === 'YOUR_PAGE_ACCESS_TOKEN') {
          toast.error('Please configure your Instagram credentials in the code. Check the console for instructions.');
          console.log('🔧 SETUP REQUIRED:');
          console.log('1. Get your Instagram Business Account ID from Facebook Business Manager');
          console.log('2. Get your Page Access Token from Facebook Graph API Explorer');
          console.log('3. Replace the placeholder values in SocialPostModal.tsx');
          return;
        }

        const message = `${caption}\n\n${hashtags.join(' ')}`;
        const finalImageUrl = imageUrl || article.image_url;

        if (!finalImageUrl) {
          toast.error('Please provide an image for Instagram posting.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('social-poster', {
          body: {
            platform: 'instagram',
            message,
            imageUrl: finalImageUrl,
            instagramAccountId,
            pageAccessToken
          }
        });

        if (error) {
          console.error('Instagram posting error:', error);
          toast.error(`Failed to post: ${error.message}`);
          return;
        }

        if (data.success) {
          toast.success('Successfully posted to Instagram!');
          onClose();
        } else {
          toast.error(`Posting failed: ${data.error || 'Unknown error'}`);
        }
      }
      
      // For other platforms, show a message
      if (selectedPlatforms.includes('x')) {
        toast.info('Posting to X (Twitter) is not yet implemented. Facebook and Instagram are currently supported.');
      }
    } catch (error) {
      console.error('💥 Critical social posting error:', error);
      toast.error(`Failed to post to social media: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Social Post</DialogTitle>
        </DialogHeader>
        {article ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <strong>Article:</strong> {article.title}
              <br />
              <small className="text-muted-foreground">
                This will create a social media post promoting this article.
              </small>
            </div>
            
            {/* Platform Selector */}
            <div>
              <label className="font-semibold block mb-2">Platforms</label>
              <div className="flex gap-4">
                {PLATFORMS.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.key)}
                      onChange={() => handlePlatformChange(platform.key)}
                    />
                    {platform.label}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Caption */}
            <div>
              <label className="font-semibold block mb-2">Caption</label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[100px]"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={loadingAI}
                placeholder="Enter your social media caption..."
              />
              <Button 
                type="button" 
                size="sm" 
                className="mt-2" 
                onClick={handleRegenerateCaption} 
                disabled={loadingAI}
              >
                {loadingAI ? 'Generating...' : 'Regenerate with AI'}
              </Button>
            </div>
            
            {/* Hashtags */}
            <div>
              <label className="font-semibold block mb-2">Hashtags</label>
              <input
                className="w-full border rounded-lg p-3"
                type="text"
                value={hashtags.join(', ')}
                onChange={handleHashtagChange}
                placeholder="#AI, #Dentistry, #Innovation"
                disabled={loadingAI}
              />
              <div className="text-xs text-muted-foreground mt-1">Comma-separated hashtags</div>
            </div>
            
            {/* Image Preview & Upload */}
            <div>
              <label className="font-semibold block mb-2">Image</label>
              {imageUrl && (
                <div className="mb-3">
                  <img 
                    src={imageUrl} 
                    alt="Social preview" 
                    className="w-48 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {/* Schedule Time */}
            <div>
              <label className="font-semibold block mb-2">Schedule (optional)</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg p-3"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                disabled={loadingAI}
              />
              <div className="text-xs text-muted-foreground mt-1">Leave empty to post immediately</div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={onClose} 
                disabled={loadingAI || isPosting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loadingAI || isPosting || selectedPlatforms.length === 0}
                className="min-w-[120px]"
              >
                {isPosting ? 'Posting...' : 'Post to Social Media'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No article selected.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocialPostModal;