import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import { Play, Save, Download, Upload } from 'lucide-react';

export type WorkflowNode = {
  id: string;
  type: 'trigger' | 'scraper' | 'rss-aggregator' | 'google-scholar-search' | 'news-discovery' | 'perplexity-research' | 'ai-processor' | 'multi-source-synthesizer' | 'filter' | 'publisher' | 'social-poster' | 'email-sender' | 'image-generator' | 'seo-analyzer' | 'translator' | 'content-quality-analyzer' | 'ai-seo-optimizer' | 'engagement-forecaster' | 'content-performance-analyzer';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connected: string[];
};

const WorkflowBuilderPage = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  const generateNodeLabel = (type: WorkflowNode['type']) => {
    const labels = {
      trigger: 'Trigger',
      scraper: 'Web Scraper',
      'rss-aggregator': 'RSS Aggregator',
      'google-scholar-search': 'Google Scholar Search',
      'news-discovery': 'News Discovery',
      'perplexity-research': 'Perplexity Research',
      'ai-processor': 'AI Processor',
      'multi-source-synthesizer': 'Multi-Source Synthesizer',
      filter: 'Filter',
      publisher: 'Publisher',
      'social-poster': 'Social Poster',
      'email-sender': 'Email Sender',
      'image-generator': 'Image Generator',
      'seo-analyzer': 'SEO Analyzer',
      translator: 'Translator',
      'content-quality-analyzer': 'Content Quality Analyzer',
      'ai-seo-optimizer': 'AI SEO Optimizer',
      'engagement-forecaster': 'Engagement Forecaster',
      'content-performance-analyzer': 'Content Performance Analyzer',
    };
    return labels[type];
  };

  const addNode = useCallback((type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: generateNodeLabel(type),
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      config: {},
      connected: [],
    };
    setNodes(prev => [...prev, newNode]);
    toast.success(`Added ${generateNodeLabel(type)} node`);
  }, []);

  const updateNodeConfig = useCallback((nodeId: string, newConfig: Partial<WorkflowNode['config']>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, config: { ...node.config, ...newConfig } }
        : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    // Also remove connections to this node
    setNodes(prev => prev.map(node => ({
      ...node,
      connected: node.connected.filter(id => id !== nodeId)
    })));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    toast.success('Node deleted');
  }, [selectedNode]);

  const handleConnectStart = useCallback((nodeId: string) => {
    setConnectingNodeId(nodeId);
    toast.info('Click on another node to connect');
  }, []);

  const handleConnectEnd = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      toast.error('Cannot connect a node to itself');
      setConnectingNodeId(null);
      return;
    }

    setNodes(prev => prev.map(node => 
      node.id === sourceId 
        ? { ...node, connected: [...new Set([...node.connected, targetId])] }
        : node
    ));
    setConnectingNodeId(null);
    toast.success('Nodes connected');
  }, []);

  const handleDisconnectNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, connected: [] }
        : node
    ));
    toast.success('All connections removed');
  }, []);

  const runWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some nodes to run the workflow');
      return;
    }

    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      toast.error('Add a trigger node to start the workflow');
      return;
    }

    toast.success('Workflow started! (This is a preview - full execution coming soon)');
  }, [nodes]);

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      createdAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Workflow exported');
  }, [nodes]);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <p className="text-muted-foreground">Build automated content research and publishing workflows</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveWorkflow} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={runWorkflow} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Run Workflow
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <WorkflowSidebar
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateNodeConfig={updateNodeConfig}
        />
        
        <div className="flex-1">
          <WorkflowCanvas
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onUpdateNodes={setNodes}
            onDeleteNode={deleteNode}
            connectingNodeId={connectingNodeId}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            onDisconnectNode={handleDisconnectNode}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
