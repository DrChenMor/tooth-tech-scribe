
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Clock, Globe, Brain, Filter, Send, Plus, Share2, Mail, ImagePlay, SearchCheck, Languages, Eye, Award, TrendingUp, HeartPulse } from 'lucide-react';
import { WorkflowNode } from '@/pages/WorkflowBuilderPage';
import { EmailPreviewDialog } from './EmailPreviewDialog';

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onAddNode: (type: WorkflowNode['type']) => void;
  onUpdateNodeConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void;
}

const WorkflowSidebar = ({ selectedNode, onAddNode, onUpdateNodeConfig }: WorkflowSidebarProps) => {
  const nodeTypes = [
    { type: 'trigger', icon: Clock, label: 'Trigger', description: 'Start workflows' },
    { type: 'scraper', icon: Globe, label: 'Web Scraper', description: 'Extract content' },
    { type: 'ai-processor', icon: Brain, label: 'AI Processor', description: 'Generate content' },
    { type: 'filter', icon: Filter, label: 'Filter', description: 'Quality control' },
    { type: 'publisher', icon: Send, label: 'Publisher', description: 'Publish articles' },
    { type: 'social-poster', icon: Share2, label: 'Social Poster', description: 'Post to social media' },
    { type: 'email-sender', icon: Mail, label: 'Email Sender', description: 'Send email notifications' },
    { type: 'image-generator', icon: ImagePlay, label: 'Image Generator', description: 'Create article images' },
    { type: 'seo-analyzer', icon: SearchCheck, label: 'SEO Analyzer', description: 'Analyze content for SEO' },
    { type: 'translator', icon: Languages, label: 'Translator', description: 'Translate article content' },
    { type: 'content-quality-analyzer', icon: Award, label: 'Content Quality Analyzer', description: 'Score content quality with AI' },
    { type: 'ai-seo-optimizer', icon: TrendingUp, label: 'AI SEO Optimizer', description: 'Generate SEO suggestions with AI' },
    { type: 'engagement-forecaster', icon: HeartPulse, label: 'Engagement Forecaster', description: 'Predict engagement with AI' },
  ] as const;

  return (
    <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
      {!selectedNode ? (
        <>
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Add Components</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <Button
                    key={nodeType.type}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => onAddNode(nodeType.type)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">{nodeType.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {nodeType.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>Add a Trigger to start your workflow</li>
                <li>Add a Web Scraper to collect content</li>
                <li>Add an AI Processor to transform content</li>
                <li>Add a Publisher to save articles</li>
                <li>Connect the components</li>
                <li>Test your workflow</li>
              </ol>
            </CardContent>
          </Card>
        </>
      ) : (
        <NodeConfiguration node={selectedNode} onUpdateConfig={onUpdateNodeConfig} />
      )}
    </div>
  );
};

