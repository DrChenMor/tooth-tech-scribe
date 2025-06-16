import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, Globe, Brain, Filter, Send, Plus, Share2, Mail, 
  ImagePlay, SearchCheck, Languages, Eye, Award, TrendingUp, 
  HeartPulse, Rss, GraduationCap, Newspaper, Search, Combine, BarChart3 
} from 'lucide-react';
import { WorkflowNode } from '@/pages/WorkflowBuilderPage';

// Mock AI models - replace with actual import if available
const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', provider: 'Google' },
];

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onAddNode: (type: WorkflowNode['type']) => void;
  onUpdateNodeConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void;
}

const WorkflowSidebar = ({ selectedNode, onAddNode, onUpdateNodeConfig }: WorkflowSidebarProps) => {
  const nodeTypes = [
    { type: 'trigger', icon: Clock, label: 'Trigger', description: 'Start workflows' },
    { type: 'scraper', icon: Globe, label: 'Web Scraper', description: 'Extract content' },
    { type: 'rss-aggregator', icon: Rss, label: 'RSS Aggregator', description: 'Fetch content from RSS feeds' },
    { type: 'google-scholar-search', icon: GraduationCap, label: 'Google Scholar Search', description: 'Search academic papers' },
    { type: 'news-discovery', icon: Newspaper, label: 'News Discovery', description: 'Find trending news articles' },
    { type: 'perplexity-research', icon: Search, label: 'Perplexity Research', description: 'AI-powered web research' },
    { type: 'ai-processor', icon: Brain, label: 'AI Processor', description: 'Generate content' },
    { type: 'multi-source-synthesizer', icon: Combine, label: 'Multi-Source Synthesizer', description: 'Combine multiple sources with AI' },
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
    { type: 'content-performance-analyzer', icon: BarChart3, label: 'Content Performance Analyzer', description: 'Track and analyze content metrics' },
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
                <li>Add research nodes to collect content</li>
                <li>Add an AI Processor to transform content</li>
                <li>Add a Publisher to save articles</li>
                <li>Connect the components</li>
                <li>Test your workflow</li>
              </ol>
            </CardContent>
          </Card>
        </>
      ) : (
        <NodeConfiguration 
          key={selectedNode.id} // Force re-render when node changes
          node={selectedNode} 
          onUpdateConfig={onUpdateNodeConfig} 
        />
      )}
    </div>
  );
};

