import { useState, useRef } from 'react';
import { WorkflowNode } from '@/types/WorkflowTypes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Globe, Brain, Filter, Send, ArrowRight, Trash2, 
  Link as LinkIcon, XCircle, Share2, Mail, ImagePlay, 
  SearchCheck, Languages, Rss, Award, TrendingUp, HeartPulse, 
  GraduationCap, Newspaper, Search, Combine, BarChart3 
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  selectedNode: WorkflowNode | null;
  onSelectNode: (node: WorkflowNode | null) => void;
  onUpdateNodes: (nodes: WorkflowNode[]) => void;
  onDeleteNode: (nodeId: string) => void;
  connectingNodeId: string | null;
  onConnectStart: (nodeId: string) => void;
  onConnectEnd: (sourceId: string, targetId: string) => void;
  onDisconnectNode: (nodeId: string) => void;
}

const WorkflowCanvas = ({
  nodes,
  selectedNode,
  onSelectNode,
  onUpdateNodes,
  onDeleteNode,
  connectingNodeId,
  onConnectStart,
  onConnectEnd,
  onDisconnectNode,
}: WorkflowCanvasProps) => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = (type: WorkflowNode['type']) => {
    const icons = {
      trigger: Clock,
      scraper: Globe,
      'rss-aggregator': Rss,
      'google-scholar-search': GraduationCap,
      'news-discovery': Newspaper,
      'perplexity-research': Search,
      'ai-processor': Brain,
      'multi-source-synthesizer': Combine,
      filter: Filter,
      publisher: Send,
      'social-poster': Share2,
      'email-sender': Mail,
      'image-generator': ImagePlay,
      'seo-analyzer': SearchCheck,
      translator: Languages,
      'content-quality-analyzer': Award,
      'ai-seo-optimizer': TrendingUp,
      'engagement-forecaster': HeartPulse,
      'content-performance-analyzer': BarChart3,
      'article-structure-validator': Award,
    };
    return icons[type] || Clock;
  };

  const getNodeColor = (type: WorkflowNode['type']) => {
    const colors = {
      trigger: 'border-blue-200 bg-blue-50',
      scraper: 'border-green-200 bg-green-50',
      'rss-aggregator': 'border-gray-200 bg-gray-50',
      'google-scholar-search': 'border-amber-200 bg-amber-50',
      'news-discovery': 'border-orange-200 bg-orange-50',
      'perplexity-research': 'border-violet-200 bg-violet-50',
      'ai-processor': 'border-purple-200 bg-purple-50',
      'multi-source-synthesizer': 'border-emerald-200 bg-emerald-50',
      filter: 'border-yellow-200 bg-yellow-50',
      publisher: 'border-red-200 bg-red-50',
      'social-poster': 'border-sky-200 bg-sky-50',
      'email-sender': 'border-orange-200 bg-orange-50',
      'image-generator': 'border-indigo-200 bg-indigo-50',
      'seo-analyzer': 'border-pink-200 bg-pink-50',
      translator: 'border-teal-200 bg-teal-50',
      'content-quality-analyzer': 'border-cyan-200 bg-cyan-50',
      'ai-seo-optimizer': 'border-lime-200 bg-lime-50',
      'engagement-forecaster': 'border-rose-200 bg-rose-50',
      'content-performance-analyzer': 'border-slate-200 bg-slate-50',
      'article-structure-validator': 'border-indigo-300 bg-indigo-100',
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };

  // Only allow dragging from the header area (icon + title)
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // Check if the click is on the drag handle area
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest('.drag-handle');
    
    if (!isDragHandle) {
      return; // Don't start drag if not clicking on drag handle
    }

    e.preventDefault();
    e.stopPropagation();

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    const updatedNodes = nodes.map(node =>
      node.id === draggedNode
        ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : node
    );
    onUpdateNodes(updatedNodes);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingNodeId && connectingNodeId !== nodeId) {
      onConnectEnd(connectingNodeId, nodeId);
    } else {
      onSelectNode(nodes.find(n => n.id === nodeId) || null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas
    if (e.target === e.currentTarget) {
      onSelectNode(null);
    }
  };

  const renderConnections = () => {
    return nodes.map(node => 
      node.connected.map(connectedId => {
        const connectedNode = nodes.find(n => n.id === connectedId);
        if (!connectedNode) return null;

        const startX = node.position.x + 120; // Node width / 2
        const startY = node.position.y + 40; // Node height / 2
        const endX = connectedNode.position.x;
        const endY = connectedNode.position.y + 40;

        return (
          <svg
            key={`${node.id}-${connectedId}`}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#94a3b8"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                />
              </marker>
            </defs>
          </svg>
        );
      })
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full bg-grid-pattern bg-gray-50 ${connectingNodeId ? 'cursor-crosshair' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {renderConnections()}
      
      {nodes.map(node => {
        const Icon = getNodeIcon(node.type);
        const isSelected = selectedNode?.id === node.id;
        const isConnecting = connectingNodeId === node.id;
        const canConnectTo = connectingNodeId && connectingNodeId !== node.id;
        
        return (
          <ContextMenu key={node.id}>
            <ContextMenuTrigger asChild>
              <Card
                className={`absolute w-60 select-none ${
                  getNodeColor(node.type)
                } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}
                ${isConnecting ? 'ring-2 ring-green-500 animate-pulse' : ''}
                ${canConnectTo ? 'hover:ring-2 hover:ring-green-400' : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  zIndex: draggedNode === node.id ? 10 : 2,
                  cursor: draggedNode === node.id ? 'grabbing' : 'default'
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
              >
                <div className="p-4">
                  {/* Drag Handle - Only this area allows dragging */}
                  <div className="drag-handle flex items-center gap-2 mb-2 cursor-grab hover:bg-black/5 rounded p-1 -m-1">
                    <Icon className="h-4 w-4 pointer-events-none" />
                    <h4 className="font-medium text-sm pointer-events-none">{node.label}</h4>
                  </div>
                  
                  {/* Content Area - No drag interference */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {node.type.replace('-', ' ')}
                    </Badge>
                    {node.connected.length > 0 && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Connected to {node.connected.length} node(s)
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onConnectStart(node.id)} className="flex items-center gap-2 cursor-pointer">
                <LinkIcon className="h-4 w-4" /> Connect
              </ContextMenuItem>
              {node.connected.length > 0 && (
                <ContextMenuItem onClick={() => onDisconnectNode(node.id)} className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-4 w-4" /> Disconnect All
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onDeleteNode(node.id)} className="flex items-center gap-2 text-red-500 cursor-pointer">
                <Trash2 className="h-4 w-4" /> Delete Node
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">🔧</div>
            <h3 className="text-lg font-medium mb-1">Start Building Your Workflow</h3>
            <p className="text-sm">Add components from the sidebar to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