const NodeConfiguration = ({ node, onUpdateConfig }: { node: WorkflowNode, onUpdateConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getNodeIcon = (type: WorkflowNode['type']) => {
    const icons = {
      trigger: Clock,
      scraper: Globe,
      'ai-processor': Brain,
      filter: Filter,
      publisher: Send,
      'social-poster': Share2,
      'email-sender': Mail,
      'image-generator': ImagePlay,
      'seo-analyzer': SearchCheck,
      translator: Languages,
      'content-quality-analyzer': Award,
      'ai-seo-optimizer': TrendingUp,
      'engagement-forecaster': HeartPulse,
    };
    return icons[type];
  };

  const Icon = getNodeIcon(node.type);

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, { [key]: value });
  };

  const getInterpolatedValue = (template: string) => {
    if (!template) return '';
    // This is a mock interpolation for preview.
    return template
      .replace(/{{article.title}}/g, 'Example Article Title')
      .replace(/{{article.url}}/g, 'https://example.com/article/example-slug')
      .replace(/{{article.excerpt}}/g, 'This is an example excerpt of the article content.');
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h3 className="font-semibold">{node.label}</h3>
      </div>

      {node.type === 'trigger' && (
        <div className="space-y-4">
          <div>
            <Label>Schedule Type</Label>
            <Select
              value={node.config.schedule || 'manual'}
              onValueChange={(value) => handleConfigChange('schedule', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {node.config.schedule !== 'manual' && (
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={node.config.time || '09:00'}
                onChange={(e) => handleConfigChange('time', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {node.type === 'scraper' && (
        <div className="space-y-4">
          <div>
            <Label>URLs to Scrape (one per line)</Label>
            <Textarea
              placeholder="https://example.com/news&#10;https://another-site.com/articles"
              rows={4}
              value={Array.isArray(node.config.urls) ? node.config.urls.join('\n') : ''}
              onChange={(e) => handleConfigChange('urls', e.target.value.split('\n').filter(url => url.trim() !== ''))}
            />
          </div>
          <div>
            <Label>Content Selector (CSS)</Label>
            <Input
              placeholder="article, .content, #main"
              value={node.config.selector || ''}
              onChange={(e) => handleConfigChange('selector', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={node.config.followPagination || false}
              onCheckedChange={(checked) => handleConfigChange('followPagination', checked)}
            />
            <Label>Follow pagination</Label>
          </div>
        </div>
      )}

      {node.type === 'ai-processor' && (
        <div className="space-y-4">
          <div>
            <Label>AI Provider</Label>
            <Select
              value={node.config.provider || 'openai'}
              onValueChange={(value) => handleConfigChange('provider', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content Type</Label>
            <Select
              value={node.config.contentType || 'article'}
              onValueChange={(value) => handleConfigChange('contentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Full Article</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Custom Prompt</Label>
            <Textarea
              placeholder="Transform this content into a professional article..."
              rows={3}
              value={node.config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
            />
          </div>
        </div>
      )}

      {node.type === 'publisher' && (
        <div className="space-y-4">
          <div>
            <Label>Publish Status</Label>
            <Select
              value={node.config.status || 'draft'}
              onValueChange={(value) => handleConfigChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Save as Draft</SelectItem>
                <SelectItem value="published">Publish Immediately</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={node.config.category || 'AI Generated'}
              onChange={(e) => handleConfigChange('category', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={node.config.autoPublishConditional || false}
              onCheckedChange={(checked) => handleConfigChange('autoPublishConditional', checked)}
            />
            <Label>Auto-publish if quality score greater than 80%</Label>
          </div>
        </div>
      )}

      {node.type === 'social-poster' && (
        <div className="space-y-4">
          <div>
            <Label>Social Platform</Label>
            <Select
              value={node.config.platform || 'twitter'}
              onValueChange={(value) => handleConfigChange('platform', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="facebook" disabled>Facebook (coming soon)</SelectItem>
                <SelectItem value="linkedin" disabled>LinkedIn (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Post Content Template</Label>
            <Textarea
              placeholder="Check out our new article: {{article.title}} {{article.url}}"
              rows={4}
              value={node.config.content || ''}
              onChange={(e) => handleConfigChange('content', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use `&#123;&#123;article.title&#125;&#125;` and `&#123;&#123;article.url&#125;&#125;` as placeholders.
            </p>
          </div>
        </div>
      )}

      {node.type === 'email-sender' && (
        <div className="space-y-4">
          <div>
            <Label>Recipient Email</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={node.config.recipient || ''}
              onChange={(e) => handleConfigChange('recipient', e.target.value)}
            />
          </div>
          <div>
            <Label>Email Subject</Label>
            <Input
              placeholder="New Article: {{article.title}}"
              value={node.config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
            />
             <p className="text-xs text-muted-foreground mt-1">
              Use `&#123;&#123;article.title&#125;&#125;` and `&#123;&#123;article.url&#125;&#125;` as placeholders.
            </p>
          </div>
          <div>
            <Label>Email Body</Label>
            <Textarea
              rows={4}
              placeholder="A new article has been published. Read it here: {{article.url}}"
              value={node.config.body || ''}
              onChange={(e) => handleConfigChange('body', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholders are supported here as well.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="w-full flex items-center gap-2">
            <Eye className="h-4 w-4" /> Preview Email
          </Button>
          <EmailPreviewDialog 
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            recipient={node.config.recipient || ''}
            subject={getInterpolatedValue(node.config.subject || '')}
            body={getInterpolatedValue(node.config.body || '').replace(/\n/g, '<br />')}
          />
        </div>
      )}

      {node.type === 'image-generator' && (
        <div className="space-y-4">
          <div>
            <Label>Image Provider</Label>
            <Select
              value={node.config.provider || 'dall-e-3'}
              onValueChange={(value) => handleConfigChange('provider', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                <SelectItem value="flux-schnell" disabled>Flux Schnell (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Image Prompt</Label>
            <Textarea
              placeholder="A photorealistic image of..."
              rows={4}
              value={node.config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use `&#123;&#123;article.title&#125;&#125;` and `&#123;&#123;article.excerpt&#125;&#125;` as placeholders.
            </p>
          </div>
        </div>
      )}

      {node.type === 'seo-analyzer' && (
        <div className="space-y-4">
          <div>
            <Label>Focus Keywords (comma separated)</Label>
            <Input
              placeholder="AI, automation, content creation"
              value={Array.isArray(node.config.keywords) ? node.config.keywords.join(', ') : ''}
              onChange={(e) => handleConfigChange('keywords', e.target.value.split(',').map(k => k.trim()))}
            />
          </div>
          <div>
            <Label>Target SEO Score</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={node.config.targetScore || 80}
              onChange={(e) => handleConfigChange('targetScore', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      )}
      
      {node.type === 'translator' && (
        <div className="space-y-4">
          <div>
            <Label>Translation Provider</Label>
            <Select
              value={node.config.provider || 'openai'}
              onValueChange={(value) => handleConfigChange('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT (Cost-effective)</SelectItem>
                <SelectItem value="claude">Anthropic Claude (High quality)</SelectItem>
                <SelectItem value="gemini">Google Gemini (Fast)</SelectItem>
                <SelectItem value="google">Google Translate API (Most accurate)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {node.config.provider === 'google' 
                ? 'Professional translation service - requires Cloud Translation API enabled'
                : 'AI-powered translation - more cost-effective and good quality'
              }
            </p>
          </div>
          <div>
            <Label>Target Language</Label>
            <Select
              value={node.config.targetLanguage || 'es'}
              onValueChange={(value) => handleConfigChange('targetLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="he">Hebrew</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {node.type === 'content-quality-analyzer' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This node uses the Content Quality AI Agent to analyze articles. It will generate suggestions for articles with a quality score below 70.
          </p>
          <p className="text-sm text-muted-foreground font-semibold mt-2">
            No configuration is needed.
          </p>
        </div>
      )}

      {node.type === 'ai-seo-optimizer' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This node uses the AI SEO Optimizer Agent to analyze articles. It will generate SEO keywords, meta descriptions, and other on-page improvements.
          </p>
           <p className="text-sm text-muted-foreground font-semibold mt-2">
            No configuration is needed.
          </p>
        </div>
      )}

      {node.type === 'engagement-forecaster' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This node uses the Engagement Forecaster AI Agent to predict engagement. For articles with high predicted engagement, it will suggest a social media post.
          </p>
           <p className="text-sm text-muted-foreground font-semibold mt-2">
            No configuration is needed.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowSidebar;