const NodeConfiguration = ({ 
  node, 
  onUpdateConfig 
}: { 
  node: WorkflowNode; 
  onUpdateConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void; 
}) => {
  // Local state to ensure immediate updates
  const [localConfig, setLocalConfig] = useState(node.config);

  // Sync local state with node config when node changes
  useEffect(() => {
    setLocalConfig(node.config);
  }, [node.config, node.id]);

  const getNodeIcon = (type: WorkflowNode['type']) => {
    const icons = {
      trigger: Clock,
      scraper: Globe,
      'rss-aggregator': Rss,
      'google-scholar-search': GraduationCap,
      'news-discovery': Newspaper,
      'perplexity-research': Search,
      'ai-processor': Brain,
      'multi-source-synthesizer': Combine,
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
      'content-performance-analyzer': BarChart3,
    };
    return icons[type] || Clock;
  };

  const Icon = getNodeIcon(node.type);

  const handleConfigChange = (key: string, value: any) => {
    // Update local state immediately for UI responsiveness
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    
    // Update parent state
    onUpdateConfig(node.id, { [key]: value });
  };

  const renderAIModelSelector = () => (
    <div className="space-y-2">
      <Label>AI Model</Label>
      <Select
        key={`aiModel-${node.id}`}
        value={localConfig.aiModel || 'gemini-1.5-flash-latest'}
        onValueChange={(value) => handleConfigChange('aiModel', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h3 className="font-semibold">{node.label}</h3>
      </div>

      {/* Trigger Configuration */}
      {node.type === 'trigger' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select
              key={`schedule-${node.id}`}
              value={localConfig.schedule || 'manual'}
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
          {localConfig.schedule !== 'manual' && (
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                key={`time-${node.id}`}
                type="time"
                value={localConfig.time || '09:00'}
                onChange={(e) => handleConfigChange('time', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Web Scraper Configuration */}
      {node.type === 'scraper' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URLs to Scrape (one per line)</Label>
            <Textarea
              key={`urls-${node.id}`}
              placeholder="https://example.com/news&#10;https://another-site.com/articles"
              rows={4}
              value={Array.isArray(localConfig.urls) ? localConfig.urls.join('\n') : ''}
              onChange={(e) => handleConfigChange('urls', e.target.value.split('\n').filter(url => url.trim() !== ''))}
            />
          </div>
          <div className="space-y-2">
            <Label>Content Selector (CSS)</Label>
            <Input
              key={`selector-${node.id}`}
              placeholder="article, .content, #main"
              value={localConfig.selector || ''}
              onChange={(e) => handleConfigChange('selector', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`followPagination-${node.id}`}
              checked={localConfig.followPagination || false}
              onCheckedChange={(checked) => handleConfigChange('followPagination', checked)}
            />
            <Label>Follow pagination</Label>
          </div>
        </div>
      )}

      {/* RSS Aggregator Configuration */}
      {node.type === 'rss-aggregator' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>RSS Feed URLs (one per line)</Label>
            <Textarea
              key={`rss-urls-${node.id}`}
              placeholder="https://example.com/feed.xml&#10;https://another-site.com/rss"
              rows={4}
              value={Array.isArray(localConfig.urls) ? localConfig.urls.join('\n') : ''}
              onChange={(e) => handleConfigChange('urls', e.target.value.split('\n').filter(url => url.trim() !== ''))}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Items per Feed</Label>
            <Input
              key={`maxItems-${node.id}`}
              type="number"
              min="1"
              max="50"
              value={localConfig.maxItems || 10}
              onChange={(e) => handleConfigChange('maxItems', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      )}

      {/* Google Scholar Search Configuration */}
      {node.type === 'google-scholar-search' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Query</Label>
            <Input
              key={`query-${node.id}`}
              placeholder="machine learning natural language processing"
              value={localConfig.query || ''}
              onChange={(e) => handleConfigChange('query', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Results</Label>
            <Input
              key={`maxResults-${node.id}`}
              type="number"
              min="1"
              max="100"
              value={localConfig.maxResults || 20}
              onChange={(e) => handleConfigChange('maxResults', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="space-y-2">
            <Label>Publication Year Range</Label>
            <div className="flex gap-2">
              <Input
                key={`yearFrom-${node.id}`}
                type="number"
                placeholder="2020"
                value={localConfig.yearFrom || ''}
                onChange={(e) => handleConfigChange('yearFrom', e.target.value)}
              />
              <span className="self-center text-sm">to</span>
              <Input
                key={`yearTo-${node.id}`}
                type="number"
                placeholder="2024"
                value={localConfig.yearTo || ''}
                onChange={(e) => handleConfigChange('yearTo', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`includeAbstracts-${node.id}`}
              checked={localConfig.includeAbstracts || true}
              onCheckedChange={(checked) => handleConfigChange('includeAbstracts', checked)}
            />
            <Label>Include abstracts</Label>
          </div>
        </div>
      )}

      {/* News Discovery Configuration */}
      {node.type === 'news-discovery' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Keywords</Label>
            <Input
              key={`keywords-${node.id}`}
              placeholder="artificial intelligence, technology"
              value={localConfig.keywords || ''}
              onChange={(e) => handleConfigChange('keywords', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>News Sources</Label>
            <Select
              key={`source-${node.id}`}
              value={localConfig.source || 'all'}
              onValueChange={(value) => handleConfigChange('source', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="google-news">Google News</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="hackernews">Hacker News</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Time Range</Label>
            <Select
              key={`timeRange-${node.id}`}
              value={localConfig.timeRange || 'day'}
              onValueChange={(value) => handleConfigChange('timeRange', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Last Hour</SelectItem>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Maximum Articles</Label>
            <Input
              key={`maxArticles-${node.id}`}
              type="number"
              min="1"
              max="50"
              value={localConfig.maxResults || 10}
              onChange={(e) => handleConfigChange('maxResults', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      )}

      {/* Perplexity Research Configuration */}
      {node.type === 'perplexity-research' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Research Query</Label>
            <Textarea
              key={`research-query-${node.id}`}
              placeholder="What are the latest developments in AI safety research?"
              rows={3}
              value={localConfig.query || ''}
              onChange={(e) => handleConfigChange('query', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Research Depth</Label>
            <Select
              key={`depth-${node.id}`}
              value={localConfig.depth || 'medium'}
              onValueChange={(value) => handleConfigChange('depth', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick Overview</SelectItem>
                <SelectItem value="medium">Medium Depth</SelectItem>
                <SelectItem value="deep">Deep Research</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`includeSources-${node.id}`}
              checked={localConfig.includeSources || true}
              onCheckedChange={(checked) => handleConfigChange('includeSources', checked)}
            />
            <Label>Include source citations</Label>
          </div>
        </div>
      )}

      {/* AI Processor Configuration */}
      {node.type === 'ai-processor' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select
              key={`contentType-${node.id}`}
              value={localConfig.contentType || 'article'}
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
          <div className="space-y-2">
            <Label>Custom Prompt</Label>
            <Textarea
              key={`prompt-${node.id}`}
              placeholder="Transform this content into a professional article..."
              rows={3}
              value={localConfig.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Publisher Configuration */}
      {node.type === 'publisher' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Publish Status</Label>
            <Select
              key={`status-${node.id}`}
              value={localConfig.status || 'draft'}
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
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              key={`category-${node.id}`}
              value={localConfig.category || 'AI Generated'}
              onChange={(e) => handleConfigChange('category', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`autoPublish-${node.id}`}
              checked={localConfig.autoPublishConditional || false}
              onCheckedChange={(checked) => handleConfigChange('autoPublishConditional', checked)}
            />
            <Label>Auto-publish if quality score greater than 80%</Label>
          </div>
        </div>
      )}

      {/* Social Poster Configuration */}
      {node.type === 'social-poster' && (
        <div className="space-y-4">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>Post Content Template</Label>
            <Textarea
              placeholder="Check out our new article: {{article.title}} {{article.url}}"
              rows={4}
              value={node.config.content || ''}
              onChange={(e) => handleConfigChange('content', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use {{article.title}} and {{article.url}} as placeholders.
            </p>
          </div>
        </div>
      )}

      {/* Email Sender Configuration */}
      {node.type === 'email-sender' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={node.config.recipient || ''}
              onChange={(e) => handleConfigChange('recipient', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input
              placeholder="New Article: {{article.title}}"
              value={node.config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use {{article.title}} and {{article.url}} as placeholders.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              rows={4}
              placeholder="A new article has been published. Read it here: {{article.url}}"
              value={node.config.body || ''}
              onChange={(e) => handleConfigChange('body', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Placeholders are supported here as well.
            </p>
          </div>
        </div>
      )}

      {/* Image Generator Configuration */}
      {node.type === 'image-generator' && (
        <div className="space-y-4">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>Image Prompt</Label>
            <Textarea
              placeholder="A photorealistic image of..."
              rows={4}
              value={node.config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use {{article.title}} and {{article.excerpt}} as placeholders.
            </p>
          </div>
        </div>
      )}

      {/* SEO Analyzer Configuration */}
      {node.type === 'seo-analyzer' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Focus Keywords (comma separated)</Label>
            <Input
              placeholder="AI, automation, content creation"
              value={Array.isArray(node.config.keywords) ? node.config.keywords.join(', ') : ''}
              onChange={(e) => handleConfigChange('keywords', e.target.value.split(',').map(k => k.trim()))}
            />
          </div>
          <div className="space-y-2">
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
      
      {/* Translator Configuration */}
      {node.type === 'translator' && (
        <div className="space-y-4">
          <div className="space-y-2">
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
            <p className="text-xs text-muted-foreground">
              {node.config.provider === 'google' 
                ? 'Professional translation service - requires Cloud Translation API enabled'
                : 'AI-powered translation - more cost-effective and good quality'
              }
            </p>
          </div>
          <div className="space-y-2">
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

      {/* Content Quality Analyzer Configuration */}
      {node.type === 'content-quality-analyzer' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Quality Metrics</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.checkReadability || true}
                  onCheckedChange={(checked) => handleConfigChange('checkReadability', checked)}
                />
                <Label>Readability score</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.checkGrammar || true}
                  onCheckedChange={(checked) => handleConfigChange('checkGrammar', checked)}
                />
                <Label>Grammar and style</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.checkCoherence || true}
                  onCheckedChange={(checked) => handleConfigChange('checkCoherence', checked)}
                />
                <Label>Content coherence</Label>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This node uses AI to analyze article quality and generate improvement suggestions for articles with a quality score below 70.
          </p>
        </div>
      )}

      {/* AI SEO Optimizer Configuration */}
      {node.type === 'ai-seo-optimizer' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Optimization Focus</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.optimizeKeywords || true}
                  onCheckedChange={(checked) => handleConfigChange('optimizeKeywords', checked)}
                />
                <Label>Keyword optimization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.optimizeHeadings || true}
                  onCheckedChange={(checked) => handleConfigChange('optimizeHeadings', checked)}
                />
                <Label>Heading structure</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.generateMetaDesc || true}
                  onCheckedChange={(checked) => handleConfigChange('generateMetaDesc', checked)}
                />
                <Label>Meta descriptions</Label>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This node uses AI to analyze articles and generate SEO keywords, meta descriptions, and other on-page improvements.
          </p>
        </div>
      )}

      {/* Engagement Forecaster Configuration */}
      {node.type === 'engagement-forecaster' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Prediction Metrics</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.predictShares || true}
                  onCheckedChange={(checked) => handleConfigChange('predictShares', checked)}
                />
                <Label>Social media shares</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.predictComments || true}
                  onCheckedChange={(checked) => handleConfigChange('predictComments', checked)}
                />
                <Label>Comment engagement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.predictViews || true}
                  onCheckedChange={(checked) => handleConfigChange('predictViews', checked)}
                />
                <Label>Page views</Label>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This node uses AI to predict engagement potential and suggests social media posts for high-potential articles.
          </p>
        </div>
      )}

      {/* Content Performance Analyzer Configuration */}
      {node.type === 'content-performance-analyzer' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Analysis Metrics</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.trackViews || true}
                  onCheckedChange={(checked) => handleConfigChange('trackViews', checked)}
                />
                <Label>Page views</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.trackEngagement || true}
                  onCheckedChange={(checked) => handleConfigChange('trackEngagement', checked)}
                />
                <Label>Engagement metrics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.trackSEO || true}
                  onCheckedChange={(checked) => handleConfigChange('trackSEO', checked)}
                />
                <Label>SEO performance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={node.config.trackSocial || false}
                  onCheckedChange={(checked) => handleConfigChange('trackSocial', checked)}
                />
                <Label>Social media metrics</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Analysis Period</Label>
            <Select
              value={node.config.period || 'week'}
              onValueChange={(value) => handleConfigChange('period', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={node.config.generateRecommendations || true}
              onCheckedChange={(checked) => handleConfigChange('generateRecommendations', checked)}
            />
            <Label>Generate AI recommendations</Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowSidebar;
