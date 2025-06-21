import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox"
import { WorkflowNode } from '@/types/WorkflowTypes';

interface WorkflowSidebarProps {
  selectedNode: WorkflowNode | null;
  onUpdateNodeConfig: (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => void;
  onAddNode: (type: WorkflowNode['type']) => void;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ selectedNode, onUpdateNodeConfig, onAddNode }) => {
  const handleConfigChange = useCallback((field: string, value: any) => {
    if (selectedNode) {
      onUpdateNodeConfig(selectedNode.id, { [field]: value });
    }
  }, [selectedNode, onUpdateNodeConfig]);

  if (!selectedNode) {
    return (
      <div className="w-80 p-4 border-r bg-muted/50">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Nodes</CardTitle>
            <CardDescription>Add nodes to build your workflow.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" onClick={() => onAddNode('trigger')}>Add Trigger</Button>
            <Button variant="outline" onClick={() => onAddNode('scraper')}>Add Web Scraper</Button>
            <Button variant="outline" onClick={() => onAddNode('rss-aggregator')}>Add RSS Aggregator</Button>
            <Button variant="outline" onClick={() => onAddNode('google-scholar-search')}>Add Google Scholar Search</Button>
            <Button variant="outline" onClick={() => onAddNode('news-discovery')}>Add News Discovery</Button>
            <Button variant="outline" onClick={() => onAddNode('perplexity-research')}>Add Perplexity Research</Button>
            <Button variant="outline" onClick={() => onAddNode('ai-processor')}>Add AI Processor</Button>
            <Button variant="outline" onClick={() => onAddNode('multi-source-synthesizer')}>Add Multi-Source Synthesizer</Button>
            <Button variant="outline" onClick={() => onAddNode('filter')}>Add Filter</Button>
            <Button variant="outline" onClick={() => onAddNode('publisher')}>Add Publisher</Button>
            <Button variant="outline" onClick={() => onAddNode('social-poster')}>Add Social Poster</Button>
            <Button variant="outline" onClick={() => onAddNode('email-sender')}>Add Email Sender</Button>
            <Button variant="outline" onClick={() => onAddNode('image-generator')}>Add Image Generator</Button>
            <Button variant="outline" onClick={() => onAddNode('seo-analyzer')}>Add SEO Analyzer</Button>
            <Button variant="outline" onClick={() => onAddNode('translator')}>Add Translator</Button>
            <Button variant="outline" onClick={() => onAddNode('content-quality-analyzer')}>Add Content Quality Analyzer</Button>
            <Button variant="outline" onClick={() => onAddNode('ai-seo-optimizer')}>Add AI SEO Optimizer</Button>
            <Button variant="outline" onClick={() => onAddNode('engagement-forecaster')}>Add Engagement Forecaster</Button>
            <Button variant="outline" onClick={() => onAddNode('content-performance-analyzer')}>Add Content Performance Analyzer</Button>
            <Button variant="outline" onClick={() => onAddNode('article-structure-validator')}>Add Article Structure Validator</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 border-r bg-muted/50">
      <Card>
        <CardHeader>
          <CardTitle>{selectedNode.label} Configuration</CardTitle>
          <CardDescription>Configure the selected node.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {selectedNode.type === 'trigger' && (
            <p>This node triggers the workflow.</p>
          )}

          {selectedNode.type === 'scraper' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="urls">URLs (one per line)</Label>
                <Textarea
                  id="urls"
                  placeholder="Enter URLs to scrape, one per line"
                  defaultValue={selectedNode.config.urls?.join('\n') || ''}
                  onBlur={(e) => handleConfigChange('urls', e.target.value.split('\n'))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="selector">CSS Selector</Label>
                <Input
                  type="text"
                  id="selector"
                  placeholder="Enter CSS selector for content"
                  defaultValue={selectedNode.config.selector || ''}
                  onBlur={(e) => handleConfigChange('selector', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'rss-aggregator' && (
            <div className="grid gap-2">
              <Label htmlFor="rssUrls">RSS Feed URLs (one per line)</Label>
              <Textarea
                id="rssUrls"
                placeholder="Enter RSS feed URLs, one per line"
                defaultValue={selectedNode.config.urls?.join('\n') || ''}
                onBlur={(e) => handleConfigChange('urls', e.target.value.split('\n'))}
              />
            </div>
          )}

          {selectedNode.type === 'google-scholar-search' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="scholarQuery">Search Query</Label>
                <Input
                  type="text"
                  id="scholarQuery"
                  placeholder="Enter search query"
                  defaultValue={selectedNode.config.query || ''}
                  onBlur={(e) => handleConfigChange('query', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxResults">Max Results</Label>
                <Input
                  type="number"
                  id="maxResults"
                  placeholder="Enter max results"
                  defaultValue={selectedNode.config.maxResults || 20}
                  onBlur={(e) => handleConfigChange('maxResults', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearFrom">Year From</Label>
                <Input
                  type="number"
                  id="yearFrom"
                  placeholder="Enter year from"
                  defaultValue={selectedNode.config.yearFrom || ''}
                  onBlur={(e) => handleConfigChange('yearFrom', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearTo">Year To</Label>
                <Input
                  type="number"
                  id="yearTo"
                  placeholder="Enter year to"
                  defaultValue={selectedNode.config.yearTo || ''}
                  onBlur={(e) => handleConfigChange('yearTo', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAbstracts"
                  defaultChecked={selectedNode.config.includeAbstracts || false}
                  onCheckedChange={(checked) => handleConfigChange('includeAbstracts', checked)}
                />
                <label
                  htmlFor="includeAbstracts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include Abstracts
                </label>
              </div>
            </>
          )}

          {selectedNode.type === 'news-discovery' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="newsKeywords">Keywords</Label>
                <Input
                  type="text"
                  id="newsKeywords"
                  placeholder="Enter keywords for news discovery"
                  defaultValue={selectedNode.config.keywords || ''}
                  onBlur={(e) => handleConfigChange('keywords', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newsSource">Source</Label>
                <Input
                  type="text"
                  id="newsSource"
                  placeholder="Enter source (e.g., 'google-news', 'bing-news', 'all')"
                  defaultValue={selectedNode.config.source || 'all'}
                  onBlur={(e) => handleConfigChange('source', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newsTimeRange">Time Range</Label>
                <Input
                  type="text"
                  id="newsTimeRange"
                  placeholder="Enter time range (e.g., '1d', '7d', '30d')"
                  defaultValue={selectedNode.config.timeRange || '7d'}
                  onBlur={(e) => handleConfigChange('timeRange', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newsMaxResults">Max Results</Label>
                <Input
                  type="number"
                  id="newsMaxResults"
                  placeholder="Enter max results"
                  defaultValue={selectedNode.config.maxResults || 10}
                  onBlur={(e) => handleConfigChange('maxResults', parseInt(e.target.value))}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'perplexity-research' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="researchQuery">Research Query</Label>
                <Input
                  type="text"
                  id="researchQuery"
                  placeholder="Enter research query"
                  defaultValue={selectedNode.config.query || ''}
                  onBlur={(e) => handleConfigChange('query', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="researchDepth">Research Depth</Label>
                <Select defaultValue={selectedNode.config.depth || 'medium'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" onSelect={() => handleConfigChange('depth', 'light')}>Light</SelectItem>
                    <SelectItem value="medium" onSelect={() => handleConfigChange('depth', 'medium')}>Medium</SelectItem>
                    <SelectItem value="deep" onSelect={() => handleConfigChange('depth', 'deep')}>Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSources"
                  defaultChecked={selectedNode.config.includeSources || false}
                  onCheckedChange={(checked) => handleConfigChange('includeSources', checked)}
                />
                <label
                  htmlFor="includeSources"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include Sources
                </label>
              </div>
            </>
          )}

          {selectedNode.type === 'ai-processor' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Input
                  type="text"
                  id="contentType"
                  placeholder="Enter content type (e.g., article, blog post)"
                  defaultValue={selectedNode.config.contentType || 'article'}
                  onBlur={(e) => handleConfigChange('contentType', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="writingStyle">Writing Style</Label>
                <Input
                  type="text"
                  id="writingStyle"
                  placeholder="Enter writing style (e.g., professional, casual)"
                  defaultValue={selectedNode.config.writingStyle || 'Professional'}
                  onBlur={(e) => handleConfigChange('writingStyle', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  type="text"
                  id="targetAudience"
                  placeholder="Enter target audience (e.g., general readers, experts)"
                  defaultValue={selectedNode.config.targetAudience || 'General readers'}
                  onBlur={(e) => handleConfigChange('targetAudience', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  type="text"
                  id="category"
                  placeholder="Enter category (e.g., technology, health)"
                  defaultValue={selectedNode.config.category || 'General'}
                  onBlur={(e) => handleConfigChange('category', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Input
                  type="text"
                  id="aiModel"
                  placeholder="Enter AI model (e.g., gemini-2.5-flash-preview-05-20, gpt-4)"
                  defaultValue={selectedNode.config.aiModel || 'gemini-2.5-flash-preview-05-20'}
                  onBlur={(e) => handleConfigChange('aiModel', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  placeholder="Enter custom instructions for AI"
                  defaultValue={selectedNode.config.customInstructions || ''}
                  onBlur={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'multi-source-synthesizer' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  type="text"
                  id="style"
                  placeholder="Enter synthesis style (e.g., comprehensive, concise)"
                  defaultValue={selectedNode.config.style || 'comprehensive'}
                  onBlur={(e) => handleConfigChange('style', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetLength">Target Length</Label>
                <Input
                  type="text"
                  id="targetLength"
                  placeholder="Enter target length (e.g., short, medium, long)"
                  defaultValue={selectedNode.config.targetLength || 'medium'}
                  onBlur={(e) => handleConfigChange('targetLength', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintainAttribution"
                  defaultChecked={selectedNode.config.maintainAttribution !== false}
                  onCheckedChange={(checked) => handleConfigChange('maintainAttribution', checked)}
                />
                <label
                  htmlFor="maintainAttribution"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Maintain Attribution
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resolveConflicts"
                  defaultChecked={selectedNode.config.resolveConflicts !== false}
                  onCheckedChange={(checked) => handleConfigChange('resolveConflicts', checked)}
                />
                <label
                  htmlFor="resolveConflicts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Resolve Conflicts
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aiModelSynth">AI Model</Label>
                <Input
                  type="text"
                  id="aiModelSynth"
                  placeholder="Enter AI model (e.g., gemini-2.5-flash-preview-05-20, gpt-4)"
                  defaultValue={selectedNode.config.aiModel || 'gemini-2.5-flash-preview-05-20'}
                  onBlur={(e) => handleConfigChange('aiModel', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customInstructionsSynth">Custom Instructions</Label>
                <Textarea
                  id="customInstructionsSynth"
                  placeholder="Enter custom instructions for AI"
                  defaultValue={selectedNode.config.customInstructions || ''}
                  onBlur={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'filter' && (
            <p>This node filters content based on criteria.</p>
          )}

          {selectedNode.type === 'publisher' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  type="text"
                  id="category"
                  placeholder="Enter category for publishing"
                  defaultValue={selectedNode.config.category || 'AI Generated'}
                  onBlur={(e) => handleConfigChange('category', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={selectedNode.config.status || 'draft'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" onSelect={() => handleConfigChange('status', 'draft')}>Draft</SelectItem>
                    <SelectItem value="pending" onSelect={() => handleConfigChange('status', 'pending')}>Pending</SelectItem>
                    <SelectItem value="published" onSelect={() => handleConfigChange('status', 'published')}>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedNode.type === 'social-poster' && (
            <p>This node posts content to social media.</p>
          )}

          {selectedNode.type === 'email-sender' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  type="email"
                  id="recipient"
                  placeholder="Enter recipient email address"
                  defaultValue={selectedNode.config.recipient || ''}
                  onBlur={(e) => handleConfigChange('recipient', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  type="text"
                  id="subject"
                  placeholder="Enter email subject"
                  defaultValue={selectedNode.config.subject || ''}
                  onBlur={(e) => handleConfigChange('subject', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  placeholder="Enter email body"
                  defaultValue={selectedNode.config.body || ''}
                  onBlur={(e) => handleConfigChange('body', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'image-generator' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="imagePrompt">Image Prompt</Label>
                <Input
                  type="text"
                  id="imagePrompt"
                  placeholder="Enter image prompt"
                  defaultValue={selectedNode.config.imagePrompt || ''}
                  onBlur={(e) => handleConfigChange('imagePrompt', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  placeholder="Enter custom instructions for image generation"
                  defaultValue={selectedNode.config.customInstructions || ''}
                  onBlur={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Select defaultValue={selectedNode.config.aiModel || 'dall-e-3'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dall-e-3" onSelect={() => handleConfigChange('aiModel', 'dall-e-3')}>DALL-E 3</SelectItem>
                    <SelectItem value="gemini-pro-vision" onSelect={() => handleConfigChange('aiModel', 'gemini-pro-vision')}>Gemini Pro Vision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageStyle">Image Style</Label>
                <Select defaultValue={selectedNode.config.imageStyle || 'natural'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Image Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural" onSelect={() => handleConfigChange('imageStyle', 'natural')}>Natural</SelectItem>
                    <SelectItem value="vivid" onSelect={() => handleConfigChange('imageStyle', 'vivid')}>Vivid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageSize">Image Size</Label>
                <Select defaultValue={selectedNode.config.imageSize || '1024x1024'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Image Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024" onSelect={() => handleConfigChange('imageSize', '1024x1024')}>1024x1024</SelectItem>
                    <SelectItem value="1792x1024" onSelect={() => handleConfigChange('imageSize', '1792x1024')}>1792x1024</SelectItem>
                    <SelectItem value="1024x1792" onSelect={() => handleConfigChange('imageSize', '1024x1792')}>1024x1792</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageQuality">Image Quality</Label>
                <Select defaultValue={selectedNode.config.imageQuality || 'standard'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Image Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard" onSelect={() => handleConfigChange('imageQuality', 'standard')}>Standard</SelectItem>
                    <SelectItem value="hd" onSelect={() => handleConfigChange('imageQuality', 'hd')}>HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedNode.type === 'seo-analyzer' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="targetKeywords">Target Keywords</Label>
                <Input
                  type="text"
                  id="targetKeywords"
                  placeholder="Enter target keywords for SEO analysis"
                  defaultValue={selectedNode.config.targetKeywords || ''}
                  onBlur={(e) => handleConfigChange('targetKeywords', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysisFocus">Analysis Focus</Label>
                <Input
                  type="text"
                  id="analysisFocus"
                  placeholder="Enter focus areas for SEO analysis"
                  defaultValue={selectedNode.config.analysisFocus || ''}
                  onBlur={(e) => handleConfigChange('analysisFocus', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aiModelSEO">AI Model</Label>
                <Input
                  type="text"
                  id="aiModelSEO"
                  placeholder="Enter AI model (e.g., gemini-2.5-flash-preview-05-20, gpt-4)"
                  defaultValue={selectedNode.config.aiModel || 'gemini-2.5-flash-preview-05-20'}
                  onBlur={(e) => handleConfigChange('aiModel', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customInstructionsSEO">Custom Instructions</Label>
                <Textarea
                  id="customInstructionsSEO"
                  placeholder="Enter custom instructions for AI"
                  defaultValue={selectedNode.config.customInstructions || ''}
                  onBlur={(e) => handleConfigChange('customInstructions', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'translator' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="targetLanguage">Target Language</Label>
                <Input
                  type="text"
                  id="targetLanguage"
                  placeholder="Enter target language code (e.g., es, fr)"
                  defaultValue={selectedNode.config.targetLanguage || 'es'}
                  onBlur={(e) => handleConfigChange('targetLanguage', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider">Translation Provider</Label>
                <Input
                  type="text"
                  id="provider"
                  placeholder="Enter translation provider (e.g., google, deepl)"
                  defaultValue={selectedNode.config.provider || 'google'}
                  onBlur={(e) => handleConfigChange('provider', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedNode.type === 'content-quality-analyzer' && (
            <p>This node analyzes the quality of the content.</p>
          )}

          {selectedNode.type === 'ai-seo-optimizer' && (
            <p>This node optimizes content for SEO using AI.</p>
          )}

          {selectedNode.type === 'engagement-forecaster' && (
            <p>This node forecasts content engagement.</p>
          )}

          {selectedNode.type === 'content-performance-analyzer' && (
            <p>This node analyzes content performance.</p>
          )}

          {selectedNode.type === 'article-structure-validator' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="minSections">Minimum Sections</Label>
                <Input
                  type="number"
                  id="minSections"
                  placeholder="Enter minimum number of sections"
                  defaultValue={selectedNode.config.minSections || 3}
                  onBlur={(e) => handleConfigChange('minSections', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minParagraphsPerSection">Minimum Paragraphs per Section</Label>
                <Input
                  type="number"
                  id="minParagraphsPerSection"
                  placeholder="Enter minimum paragraphs per section"
                  defaultValue={selectedNode.config.minParagraphsPerSection || 2}
                  onBlur={(e) => handleConfigChange('minParagraphsPerSection', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minWordsPerParagraph">Minimum Words per Paragraph</Label>
                <Input
                  type="number"
                  id="minWordsPerParagraph"
                  placeholder="Enter minimum words per paragraph"
                  defaultValue={selectedNode.config.minWordsPerParagraph || 50}
                  onBlur={(e) => handleConfigChange('minWordsPerParagraph', parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keywordDensityThreshold">Keyword Density Threshold</Label>
                <Input
                  type="number"
                  id="keywordDensityThreshold"
                  placeholder="Enter keyword density threshold (e.g., 0.02 for 2%)"
                  defaultValue={selectedNode.config.keywordDensityThreshold || 0.02}
                  onBlur={(e) => handleConfigChange('keywordDensityThreshold', parseFloat(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetKeywords">Target Keywords (comma-separated)</Label>
                <Input
                  type="text"
                  id="targetKeywords"
                  placeholder="Enter target keywords (comma-separated)"
                  defaultValue={selectedNode.config.targetKeywords || ''}
                  onBlur={(e) => handleConfigChange('targetKeywords', e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowSidebar;
