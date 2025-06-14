
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Play, Settings, Plus, ArrowRight } from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'scraper' | 'ai-processor' | 'filter' | 'publisher';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connected: string[];
}

const WorkflowBuilderPage = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: '1',
      type: 'trigger',
      label: 'Schedule Trigger',
      position: { x: 100, y: 100 },
      config: { schedule: 'daily', time: '09:00' },
      connected: ['2']
    },
    {
      id: '2',
      type: 'scraper',
      label: 'Web Scraper',
      position: { x: 350, y: 100 },
      config: { urls: [], selector: 'article' },
      connected: ['3']
    },
    {
      id: '3',
      type: 'ai-processor',
      label: 'AI Content Generator',
      position: { x: 600, y: 100 },
      config: { provider: 'openai', model: 'gpt-4o-mini', prompt: 'Transform this content into a professional article' },
      connected: ['4']
    },
    {
      id: '4',
      type: 'publisher',
      label: 'Auto Publisher',
      position: { x: 850, y: 100 },
      config: { status: 'draft', category: 'AI Generated', autoPublishConditional: false },
      connected: []
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      label: getNodeLabel(type),
      position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 },
      config: getDefaultConfig(type),
      connected: []
    };
    setNodes([...nodes, newNode]);
  };

  const getNodeLabel = (type: WorkflowNode['type']): string => {
    const labels = {
      trigger: 'New Trigger',
      scraper: 'Web Scraper',
      'ai-processor': 'AI Processor',
      filter: 'Content Filter',
      publisher: 'Publisher'
    };
    return labels[type];
  };

  const getDefaultConfig = (type: WorkflowNode['type']): Record<string, any> => {
    const configs = {
      trigger: { schedule: 'manual', time: '09:00' },
      scraper: { urls: [], selector: '', followPagination: false },
      'ai-processor': { provider: 'openai', model: 'gpt-4o-mini', contentType: 'article', prompt: '' },
      filter: { minWords: 100, maxWords: 2000 },
      publisher: { status: 'draft', category: 'AI Generated', autoPublishConditional: false }
    };
    return configs[type];
  };

  const updateNodeConfig = (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, config: { ...node.config, ...newConfig } }
          : node
      )
    );
    // Also update selectedNode if it's the one being edited
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, ...newConfig } } : null);
    }
  };

  const runWorkflow = async () => {
    setIsRunning(true);
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false);
      console.log('Workflow completed');
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex">
        {/* Sidebar */}
        <WorkflowSidebar 
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateNodeConfig={updateNodeConfig}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Workflow className="h-6 w-6" />
                  Visual Workflow Builder
                </h1>
                <p className="text-sm text-muted-foreground">
                  Drag and drop to create automated content workflows
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {nodes.length} Nodes
                </Badge>
                <Button
                  onClick={runWorkflow}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunning ? 'Running...' : 'Test Workflow'}
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas 
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onUpdateNodes={setNodes}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowBuilderPage;
