
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Brain } from 'lucide-react';
import { getAIAgents, AIAgent } from '@/services/aiAgents';
import AgentManagementCard from '@/components/admin/AgentManagementCard';
import AgentManagementDialog from '@/components/admin/AgentManagementDialog';
import { Skeleton } from '@/components/ui/skeleton';

const AIAgentManagementPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: getAIAgents,
  });

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingAgent(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Agent Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, configure, and manage your AI agents for automated content analysis and optimization.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentManagementCard
              key={agent.id}
              agent={agent}
              onEdit={handleEditAgent}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No AI Agents Found</CardTitle>
            <CardDescription className="text-center mb-6">
              Get started by creating your first AI agent to automate content analysis and optimization.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}

      <AgentManagementDialog
        isOpen={isCreateDialogOpen || !!editingAgent}
        onClose={handleCloseDialog}
        agent={editingAgent}
        mode={editingAgent ? 'edit' : 'create'}
      />
    </div>
  );
};

export default AIAgentManagementPage;
