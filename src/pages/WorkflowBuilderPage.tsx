import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import { Play, Save, Download, Upload } from 'lucide-react';

export type WorkflowNode = {
  id: string;
  type: 
    | 'trigger' 
    | 'scraper' 
    | 'rss-aggregator' 
    | 'google-scholar-search' 
    | 'news-discovery' 
    | 'perplexity-research' 
    | 'ai-processor' 
    | 'multi-source-synthesizer' 
    | 'filter' 
    | 'publisher' 
    | 'social-poster' 
    | 'email-sender' 
    | 'image-generator' 
    | 'seo-analyzer' 
    | 'translator' 
    | 'content-quality-analyzer' 
    | 'ai-seo-optimizer' 
    | 'engagement-forecaster' 
    | 'content-performance-analyzer';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connected: string[];
};

const WorkflowBuilderPage = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  // Derive selectedNode from nodes array to ensure it's always current
  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) || null : null;

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
      position: { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 400 + 50 
      },
      config: {},
      connected: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id); // Auto-select new node for configuration
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
    setNodes(prev => {
      // Remove the node and all connections to it
      const filteredNodes = prev.filter(node => node.id !== nodeId);
      return filteredNodes.map(node => ({
        ...node,
        connected: node.connected.filter(id => id !== nodeId)
      }));
    });
    
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    
    if (connectingNodeId === nodeId) {
      setConnectingNodeId(null);
    }
    
    toast.success('Node deleted');
  }, [selectedNodeId, connectingNodeId]);

  const handleSelectNode = useCallback((node: WorkflowNode | null) => {
    setSelectedNodeId(node?.id || null);
  }, []);

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

    // Check if connection already exists
    const sourceNode = nodes.find(n => n.id === sourceId);
    if (sourceNode?.connected.includes(targetId)) {
      toast.error('Nodes are already connected');
      setConnectingNodeId(null);
      return;
    }

    setNodes(prev => prev.map(node => 
      node.id === sourceId 
        ? { ...node, connected: [...node.connected, targetId] }
        : node
    ));
    
    setConnectingNodeId(null);
    toast.success('Nodes connected');
  }, [nodes]);

  const handleDisconnectNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, connected: [] }
        : node
    ));
    toast.success('All connections removed');
  }, []);

  const validateWorkflow = useCallback(() => {
    const issues: string[] = [];

    if (nodes.length === 0) {
      issues.push('No nodes in workflow');
      return issues;
    }

    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      issues.push('No trigger node found - workflow needs a starting point');
    }

    const publisherNodes = nodes.filter(node => node.type === 'publisher');
    if (publisherNodes.length === 0) {
      issues.push('No publisher node found - workflow needs an output');
    }

    // Check for isolated nodes
    const connectedNodeIds = new Set<string>();
    nodes.forEach(node => {
      node.connected.forEach(id => connectedNodeIds.add(id));
      if (node.connected.length > 0) {
        connectedNodeIds.add(node.id);
      }
    });

    const isolatedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && node.type !== 'trigger'
    );
    
    if (isolatedNodes.length > 0) {
      issues.push(`${isolatedNodes.length} isolated node(s) found`);
    }

    return issues;
  }, [nodes]);

  const runWorkflow = useCallback(() => {
    const issues = validateWorkflow();
    
    if (issues.length > 0) {
      toast.error(`Cannot run workflow: ${issues[0]}`);
      return;
    }

    // TODO: Implement actual workflow execution
    toast.success('Workflow validation passed! (Execution coming soon)');
  }, [validateWorkflow]);

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      createdAt: new Date().toISOString(),
      version: '1.0',
      metadata: {
        nodeCount: nodes.length,
        connectionCount: nodes.reduce((sum, node) => sum + node.connected.length, 0),
      }
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Workflow exported successfully');
  }, [nodes]);

  const loadWorkflow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workflowData = JSON.parse(e.target?.result as string);
          if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
            setNodes(workflowData.nodes);
            setSelectedNodeId(null);
            setConnectingNodeId(null);
            toast.success('Workflow loaded successfully');
          } else {
            toast.error('Invalid workflow file format');
          }
        } catch (error) {
          toast.error('Failed to load workflow file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const getWorkflowStats = () => {
    const connectionCount = nodes.reduce((sum, node) => sum + node.connected.length, 0);
    const nodeTypes = new Set(nodes.map(node => node.type));
    
    return {
      nodeCount: nodes.length,
      connectionCount,
      uniqueNodeTypes: nodeTypes.size,
      isValid: validateWorkflow().length === 0
    };
  };

  const stats = getWorkflowStats();

  return (
    <div className="fixed inset-0 flex flex-col lg:ml-20">
      {/* Header */}
      <div className="border-b bg-background p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <p className="text-muted-foreground">
              Build automated content research and publishing workflows
            </p>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              <span>{stats.nodeCount} nodes</span>
              <span>{stats.connectionCount} connections</span>
              <span>{stats.uniqueNodeTypes} node types</span>
              <span className={stats.isValid ? 'text-green-600' : 'text-red-600'}>
                {stats.isValid ? '✓ Valid' : '⚠ Issues'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadWorkflow} 
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button 
              variant="outline" 
              onClick={saveWorkflow} 
              className="flex items-center gap-2"
              disabled={nodes.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={runWorkflow} 
              className="flex items-center gap-2"
              disabled={nodes.length === 0}
            >
              <Play className="h-4 w-4" />
              Run Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <WorkflowSidebar
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateNodeConfig={updateNodeConfig}
        />
        
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
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
