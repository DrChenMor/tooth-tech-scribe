
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Brain, MoreVertical, Edit, Trash2, Play, Pause, Settings, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { AIAgent, updateAIAgent, deleteAIAgent, runAgent } from '@/services/aiAgents';
import { toast } from '@/components/ui/use-toast';

interface AgentManagementCardProps {
  agent: AIAgent;
  onEdit: (agent: AIAgent) => void;
  isRunning?: boolean;
}

const AgentManagementCard = ({ agent, onEdit, isRunning = false }: AgentManagementCardProps) => {
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AIAgent> }) => updateAIAgent(id, data),
    onSuccess: () => {
      toast({ title: "Agent Updated", description: "Agent status has been updated." });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsToggling(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAIAgent,
    onSuccess: () => {
      toast({ title: "Agent Deleted", description: "The AI agent has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    },
    onError: (error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  });

  const runMutation = useMutation({
    mutationFn: () => runAgent(agent.name, { articles: [] }),
    onSuccess: () => {
      toast({ title: "Agent Executed", description: `${agent.name} has been run successfully.` });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
    },
    onError: (error) => {
      toast({ title: "Execution Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleToggleActive = async (checked: boolean) => {
    setIsToggling(true);
    updateMutation.mutate({ id: agent.id, data: { is_active: checked } });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(agent.id);
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'trending': return 'bg-blue-100 text-blue-800';
      case 'content_gap': return 'bg-green-100 text-green-800';
      case 'summarization': return 'bg-purple-100 text-purple-800';
      case 'enhanced_trending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case 'trending': return 'Trending';
      case 'content_gap': return 'Content Gap';
      case 'summarization': return 'Summarization';
      case 'enhanced_trending': return 'Enhanced Trending';
      default: return type;
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${agent.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Brain className={`h-4 w-4 ${agent.is_active ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {agent.name}
                {isRunning && (
                  <Badge variant="default" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Running
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {agent.description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={agent.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isToggling || updateMutation.isPending}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(agent)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => runMutation.mutate()}
                  disabled={!agent.is_active || runMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {runMutation.isPending ? 'Running...' : 'Run Now'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={agent.is_active ? "default" : "secondary"}>
              {agent.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className={getAgentTypeColor(agent.type)}>
              {getAgentTypeLabel(agent.type)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(agent.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{format(new Date(agent.updated_at), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {Object.keys(agent.config).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Configuration
              </p>
              <div className="bg-muted p-2 rounded text-xs">
                <pre className="overflow-hidden">
                  {JSON.stringify(agent.config, null, 2).substring(0, 150)}
                  {JSON.stringify(agent.config, null, 2).length > 150 && '...'}
                </pre>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(agent)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runMutation.mutate()}
              disabled={!agent.is_active || runMutation.isPending}
            >
              <Play className="h-3 w-3 mr-1" />
              {runMutation.isPending ? 'Running...' : 'Test Run'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentManagementCard;
