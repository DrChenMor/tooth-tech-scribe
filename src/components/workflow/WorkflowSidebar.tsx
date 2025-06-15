
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Clock, Globe, Brain, Filter, Send, Plus, Share2 } from 'lucide-react';
import { WorkflowNode } from '@/pages/WorkflowBuilderPage';

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
  const getNodeIcon = (type: WorkflowNode['type']) => {
    const icons = {
      trigger: Clock,
      scraper: Globe,
      'ai-processor': Brain,
      filter: Filter,
      publisher: Send,
      'social-poster': Share2,
    };
    return icons[type];
  };

  const Icon = getNodeIcon(node.type);

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, { [key]: value });
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
    </div>
  );
};

export default WorkflowSidebar;
