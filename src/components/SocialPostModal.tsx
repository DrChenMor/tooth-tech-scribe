
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article || selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform and ensure an article is selected.');
      return;
    }

    setIsPosting(true);
    
    try {
      // Facebook posting
      if (selectedPlatforms.includes('facebook')) {
        const pageId = '735337896323018'; // Your Facebook Page ID k
        const pageAccessToken = 'EAAKXaWpuDrQBPBFoXcDR4JOEHjTBlvTjVGw80xjQn4WNzBdEvzxP3nZBlEfg4UyPn0R6aW0kjCw8xq1CThLhkcJP0w7DDr2EWtyyYwjHjiPPWBZBB5ZB10gEaMOJ69vKV7gCh3GZB0cZBF5stg74khpZCXmoPZBGH89aD8rYnrkTvsHp8x7QLiAE6CZCGZCO5i1co51bsrS2zrY68nVVZBkpYm5TI66bqg5nZA8KV30X2ui6wZDZD';
        
        const message = `${caption}\n\n${hashtags.join(' ')}`;
        const finalImageUrl = imageUrl || article.image_url;

        console.log('📘 Attempting to post to Facebook...', {
          pageId,
          message: message.substring(0, 100) + '...',
          hasImage: !!finalImageUrl
        });

        const { data, error } = await supabase.functions.invoke('social-poster', {
          body: {
            platform: 'facebook',
            message,
            imageUrl: finalImageUrl,
            pageId,
            pageAccessToken
          }
        });

        if (error) {
          console.error('Facebook posting error:', error);
          toast.error(`Failed to post to Facebook: ${error.message}`);
          return;
        }

        if (data.success) {
          toast.success(`Successfully posted to Facebook! Post ID: ${data.postId}`);
          onClose();
        } else {
          toast.error(`Facebook posting failed: ${data.error || 'Unknown error'}`);
        }
      }
      
      // Instagram posting (existing code)
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
          console.error('Social posting error:', error);
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
      console.error('Social posting error:', error);
      toast.error('Failed to post to social media. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Social Post</DialogTitle>
        </DialogHeader>
        {article ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <strong>Article:</strong> {article.title}
            </div>
            {/* Platform Selector */}
            <div>
              <label className="font-semibold block mb-1">Platforms</label>
              <div className="flex gap-4">
                {PLATFORMS.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-1">
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
              <label className="font-semibold block mb-1">Caption</label>
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={loadingAI}
              />
              <Button type="button" size="sm" className="mt-2" onClick={handleRegenerateCaption} disabled={loadingAI}>
                {loadingAI ? 'Generating...' : 'Regenerate with AI'}
              </Button>
            </div>
            {/* Hashtags */}
            <div>
              <label className="font-semibold block mb-1">Hashtags</label>
              <input
                className="w-full border rounded p-2"
                type="text"
                value={hashtags.join(', ')}
                onChange={handleHashtagChange}
                placeholder="#AI, #Dentistry"
                disabled={loadingAI}
              />
              <div className="text-xs text-muted-foreground mt-1">Comma-separated</div>
            </div>
            {/* Image Preview & Upload */}
            <div>
              <label className="font-semibold block mb-1">Image</label>
              {imageUrl && (
                <img src={imageUrl} alt="Social preview" className="w-32 h-32 object-cover rounded mb-2" />
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>
            {/* Schedule Time */}
            <div>
              <label className="font-semibold block mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                className="w-full border rounded p-2"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                disabled={loadingAI}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={loadingAI || isPosting}>Cancel</Button>
              <Button type="submit" disabled={loadingAI || isPosting}>
                {isPosting ? 'Posting...' : 'Save & Post'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>No article selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocialPostModal; 