
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
import { AVAILABLE_MODELS } from '@/services/aiModelService';

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onAddNode: (type: WorkflowNode['type']) => void;
  onUpdateNodeConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void;
}

// Add this function right after the imports in WorkflowSidebar.tsx

const renderImageModelSelector = (localConfig: any, handleConfigChange: any, nodeId: string) => {
  const imageModels = [
    { id: 'dall-e-3', name: 'DALL-E 3 (OpenAI)', provider: 'OpenAI' },
    { id: 'dall-e-2', name: 'DALL-E 2 (OpenAI)', provider: 'OpenAI' },
    { id: 'gemini-imagen-3', name: 'Imagen 3 (Google)', provider: 'Google' },
    { id: 'gemini-imagen-2', name: 'Imagen 2 (Google)', provider: 'Google' },
  ];

  return (
    <div className="space-y-2">
      <Label>AI Model for Image Generation</Label>
      <Select
        key={`aiModel-${nodeId}`}
        value={localConfig.aiModel || 'dall-e-3'}
        onValueChange={(value) => handleConfigChange('aiModel', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {imageModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

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
    { type: 'article-structure-validator', icon: Award, label: 'Article Structure Validator', description: 'Validate article structure and quality' },
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
      'article-structure-validator': Award,
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
        value={localConfig.aiModel || 'gemini-2.5-flash-preview-05-20'}
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

  const renderCustomInstructions = (placeholder: string = "Add specific instructions...") => (
    <div className="space-y-2">
      <Label>Custom Instructions (Optional)</Label>
      <Textarea
        key={`customInstructions-${node.id}`}
        placeholder={placeholder}
        rows={3}
        value={localConfig.customInstructions || ''}
        onChange={(e) => handleConfigChange('customInstructions', e.target.value)}
      />
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
          {renderAIModelSelector()}
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
          <div className="space-y-2">
            <Label>Include abstracts</Label>
            <Switch
              key={`includeAbstracts-${node.id}`}
              checked={localConfig.includeAbstracts || true}
              onCheckedChange={(checked) => handleConfigChange('includeAbstracts', checked)}
            />
          </div>
          {renderCustomInstructions("Add specific instructions for academic paper filtering...")}
        </div>
      )}
      
      {/* News Discovery Configuration */}
      {node.type === 'news-discovery' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
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
                <SelectItem value="all">All Sources (GNews + Guardian + Hacker News)</SelectItem>
                <SelectItem value="gnews">GNews (World News)</SelectItem>
                <SelectItem value="guardian">The Guardian (Quality Journalism)</SelectItem>
                <SelectItem value="hackernews">Hacker News (Tech News)</SelectItem>
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
          {renderCustomInstructions("Add specific instructions for news filtering...")}
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

      {/* Enhanced AI Processor Configuration */}
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
                <SelectItem value="news-report">News Report</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Select
              key={`writingStyle-${node.id}`}
              value={localConfig.writingStyle || 'Professional'}
              onValueChange={(value) => handleConfigChange('writingStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Conversational">Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select
              key={`targetAudience-${node.id}`}
              value={localConfig.targetAudience || 'General readers'}
              onValueChange={(value) => handleConfigChange('targetAudience', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General readers">General Readers</SelectItem>
                <SelectItem value="Experts">Industry Experts</SelectItem>
                <SelectItem value="Students">Students</SelectItem>
                <SelectItem value="Beginners">Beginners</SelectItem>
                <SelectItem value="Professionals">Professionals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Article Category</Label>
            <Input
              key={`category-${node.id}`}
              placeholder="Technology, Business, Science..."
              value={localConfig.category || ''}
              onChange={(e) => handleConfigChange('category', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              key={`prompt-${node.id}`}
              placeholder="Add specific instructions for content transformation..."
              rows={3}
              value={localConfig.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Enhanced Publisher Configuration */}
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
            <Label>Category Override</Label>
            <Input
              key={`category-${node.id}`}
              placeholder="Leave empty to use AI Processor category"
              value={localConfig.category || ''}
              onChange={(e) => handleConfigChange('category', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Author Name Override</Label>
            <Input
              key={`authorName-${node.id}`}
              placeholder="Leave empty for default AI author"
              value={localConfig.authorName || ''}
              onChange={(e) => handleConfigChange('authorName', e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            <strong>Article Structure:</strong> The publisher automatically extracts titles, creates proper excerpts, and ensures articles follow your site's structure. Content will be validated for proper markdown formatting.
          </div>
        </div>
      )}

      {/* Email Sender Configuration */}
      {node.type === 'email-sender' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              key={`recipient-${node.id}`}
              type="email"
              placeholder="recipient@example.com"
              value={localConfig.recipient || ''}
              onChange={(e) => handleConfigChange('recipient', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input
              key={`subject-${node.id}`}
              placeholder="New Article: {{article.title}}"
              value={localConfig.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              key={`body-${node.id}`}
              rows={4}
              placeholder="A new article has been published. Read it here: {{article.url}}"
              value={localConfig.body || ''}
              onChange={(e) => handleConfigChange('body', e.target.value)}
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
              key={`translationProvider-${node.id}`}
              value={localConfig.provider || 'gemini'}
              onValueChange={(value) => handleConfigChange('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini (Fast & High Quality)</SelectItem>
                <SelectItem value="openai">OpenAI GPT (Cost-effective)</SelectItem>
                <SelectItem value="claude">Anthropic Claude (High quality)</SelectItem>
                <SelectItem value="google">Google Translate API (Most accurate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Language</Label>
            <Select
              key={`targetLanguage-${node.id}`}
              value={localConfig.targetLanguage || 'es'}
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

{/* Image Generator Configuration */}
{node.type === 'image-generator' && (
  <div className="space-y-4">
    {renderAIModelSelector()}
    <div className="space-y-2">
      <Label>Image Prompt</Label>
      <Textarea
        key={`imagePrompt-${node.id}`}
        placeholder="A professional illustration of dental AI technology..."
        rows={3}
        value={localConfig.imagePrompt || ''}
        onChange={(e) => handleConfigChange('imagePrompt', e.target.value)}
      />
    </div>
    <div className="space-y-2">
      <Label>Image Style</Label>
      <Select
        key={`imageStyle-${node.id}`}
        value={localConfig.imageStyle || 'natural'}
        onValueChange={(value) => handleConfigChange('imageStyle', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="natural">Natural</SelectItem>
          <SelectItem value="digital_art">Digital Art</SelectItem>
          <SelectItem value="photographic">Photographic</SelectItem>
          <SelectItem value="vivid">Vivid</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Image Size</Label>
      <Select
        key={`imageSize-${node.id}`}
        value={localConfig.imageSize || '1024x1024'}
        onValueChange={(value) => handleConfigChange('imageSize', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
          <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
          <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Image Quality</Label>
      <Select
        key={`imageQuality-${node.id}`}
        value={localConfig.imageQuality || 'standard'}
        onValueChange={(value) => handleConfigChange('imageQuality', value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="hd">HD</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {renderCustomInstructions("Add specific instructions for image generation...")}
    
    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
      <strong>AI Model Notes:</strong>
      <ul className="mt-2 space-y-1 text-xs">
        <li>• <strong>Gemini models:</strong> Use Google Imagen for high-quality images</li>
        <li>• <strong>DALL-E models:</strong> Use OpenAI for creative, detailed images</li>
        <li>• <strong>Fallback:</strong> High-quality placeholder if API fails</li>
      </ul>
    </div>
  </div>
)}

      {/* SEO Analyzer Configuration */}
      {node.type === 'seo-analyzer' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Analysis Focus</Label>
            <Select
              key={`analysisFocus-${node.id}`}
              value={localConfig.analysisFocus || 'comprehensive'}
              onValueChange={(value) => handleConfigChange('analysisFocus', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                <SelectItem value="keywords">Keywords Focus</SelectItem>
                <SelectItem value="readability">Readability Focus</SelectItem>
                <SelectItem value="technical">Technical SEO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Keywords (Optional)</Label>
            <Input
              key={`targetKeywords-${node.id}`}
              placeholder="dental AI, artificial intelligence, dentistry"
              value={localConfig.targetKeywords || ''}
              onChange={(e) => handleConfigChange('targetKeywords', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`includeMetaSuggestions-${node.id}`}
              checked={localConfig.includeMetaSuggestions !== false}
              onCheckedChange={(checked) => handleConfigChange('includeMetaSuggestions', checked)}
            />
            <Label>Include meta description suggestions</Label>
          </div>
          {renderCustomInstructions("Add specific SEO analysis instructions...")}
        </div>
      )}

      {/* Multi-Source Synthesizer Configuration */}
      {node.type === 'multi-source-synthesizer' && (
        <div className="space-y-4">
          {renderAIModelSelector()}
          <div className="space-y-2">
            <Label>Synthesis Style</Label>
            <Select
              key={`style-${node.id}`}
              value={localConfig.style || 'comprehensive'}
              onValueChange={(value) => handleConfigChange('style', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
                <SelectItem value="narrative">Narrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Length</Label>
            <Select
              key={`targetLength-${node.id}`}
              value={localConfig.targetLength || 'medium'}
              onValueChange={(value) => handleConfigChange('targetLength', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (500-800 words)</SelectItem>
                <SelectItem value="medium">Medium (800-1500 words)</SelectItem>
                <SelectItem value="long">Long (1500+ words)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`maintainAttribution-${node.id}`}
              checked={localConfig.maintainAttribution !== false}
              onCheckedChange={(checked) => handleConfigChange('maintainAttribution', checked)}
            />
            <Label>Maintain source attribution</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`resolveConflicts-${node.id}`}
              checked={localConfig.resolveConflicts !== false}
              onCheckedChange={(checked) => handleConfigChange('resolveConflicts', checked)}
            />
            <Label>Resolve conflicting information</Label>
          </div>
          {renderCustomInstructions("Add specific instructions for content synthesis...")}
        </div>
      )}
      
      {/* Article Structure Validator Configuration */}
      {node.type === 'article-structure-validator' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Validation Level</Label>
            <Select
              key={`validationLevel-${node.id}`}
              value={localConfig.validationLevel || 'standard'}
              onValueChange={(value) => handleConfigChange('validationLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (Title, headings)</SelectItem>
                <SelectItem value="standard">Standard (Structure, formatting)</SelectItem>
                <SelectItem value="strict">Strict (All requirements)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Minimum Word Count</Label>
            <Input
              key={`minWordCount-${node.id}`}
              type="number"
              min="100"
              max="5000"
              value={localConfig.minWordCount || 300}
              onChange={(e) => handleConfigChange('minWordCount', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              key={`requireConclusion-${node.id}`}
              checked={localConfig.requireConclusion !== false}
              onCheckedChange={(checked) => handleConfigChange('requireConclusion', checked)}
            />
            <Label>Require conclusion section</Label>
          </div>
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            <strong>Article Validation:</strong> This node validates article structure, checks for proper markdown formatting, required sections, and provides quality scores and improvement suggestions.
          </div>
        </div>
      )}

      {/* Default message for other node types */}
{!['trigger', 'scraper', 'rss-aggregator', 'google-scholar-search', 'news-discovery', 'perplexity-research', 'ai-processor', 'multi-source-synthesizer', 'publisher', 'email-sender', 'translator', 'article-structure-validator', 'image-generator', 'seo-analyzer'].includes(node.type) && (        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configuration options for {node.label} will be available soon.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowSidebar;
