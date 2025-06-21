import { useState, useEffect } from 'react';
import { WorkflowNode } from '@/types/WorkflowTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Clock, Globe, Brain, Filter, Send, ArrowRight, Trash2, 
  Link as LinkIcon, XCircle, Share2, Mail, ImagePlay, 
  SearchCheck, Languages, Rss, Award, TrendingUp, HeartPulse, 
  GraduationCap, Newspaper, Search, Combine, BarChart3 
} from 'lucide-react';

const AVAILABLE_MODELS = {
  'gemini-2.5-flash-preview-05-20': { name: 'Gemini 2.5 Flash', provider: 'Google' },
  'gpt-4-turbo-preview': { name: 'GPT-4 Turbo', provider: 'OpenAI' },
  'claude-3-opus-20240229': { name: 'Claude 3 Opus', provider: 'Anthropic' },
  'dall-e-3': { name: 'DALL-E 3', provider: 'OpenAI' },
};

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onAddNode: (type: WorkflowNode['type']) => void;
  onUpdateNodeConfig: (nodeId: string, config: Partial<WorkflowNode['config']>) => void;
}

const WorkflowSidebar = ({ selectedNode, onAddNode, onUpdateNodeConfig }: WorkflowSidebarProps) => {
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setLocalConfig(selectedNode.config);
    }
  }, [selectedNode]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    if (selectedNode) {
      onUpdateNodeConfig(selectedNode.id, newConfig);
    }
  };

  const renderAIModelSelector = () => {
    const availableModels = Object.entries(AVAILABLE_MODELS);

    return (
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select
          value={localConfig.aiModel || ''}
          onValueChange={(value) => handleConfigChange('aiModel', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(([key, model]) => (
              <SelectItem key={key} value={key}>
                {model.name} ({model.provider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="w-80 border-r bg-muted/20 overflow-y-auto">
      {/* Add Components Section */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-4">Add Components</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { type: 'trigger' as const, icon: Clock, label: 'Trigger', color: 'bg-blue-100' },
            { type: 'scraper' as const, icon: Globe, label: 'Web Scraper', color: 'bg-green-100' },
            { type: 'rss-aggregator' as const, icon: Rss, label: 'RSS Aggregator', color: 'bg-gray-100' },
            { type: 'google-scholar-search' as const, icon: GraduationCap, label: 'Google Scholar', color: 'bg-amber-100' },
            { type: 'news-discovery' as const, icon: Newspaper, label: 'News Discovery', color: 'bg-orange-100' },
            { type: 'perplexity-research' as const, icon: Search, label: 'Perplexity Research', color: 'bg-violet-100' },
            { type: 'multi-source-synthesizer' as const, icon: Combine, label: 'Multi-Source Synthesizer', color: 'bg-emerald-100' },
            { type: 'ai-processor' as const, icon: Brain, label: 'AI Processor', color: 'bg-purple-100' },
            { type: 'image-generator' as const, icon: ImagePlay, label: 'Image Generator', color: 'bg-indigo-100' },
            { type: 'seo-analyzer' as const, icon: SearchCheck, label: 'SEO Analyzer', color: 'bg-pink-100' },
            { type: 'translator' as const, icon: Languages, label: 'Translator', color: 'bg-teal-100' },
            { type: 'article-structure-validator' as const, icon: Award, label: 'Article Validator', color: 'bg-indigo-100' },
            { type: 'filter' as const, icon: Filter, label: 'Filter', color: 'bg-yellow-100' },
            { type: 'publisher' as const, icon: Send, label: 'Publisher', color: 'bg-red-100' },
            { type: 'social-poster' as const, icon: Share2, label: 'Social Poster', color: 'bg-sky-100' },
            { type: 'email-sender' as const, icon: Mail, label: 'Email Sender', color: 'bg-orange-100' },
          ].map(({ type, icon: Icon, label, color }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => onAddNode(type)}
              className={`justify-start h-auto p-3 ${color}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedNode && (
        <div className="p-4">
          <h3 className="font-semibold mb-4">Configure {selectedNode.label}</h3>
          
          {/* AI Processor Configuration */}
          {selectedNode.type === 'ai-processor' && (
            <div className="space-y-4">
              {renderAIModelSelector()}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={localConfig.contentType || 'article'}
                  onValueChange={(value) => handleConfigChange('contentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="blog-post">Blog Post</SelectItem>
                    <SelectItem value="news-report">News Report</SelectItem>
                    <SelectItem value="research-summary">Research Summary</SelectItem>
                    <SelectItem value="opinion-piece">Opinion Piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Writing Style</Label>
                <Select
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
                    <SelectItem value="Conversational">Conversational</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., General readers, Tech professionals, Students"
                  value={localConfig.targetAudience || ''}
                  onChange={(e) => handleConfigChange('targetAudience', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Technology, Health, Business"
                  value={localConfig.category || ''}
                  onChange={(e) => handleConfigChange('category', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Additional instructions for content generation..."
                  value={localConfig.customInstructions || ''}
                  onChange={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Image Generator Configuration */}
          {selectedNode.type === 'image-generator' && (
            <div className="space-y-4">
              {renderAIModelSelector()}
              <div className="space-y-2">
                <Label>Image Prompt</Label>
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={localConfig.imagePrompt || ''}
                  onChange={(e) => handleConfigChange('imagePrompt', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate from article title
                </p>
              </div>

              <div className="space-y-2">
                <Label>Image Style</Label>
                <Select
                  value={localConfig.imageStyle || 'natural'}
                  onValueChange={(value) => handleConfigChange('imageStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="vivid">Vivid</SelectItem>
                    <SelectItem value="digital_art">Digital Art</SelectItem>
                    <SelectItem value="photographic">Photographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Image Size</Label>
                <Select
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

              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Additional styling instructions..."
                  value={localConfig.customInstructions || ''}
                  onChange={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Web Scraper Configuration */}
          {selectedNode.type === 'scraper' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URLs to Scrape</Label>
                <Textarea
                  placeholder="Enter URLs, one per line"
                  value={localConfig.urls?.join('\n') || ''}
                  onChange={(e) => handleConfigChange('urls', e.target.value.split('\n').filter(url => url.trim()))}
                />
              </div>
              <div className="space-y-2">
                <Label>CSS Selector (optional)</Label>
                <Input
                  placeholder="e.g., .article-content, body"
                  value={localConfig.selector || ''}
                  onChange={(e) => handleConfigChange('selector', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* RSS Aggregator Configuration */}
          {selectedNode.type === 'rss-aggregator' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>RSS Feed URLs</Label>
                <Textarea
                  placeholder="Enter RSS feed URLs, one per line"
                  value={localConfig.urls?.join('\n') || ''}
                  onChange={(e) => handleConfigChange('urls', e.target.value.split('\n').filter(url => url.trim()))}
                />
              </div>
            </div>
          )}

          {/* Google Scholar Configuration */}
          {selectedNode.type === 'google-scholar-search' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Query</Label>
                <Input
                  placeholder="Academic search terms"
                  value={localConfig.query || ''}
                  onChange={(e) => handleConfigChange('query', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Results</Label>
                <Input
                  type="number"
                  placeholder="20"
                  min="1"
                  max="100"
                  value={localConfig.maxResults || ''}
                  onChange={(e) => handleConfigChange('maxResults', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Year From</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={localConfig.yearFrom || ''}
                  onChange={(e) => handleConfigChange('yearFrom', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Year To</Label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={localConfig.yearTo || ''}
                  onChange={(e) => handleConfigChange('yearTo', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAbstracts"
                  checked={localConfig.includeAbstracts || false}
                  onCheckedChange={(checked) => handleConfigChange('includeAbstracts', checked)}
                />
                <Label htmlFor="includeAbstracts">Include Abstracts</Label>
              </div>
            </div>
          )}

          {/* News Discovery Configuration */}
          {selectedNode.type === 'news-discovery' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  placeholder="Search keywords separated by commas"
                  value={localConfig.keywords || ''}
                  onChange={(e) => handleConfigChange('keywords', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>News Source</Label>
                <Select
                  value={localConfig.source || 'all'}
                  onValueChange={(value) => handleConfigChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="reuters">Reuters</SelectItem>
                    <SelectItem value="bbc">BBC</SelectItem>
                    <SelectItem value="cnn">CNN</SelectItem>
                    <SelectItem value="techcrunch">TechCrunch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select
                  value={localConfig.timeRange || 'day'}
                  onValueChange={(value) => handleConfigChange('timeRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Last Hour</SelectItem>
                    <SelectItem value="day">Last Day</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Results</Label>
                <Input
                  type="number"
                  placeholder="10"
                  min="1"
                  max="50"
                  value={localConfig.maxResults || ''}
                  onChange={(e) => handleConfigChange('maxResults', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Perplexity Research Configuration */}
          {selectedNode.type === 'perplexity-research' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Research Query</Label>
                <Textarea
                  placeholder="What would you like to research?"
                  value={localConfig.query || ''}
                  onChange={(e) => handleConfigChange('query', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Research Depth</Label>
                <Select
                  value={localConfig.depth || 'medium'}
                  onValueChange={(value) => handleConfigChange('depth', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSources"
                  checked={localConfig.includeSources !== false}
                  onCheckedChange={(checked) => handleConfigChange('includeSources', checked)}
                />
                <Label htmlFor="includeSources">Include Sources</Label>
              </div>
            </div>
          )}

          {/* Multi-Source Synthesizer Configuration */}
          {selectedNode.type === 'multi-source-synthesizer' && (
            <div className="space-y-4">
              {renderAIModelSelector()}
              <div className="space-y-2">
                <Label>Synthesis Style</Label>
                <Select
                  value={localConfig.style || 'comprehensive'}
                  onValueChange={(value) => handleConfigChange('style', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="analytical">Analytical</SelectItem>
                    <SelectItem value="narrative">Narrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Length</Label>
                <Select
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
                <Checkbox
                  id="maintainAttribution"
                  checked={localConfig.maintainAttribution !== false}
                  onCheckedChange={(checked) => handleConfigChange('maintainAttribution', checked)}
                />
                <Label htmlFor="maintainAttribution">Maintain Source Attribution</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resolveConflicts"
                  checked={localConfig.resolveConflicts !== false}
                  onCheckedChange={(checked) => handleConfigChange('resolveConflicts', checked)}
                />
                <Label htmlFor="resolveConflicts">Resolve Conflicting Information</Label>
              </div>
              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Additional synthesis instructions..."
                  value={localConfig.customInstructions || ''}
                  onChange={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SEO Analyzer Configuration */}
          {selectedNode.type === 'seo-analyzer' && (
            <div className="space-y-4">
              {renderAIModelSelector()}
              <div className="space-y-2">
                <Label>Target Keywords</Label>
                <Input
                  placeholder="Comma-separated keywords"
                  value={localConfig.targetKeywords || ''}
                  onChange={(e) => handleConfigChange('targetKeywords', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Analysis Focus</Label>
                <Select
                  value={localConfig.analysisFocus || 'general'}
                  onValueChange={(value) => handleConfigChange('analysisFocus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General SEO</SelectItem>
                    <SelectItem value="technical">Technical SEO</SelectItem>
                    <SelectItem value="content">Content SEO</SelectItem>
                    <SelectItem value="local">Local SEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Additional SEO analysis instructions..."
                  value={localConfig.customInstructions || ''}
                  onChange={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Translator Configuration */}
          {selectedNode.type === 'translator' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target Language</Label>
                <Select
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
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Translation Provider</Label>
                <Select
                  value={localConfig.provider || 'google'}
                  onValueChange={(value) => handleConfigChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Translate</SelectItem>
                    <SelectItem value="deepl">DeepL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Article Structure Validator Configuration */}
          {selectedNode.type === 'article-structure-validator' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Word Count</Label>
                <Input
                  type="number"
                  placeholder="300"
                  min="100"
                  max="5000"
                  value={localConfig.minWordCount || ''}
                  onChange={(e) => handleConfigChange('minWordCount', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireConclusion"
                  checked={localConfig.requireConclusion !== false}
                  onCheckedChange={(checked) => handleConfigChange('requireConclusion', checked)}
                />
                <Label htmlFor="requireConclusion">Require Conclusion Section</Label>
              </div>
            </div>
          )}

          {/* Publisher Configuration */}
          {selectedNode.type === 'publisher' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  placeholder="Article category"
                  value={localConfig.category || ''}
                  onChange={(e) => handleConfigChange('category', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={localConfig.status || 'draft'}
                  onValueChange={(value) => handleConfigChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Email Sender Configuration */}
          {selectedNode.type === 'email-sender' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={localConfig.recipient || ''}
                  onChange={(e) => handleConfigChange('recipient', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={localConfig.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  placeholder="Email body (optional - will use workflow data)"
                  value={localConfig.body || ''}
                  onChange={(e) => handleConfigChange('body', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowSidebar;
