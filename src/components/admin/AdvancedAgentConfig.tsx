
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Target, 
  Brain, 
  Settings, 
  Zap, 
  Filter,
  Calendar,
  Users
} from 'lucide-react';

interface AdvancedConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const AdvancedAgentConfig: React.FC<AdvancedConfigProps> = ({ config, onChange }) => {
  const [activeSection, setActiveSection] = useState('behavior');

  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updateNestedConfig = (section: string, key: string, value: any) => {
    const sectionConfig = config[section] || {};
    onChange({ 
      ...config, 
      [section]: { ...sectionConfig, [key]: value }
    });
  };

  const sections = [
    { id: 'behavior', label: 'Behavior', icon: Brain },
    { id: 'scheduling', label: 'Scheduling', icon: Clock },
    { id: 'triggers', label: 'Triggers', icon: Zap },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'filtering', label: 'Filtering', icon: Filter }
  ];

  return (
    <div className="space-y-4">
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {activeSection === 'behavior' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Agent Behavior Configuration
            </CardTitle>
            <CardDescription>
              Control how the agent makes decisions and generates suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Confidence Threshold</Label>
              <div className="px-3">
                <Slider
                  value={[config.confidence_threshold || 0.7]}
                  onValueChange={([value]) => updateConfig('confidence_threshold', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only suggestions above {((config.confidence_threshold || 0.7) * 100).toFixed(0)}% confidence will be shown
              </p>
            </div>

            <div className="space-y-2">
              <Label>Priority Weight</Label>
              <Select 
                value={config.priority_weight || 'balanced'} 
                onValueChange={(value) => updateConfig('priority_weight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (High confidence only)</SelectItem>
                  <SelectItem value="balanced">Balanced (Default)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (More suggestions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Suggestions Per Run</Label>
              <Input
                type="number"
                value={config.max_suggestions || 5}
                onChange={(e) => updateConfig('max_suggestions', parseInt(e.target.value))}
                min={1}
                max={20}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.learning_enabled || false}
                onCheckedChange={(checked) => updateConfig('learning_enabled', checked)}
              />
              <Label>Enable Learning from Feedback</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'scheduling' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduling Configuration
            </CardTitle>
            <CardDescription>
              Configure when and how often the agent runs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.auto_run_enabled || false}
                onCheckedChange={(checked) => updateConfig('auto_run_enabled', checked)}
              />
              <Label>Enable Automatic Runs</Label>
            </div>

            {config.auto_run_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Run Frequency</Label>
                  <Select 
                    value={config.run_frequency || 'daily'} 
                    onValueChange={(value) => updateConfig('run_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="every_4_hours">Every 4 Hours</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Run Time</Label>
                  <Input
                    type="time"
                    value={config.preferred_run_time || '09:00'}
                    onChange={(e) => updateConfig('preferred_run_time', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Analysis Window (hours)</Label>
              <Input
                type="number"
                value={config.analysis_window_hours || 24}
                onChange={(e) => updateConfig('analysis_window_hours', parseInt(e.target.value))}
                min={1}
                max={168}
              />
              <p className="text-xs text-muted-foreground">
                How far back to look for content to analyze
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'triggers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Trigger Configuration
            </CardTitle>
            <CardDescription>
              Set up conditions that automatically trigger agent runs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.trigger_on_new_content || false}
                onCheckedChange={(checked) => updateConfig('trigger_on_new_content', checked)}
              />
              <Label>Run when new content is published</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.trigger_on_view_threshold || false}
                onCheckedChange={(checked) => updateConfig('trigger_on_view_threshold', checked)}
              />
              <Label>Run when content reaches view threshold</Label>
            </div>

            {config.trigger_on_view_threshold && (
              <div className="space-y-2 ml-6">
                <Label>View Threshold</Label>
                <Input
                  type="number"
                  value={config.view_threshold || 100}
                  onChange={(e) => updateConfig('view_threshold', parseInt(e.target.value))}
                  min={1}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Custom Trigger Conditions</Label>
              <Textarea
                value={config.custom_triggers || ''}
                onChange={(e) => updateConfig('custom_triggers', e.target.value)}
                placeholder="e.g., Run when article category is 'trending' and views > 50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'collaboration' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaboration Settings
            </CardTitle>
            <CardDescription>
              Configure how this agent works with other agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.collaboration_enabled || false}
                onCheckedChange={(checked) => updateConfig('collaboration_enabled', checked)}
              />
              <Label>Enable Agent Collaboration</Label>
            </div>

            {config.collaboration_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Collaboration Mode</Label>
                  <Select 
                    value={config.collaboration_mode || 'sequential'} 
                    onValueChange={(value) => updateConfig('collaboration_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential (one after another)</SelectItem>
                      <SelectItem value="parallel">Parallel (run together)</SelectItem>
                      <SelectItem value="consensus">Consensus (combine results)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Collaboration Partners</Label>
                  <Input
                    value={config.collaboration_partners || ''}
                    onChange={(e) => updateConfig('collaboration_partners', e.target.value)}
                    placeholder="e.g., trending,quality,seo (comma-separated agent types)"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Cross-Agent Confidence Boost</Label>
              <div className="px-3">
                <Slider
                  value={[config.collaboration_boost || 0.1]}
                  onValueChange={([value]) => updateConfig('collaboration_boost', value)}
                  max={0.5}
                  min={0}
                  step={0.05}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Boost confidence by {((config.collaboration_boost || 0.1) * 100).toFixed(0)}% when other agents agree
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'filtering' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Content Filtering
            </CardTitle>
            <CardDescription>
              Define what content this agent should focus on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Input
                value={config.category_filter || ''}
                onChange={(e) => updateConfig('category_filter', e.target.value)}
                placeholder="e.g., technology,science (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Content Age (hours)</Label>
              <Input
                type="number"
                value={config.min_content_age || 0}
                onChange={(e) => updateConfig('min_content_age', parseInt(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Content Age (days)</Label>
              <Input
                type="number"
                value={config.max_content_age || 30}
                onChange={(e) => updateConfig('max_content_age', parseInt(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Content Length Filter</Label>
              <Select 
                value={config.content_length_filter || 'all'} 
                onValueChange={(value) => updateConfig('content_length_filter', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="short">Short Articles (&lt; 500 words)</SelectItem>
                  <SelectItem value="medium">Medium Articles (500-2000 words)</SelectItem>
                  <SelectItem value="long">Long Articles (&gt; 2000 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Filter Rules</Label>
              <Textarea
                value={config.custom_filters || ''}
                onChange={(e) => updateConfig('custom_filters', e.target.value)}
                placeholder="e.g., Only analyze articles with views > 10 OR created in last 24 hours"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Advanced Configuration Active
          </Badge>
          {config.auto_run_enabled && (
            <Badge variant="secondary">
              Auto-Run Enabled
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Export Config
        </Button>
      </div>
    </div>
  );
};

export default AdvancedAgentConfig;
