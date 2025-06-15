
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Settings, Target, Clock } from 'lucide-react';
import { createAIAgent, updateAIAgent, AIAgent } from '@/services/aiAgents';
import { toast } from '@/components/ui/use-toast';

interface AgentManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent | null;
  mode: 'create' | 'edit';
}

const AGENT_TYPES = [
  { value: 'trending', label: 'Trending Content Agent', description: 'Identifies trending articles and content opportunities' },
  { value: 'content_gap', label: 'Content Gap Agent', description: 'Finds content gaps and suggests new topics' },
  { value: 'summarization', label: 'Summarization Agent', description: 'Creates summaries and extracts key insights' },
  { value: 'enhanced_trending', label: 'Enhanced Trending Agent', description: 'Advanced trending analysis with ML predictions' }
];

const AgentManagementDialog = ({ isOpen, onClose, agent, mode }: AgentManagementDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    type: agent?.type || '',
    description: agent?.description || '',
    is_active: agent?.is_active !== undefined ? agent.is_active : true,
    config: agent?.config || {}
  });

  const [configJson, setConfigJson] = useState(JSON.stringify(agent?.config || {}, null, 2));

  const createMutation = useMutation({
    mutationFn: createAIAgent,
    onSuccess: () => {
      toast({ title: "Agent Created", description: "The AI agent has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      onClose();
    },
    onError: (error) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AIAgent> }) => updateAIAgent(id, data),
    onSuccess: () => {
      toast({ title: "Agent Updated", description: "The AI agent has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      onClose();
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const parsedConfig = JSON.parse(configJson);
      const agentData = {
        ...formData,
        config: parsedConfig
      };

      if (mode === 'create') {
        createMutation.mutate(agentData);
      } else if (agent) {
        updateMutation.mutate({ id: agent.id, data: agentData });
      }
    } catch (error) {
      toast({ 
        title: "Invalid Configuration", 
        description: "Please check your JSON configuration format.",
        variant: "destructive"
      });
    }
  };

  const selectedAgentType = AGENT_TYPES.find(type => type.value === formData.type);

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'trending':
        return {
          min_views_threshold: 100,
          trending_window_hours: 24,
          confidence_threshold: 0.7
        };
      case 'content_gap':
        return {
          analysis_depth: 'medium',
          topic_similarity_threshold: 0.6,
          min_gap_size: 5
        };
      case 'summarization':
        return {
          max_summary_length: 200,
          key_points_count: 5,
          include_sentiment: true
        };
      case 'enhanced_trending':
        return {
          prediction_window_hours: 48,
          ml_confidence_threshold: 0.8,
          feature_weights: {
            views: 0.4,
            engagement: 0.3,
            recency: 0.3
          }
        };
      default:
        return {};
    }
  };

  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({ ...prev, type: newType }));
    const defaultConfig = getDefaultConfig(newType);
    setConfigJson(JSON.stringify(defaultConfig, null, 2));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {mode === 'create' ? 'Create New AI Agent' : 'Edit AI Agent'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Configure a new AI agent to analyze your content and generate suggestions.'
              : 'Modify the configuration and settings of your AI agent.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Content Trending Analyzer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedAgentType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedAgentType.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedAgentType.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this agent does and its purpose..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Agent is active</Label>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config">Agent Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  placeholder="Enter JSON configuration..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Configure the agent's behavior and parameters using JSON format.
                </p>
              </div>

              {formData.type && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configuration Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Common settings for {selectedAgentType?.label}:</p>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(getDefaultConfig(formData.type), null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      {formData.name || 'Unnamed Agent'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={formData.is_active ? "default" : "secondary"}>
                        {formData.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{selectedAgentType?.label || formData.type}</Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {formData.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Configuration Summary
                      </h4>
                      <div className="bg-muted p-3 rounded text-xs">
                        <pre>{configJson}</pre>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {mode === 'create' ? 'Will be created' : 'Last updated'}: {new Date().toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Agent' : 'Update Agent')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentManagementDialog;
