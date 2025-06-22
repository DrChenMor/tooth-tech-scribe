import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { WorkflowNode } from '@/types/WorkflowTypes';
import { 
  Plus, 
  Play, 
  Zap,
  Globe,
  Rss,
  GraduationCap,
  Newspaper,
  Search,
  Brain,
  Shuffle,
  Filter,
  FileText,
  Share2,
  Mail,
  Image,
  Target,
  Languages,
  CheckSquare,
  BarChart3,
  TrendingUp,
  Award
} from 'lucide-react';

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onAddNode: (type: WorkflowNode['type']) => void;
  onUpdateNodeConfig: (nodeId: string, config: Partial<WorkflowNode['config']>) => void;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  selectedNode,
  onAddNode,
  onUpdateNodeConfig,
}) => {
  const nodeTypes = [
    { type: 'trigger' as const, icon: Play, label: 'Trigger', category: 'Control' },
    { type: 'scraper' as const, icon: Globe, label: 'Web Scraper', category: 'Data Sources' },
    { type: 'rss-aggregator' as const, icon: Rss, label: 'RSS Aggregator', category: 'Data Sources' },
    { type: 'google-scholar-search' as const, icon: GraduationCap, label: 'Google Scholar Search', category: 'Data Sources' },
    { type: 'news-discovery' as const, icon: Newspaper, label: 'News Discovery', category: 'Data Sources' },
    { type: 'perplexity-research' as const, icon: Search, label: 'Perplexity Research', category: 'Data Sources' },
    { type: 'ai-processor' as const, icon: Brain, label: 'AI Processor', category: 'Processing' },
    { type: 'multi-source-synthesizer' as const, icon: Shuffle, label: 'Multi-Source Synthesizer', category: 'Processing' },
    { type: 'filter' as const, icon: Filter, label: 'Filter', category: 'Processing' },
    { type: 'image-generator' as const, icon: Image, label: 'Image Generator', category: 'Processing' },
    { type: 'seo-analyzer' as const, icon: Target, label: 'SEO Analyzer', category: 'Analysis' },
    { type: 'translator' as const, icon: Languages, label: 'Translator', category: 'Processing' },
    { type: 'content-quality-analyzer' as const, icon: CheckSquare, label: 'Content Quality Analyzer', category: 'Analysis' },
    { type: 'ai-seo-optimizer' as const, icon: Target, label: 'AI SEO Optimizer', category: 'Analysis' },
    { type: 'engagement-forecaster' as const, icon: TrendingUp, label: 'Engagement Forecaster', category: 'Analysis' },
    { type: 'content-performance-analyzer' as const, icon: BarChart3, label: 'Content Performance Analyzer', category: 'Analysis' },
    { type: 'article-structure-validator' as const, icon: Award, label: 'Article Structure Validator', category: 'Analysis' },
    { type: 'publisher' as const, icon: FileText, label: 'Publisher', category: 'Output' },
    { type: 'social-poster' as const, icon: Share2, label: 'Social Poster', category: 'Output' },
    { type: 'email-sender' as const, icon: Mail, label: 'Email Sender', category: 'Output' },
  ];

  const categories = [...new Set(nodeTypes.map(node => node.category))];

  const updateConfig = (key: string, value: any) => {
    if (selectedNode) {
      onUpdateNodeConfig(selectedNode.id, { [key]: value });
    }
  };

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select
                key={`schedule-${selectedNode.id}`}
                value={selectedNode.config.schedule || 'manual'}
                onValueChange={(value) => updateConfig('schedule', value)}
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
            {selectedNode.config.schedule !== 'manual' && (
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  key={`time-${selectedNode.id}`}
                  type="time"
                  value={selectedNode.config.time || '09:00'}
                  onChange={(e) => updateConfig('time', e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 'scraper':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URLs to Scrape (one per line)</Label>
              <Textarea
                key={`urls-${selectedNode.id}`}
                placeholder="https://example.com/news&#10;https://another-site.com/articles"
                rows={4}
                value={Array.isArray(selectedNode.config.urls) ? selectedNode.config.urls.join('\n') : ''}
                onChange={(e) => updateConfig('urls', e.target.value.split('\n').filter(url => url.trim() !== ''))}
              />
            </div>
            <div className="space-y-2">
              <Label>Content Selector (CSS)</Label>
              <Input
                key={`selector-${selectedNode.id}`}
                placeholder="article, .content, #main"
                value={selectedNode.config.selector || ''}
                onChange={(e) => updateConfig('selector', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                key={`followPagination-${selectedNode.id}`}
                checked={selectedNode.config.followPagination || false}
                onCheckedChange={(checked) => updateConfig('followPagination', checked)}
              />
              <Label>Follow pagination</Label>
            </div>
          </div>
        );

      case 'rss-aggregator':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>RSS Feed URLs (one per line)</Label>
              <Textarea
                key={`rss-urls-${selectedNode.id}`}
                placeholder="https://example.com/feed.xml&#10;https://another-site.com/rss"
                rows={4}
                value={Array.isArray(selectedNode.config.urls) ? selectedNode.config.urls.join('\n') : ''}
                onChange={(e) => updateConfig('urls', e.target.value.split('\n').filter(url => url.trim() !== ''))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Items per Feed</Label>
              <Input
                key={`maxItems-${selectedNode.id}`}
                type="number"
                min="1"
                max="50"
                value={selectedNode.config.maxItems || 10}
                onChange={(e) => updateConfig('maxItems', parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        );

      case 'google-scholar-search':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                placeholder="machine learning natural language processing"
                value={selectedNode.config.query || ''}
                onChange={(e) => updateConfig('query', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxResults">Number of Results</Label>
              <Input
                id="maxResults"
                type="number"
                min="1"
                max="100"
                value={selectedNode.config.maxResults || 20}
                onChange={(e) => updateConfig('maxResults', parseInt(e.target.value, 10))}
              />
            </div>

            <div>
              <Label htmlFor="yearFrom">Publication Year Range</Label>
              <div className="flex gap-2">
                <Input
                  id="yearFrom"
                  type="number"
                  placeholder="2020"
                  value={selectedNode.config.yearFrom || ''}
                  onChange={(e) => updateConfig('yearFrom', e.target.value)}
                />
                <span className="self-center text-sm">to</span>
                <Input
                  id="yearTo"
                  type="number"
                  placeholder="2024"
                  value={selectedNode.config.yearTo || ''}
                  onChange={(e) => updateConfig('yearTo', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="includeAbstracts">Include abstracts</Label>
              <Switch
                id="includeAbstracts"
                checked={selectedNode.config.includeAbstracts || true}
                onCheckedChange={(checked) => updateConfig('includeAbstracts', checked)}
              />
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="customInstructions"
                placeholder="Add specific instructions for academic paper filtering..."
                rows={2}
                value={selectedNode.config.customInstructions || ''}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
              />
            </div>
          </div>
        );

      case 'news-discovery':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="keywords">Search Keywords</Label>
              <Input
                id="keywords"
                placeholder="artificial intelligence, technology"
                value={selectedNode.config.keywords || ''}
                onChange={(e) => updateConfig('keywords', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="source">News Sources</Label>
              <Select
                id="source"
                value={selectedNode.config.source || 'all'}
                onValueChange={(value) => updateConfig('source', value)}
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

            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <Select
                id="timeRange"
                value={selectedNode.config.timeRange || 'day'}
                onValueChange={(value) => updateConfig('timeRange', value)}
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

            <div>
              <Label htmlFor="maxArticles">Maximum Articles</Label>
              <Input
                id="maxArticles"
                type="number"
                min="1"
                max="50"
                value={selectedNode.config.maxResults || 10}
                onChange={(e) => updateConfig('maxResults', parseInt(e.target.value, 10))}
              />
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="customInstructions"
                placeholder="Add specific instructions for news filtering..."
                rows={2}
                value={selectedNode.config.customInstructions || ''}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
              />
            </div>
          </div>
        );

      case 'perplexity-research':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="query">Research Query</Label>
              <Textarea
                id="research-query"
                placeholder="What are the latest developments in AI safety research?"
                rows={3}
                value={selectedNode.config.query || ''}
                onChange={(e) => updateConfig('query', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="depth">Research Depth</Label>
              <Select
                id="depth"
                value={selectedNode.config.depth || 'medium'}
                onValueChange={(value) => updateConfig('depth', value)}
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

            <div>
              <Label htmlFor="includeSources">Include source citations</Label>
              <Switch
                id="includeSources"
                checked={selectedNode.config.includeSources || true}
                onCheckedChange={(checked) => updateConfig('includeSources', checked)}
              />
            </div>
          </div>
        );

      case 'ai-processor':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select
                id="contentType"
                value={selectedNode.config.contentType || 'article'}
                onValueChange={(value) => updateConfig('contentType', value)}
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

            <div>
              <Label htmlFor="writingStyle">Writing Style</Label>
              <Select
                id="writingStyle"
                value={selectedNode.config.writingStyle || 'Professional'}
                onValueChange={(value) => updateConfig('writingStyle', value)}
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

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select
                id="targetAudience"
                value={selectedNode.config.targetAudience || 'General readers'}
                onValueChange={(value) => updateConfig('targetAudience', value)}
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

            <div>
              <Label htmlFor="category">Article Category</Label>
              <Input
                id="category"
                placeholder="Technology, Business, Science..."
                value={selectedNode.config.category || ''}
                onChange={(e) => updateConfig('category', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
              <Textarea
                id="prompt"
                placeholder="Add specific instructions for content transformation..."
                rows={3}
                value={selectedNode.config.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
              />
            </div>
          </div>
        );

      case 'multi-source-synthesizer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="style">Synthesis Style</Label>
              <Select
                id="style"
                value={selectedNode.config.style || 'comprehensive'}
                onValueChange={(value) => updateConfig('style', value)}
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

            <div>
              <Label htmlFor="targetLength">Target Length</Label>
              <Select
                id="targetLength"
                value={selectedNode.config.targetLength || 'medium'}
                onValueChange={(value) => updateConfig('targetLength', value)}
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

            <div>
              <Label htmlFor="maintainAttribution">Maintain source attribution</Label>
              <Switch
                id="maintainAttribution"
                checked={selectedNode.config.maintainAttribution !== false}
                onCheckedChange={(checked) => updateConfig('maintainAttribution', checked)}
              />
            </div>

            <div>
              <Label htmlFor="resolveConflicts">Resolve conflicting information</Label>
              <Switch
                id="resolveConflicts"
                checked={selectedNode.config.resolveConflicts !== false}
                onCheckedChange={(checked) => updateConfig('resolveConflicts', checked)}
              />
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="customInstructions"
                placeholder="Add specific instructions for content synthesis..."
                rows={2}
                value={selectedNode.config.customInstructions || ''}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
              />
            </div>
          </div>
        );

      case 'article-structure-validator':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="validationLevel">Validation Level</Label>
              <Select
                id="validationLevel"
                value={selectedNode.config.validationLevel || 'standard'}
                onValueChange={(value) => updateConfig('validationLevel', value)}
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

            <div>
              <Label htmlFor="minWordCount">Minimum Word Count</Label>
              <Input
                id="minWordCount"
                type="number"
                min="100"
                max="5000"
                value={selectedNode.config.minWordCount || 300}
                onChange={(e) => updateConfig('minWordCount', parseInt(e.target.value, 10))}
              />
            </div>

            <div>
              <Label htmlFor="requireConclusion">Require conclusion section</Label>
              <Switch
                id="requireConclusion"
                checked={selectedNode.config.requireConclusion !== false}
                onCheckedChange={(checked) => updateConfig('requireConclusion', checked)}
              />
            </div>

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
              <strong>Article Validation:</strong> This node validates article structure, checks for proper markdown formatting, required sections, and provides quality scores and improvement suggestions.
            </div>
          </div>
        );

      case 'image-generator':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imagePrompt">Image Prompt (Optional)</Label>
              <Textarea
                id="imagePrompt"
                placeholder="Describe the image you want to generate. Leave empty to auto-generate from article title/content."
                value={selectedNode.config.imagePrompt || ''}
                onChange={(e) => updateConfig('imagePrompt', e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                If empty, will generate image based on article title and content from previous nodes.
              </p>
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Style Instructions</Label>
              <Textarea
                id="customInstructions"
                placeholder="e.g., 'modern minimalist style', 'vibrant colors', 'photorealistic'"
                value={selectedNode.config.customInstructions || ''}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="imageSize">Image Size</Label>
              <Select value={selectedNode.config.imageSize || '1024x1024'} onValueChange={(value) => updateConfig('imageSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                  <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                  <SelectItem value="1024x1536">Portrait (1024x1536)</SelectItem>
                  <SelectItem value="1792x1024">Wide (1792x1024)</SelectItem>
                  <SelectItem value="1024x1792">Tall (1024x1792)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageStyle">Image Style (DALL-E only)</Label>
              <Select value={selectedNode.config.imageStyle || 'natural'} onValueChange={(value) => updateConfig('imageStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="vivid">Vivid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageQuality">Image Quality</Label>
              <Select value={selectedNode.config.imageQuality || 'standard'} onValueChange={(value) => updateConfig('imageQuality', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD (DALL-E only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="forceGenerate"
                checked={selectedNode.config.forceGenerate || false}
                onCheckedChange={(checked) => updateConfig('forceGenerate', checked)}
              />
              <Label htmlFor="forceGenerate">Force Generate New Image</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, always generates a new image instead of using cached versions.
            </p>
          </div>
        );

      case 'seo-analyzer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={selectedNode.config.aiModel || 'vertex-ai-imagen-3'} onValueChange={(value) => updateConfig('aiModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertex-ai-imagen-3">Google Vertex AI Imagen 3 (Recommended)</SelectItem>
                  <SelectItem value="dall-e-3">OpenAI DALL-E 3</SelectItem>
                  <SelectItem value="auto">Auto (Try Vertex AI first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="analysisFocus">Analysis Focus</Label>
              <Select
                id="analysisFocus"
                value={selectedNode.config.analysisFocus || 'comprehensive'}
                onValueChange={(value) => updateConfig('analysisFocus', value)}
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

            <div>
              <Label htmlFor="targetKeywords">Target Keywords (Optional)</Label>
              <Input
                id="targetKeywords"
                placeholder="dental AI, artificial intelligence, dentistry"
                value={selectedNode.config.targetKeywords || ''}
                onChange={(e) => updateConfig('targetKeywords', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="includeMetaSuggestions">Include meta description suggestions</Label>
              <Switch
                id="includeMetaSuggestions"
                checked={selectedNode.config.includeMetaSuggestions !== false}
                onCheckedChange={(checked) => updateConfig('includeMetaSuggestions', checked)}
              />
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom SEO Analysis Instructions</Label>
              <Textarea
                id="customInstructions"
                placeholder="Add specific SEO analysis instructions..."
                rows={2}
                value={selectedNode.config.customInstructions || ''}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
              />
            </div>
          </div>
        );

      case 'publisher':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Publish Status</Label>
              <Select
                id="status"
                value={selectedNode.config.status || 'draft'}
                onValueChange={(value) => updateConfig('status', value)}
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
              <Label htmlFor="category">Category Override</Label>
              <Input
                id="category"
                placeholder="Leave empty to use AI Processor category"
                value={selectedNode.config.category || ''}
                onChange={(e) => updateConfig('category', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="authorName">Author Name Override</Label>
              <Input
                id="authorName"
                placeholder="Leave empty for default AI author"
                value={selectedNode.config.authorName || ''}
                onChange={(e) => updateConfig('authorName', e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
              <strong>Article Structure:</strong> The publisher automatically extracts titles, creates proper excerpts, and ensures articles follow your site's structure. Content will be validated for proper markdown formatting.
            </div>
          </div>
        );

      case 'email-sender':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="recipient@example.com"
                value={selectedNode.config.recipient || ''}
                onChange={(e) => updateConfig('recipient', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="New Article: {{article.title}}"
                value={selectedNode.config.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                rows={4}
                placeholder="A new article has been published. Read it here: {{article.url}}"
                value={selectedNode.config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
              />
            </div>
          </div>
        );

      case 'translator':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="translationProvider">Translation Provider</Label>
              <Select
                id="translationProvider"
                value={selectedNode.config.provider || 'gemini'}
                onValueChange={(value) => updateConfig('provider', value)}
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

            <div>
              <Label htmlFor="targetLanguage">Target Language</Label>
              <Select
                id="targetLanguage"
                value={selectedNode.config.targetLanguage || 'es'}
                onValueChange={(value) => updateConfig('targetLanguage', value)}
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
        );

      default:
        return (
          <p className="text-muted-foreground">
            Select a node to configure its settings.
          </p>
        );
    }
  };

  return (
    <div className="w-80 border-r bg-muted/20 flex flex-col">
      {/* Add Nodes Section */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-4">Add Nodes</h3>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {nodeTypes
                  .filter((node) => node.category === category)
                  .map((nodeType) => (
                    <Button
                      key={nodeType.type}
                      variant="outline"
                      size="sm"
                      onClick={() => onAddNode(nodeType.type)}
                      className="justify-start h-8 text-xs"
                    >
                      <nodeType.icon className="h-3 w-3 mr-2" />
                      {nodeType.label}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Configuration Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">
          {selectedNode ? `Configure ${selectedNode.label}` : 'Node Configuration'}
        </h3>
        {renderNodeConfig()}
      </div>
    </div>
  );
};

export default WorkflowSidebar;
