
import { useState, useRef } from 'react';
import { WorkflowNode } from '@/pages/WorkflowBuilderPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe, Brain, Filter, Send, ArrowRight } from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  selectedNode: WorkflowNode | null;
  onSelectNode: (node: WorkflowNode | null) => void;
  onUpdateNodes: (nodes: WorkflowNode[]) => void;
}

const WorkflowCanvas = ({ nodes, selectedNode, onSelectNode, onUpdateNodes }: WorkflowCanvasProps) => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = (type: WorkflowNode['type']) => {
    const icons = {
      trigger: Clock,
      scraper: Globe,
      'ai-processor': Brain,
      filter: Filter,
      publisher: Send,
    };
    return icons[type];
  };

  const getNodeColor = (type: WorkflowNode['type']) => {
    const colors = {
      trigger: 'border-blue-200 bg-blue-50',
      scraper: 'border-green-200 bg-green-50',
      'ai-processor': 'border-purple-200 bg-purple-50',
      filter: 'border-yellow-200 bg-yellow-50',
      publisher: 'border-red-200 bg-red-50',
    };
    return colors[type];
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
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
      className="relative w-full h-full bg-grid-pattern bg-gray-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectNode(null)}
    >
      {renderConnections()}
      
      {nodes.map(node => {
        const Icon = getNodeIcon(node.type);
        const isSelected = selectedNode?.id === node.id;
        
        return (
          <Card
            key={node.id}
            className={`absolute w-60 cursor-move select-none transition-all ${
              getNodeColor(node.type)
            } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: draggedNode === node.id ? 10 : 2
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, node.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node);
            }}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <h4 className="font-medium text-sm">{node.label}</h4>
              </div>
              <Badge variant="outline" className="text-xs">
                {node.type.replace('-', ' ')}
              </Badge>
              {node.connected.length > 0 && (
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Connected to {node.connected.length} node(s)
                </div>
              )}
            </div>
          </Card>
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
