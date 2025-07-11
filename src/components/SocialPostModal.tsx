import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Article } from '@/types';
import React from 'react';
import { getAIAnalysis } from '@/services/aiModelService';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate backend API call
    onClose();
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
              <Button variant="outline" type="button" onClick={onClose} disabled={loadingAI}>Cancel</Button>
              <Button type="submit" disabled={loadingAI}>Save & Post</Button>
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