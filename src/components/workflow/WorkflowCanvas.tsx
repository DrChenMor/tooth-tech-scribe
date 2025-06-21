
import React, { useCallback, useRef } from 'react';
import { WorkflowNode } from '@/types/WorkflowTypes';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Node,
  Edge,
  XYPosition,
  Connection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

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

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes: initialNodes,
  selectedNode,
  onSelectNode,
  onUpdateNodes,
  onDeleteNode,
  connectingNodeId,
  onConnectStart,
  onConnectEnd,
  onDisconnectNode,
}) => {
  // Convert WorkflowNode to ReactFlow Node format
  const convertToReactFlowNodes = (workflowNodes: WorkflowNode[]): Node[] => {
    return workflowNodes.map(node => ({
      ...node,
      data: { label: node.label, ...node.config }
    }));
  };

  // Convert ReactFlow Node back to WorkflowNode format
  const convertToWorkflowNode = (node: Node): WorkflowNode => {
    // Find the original workflow node to preserve its configuration
    const originalNode = initialNodes.find(n => n.id === node.id);
    
    return {
      id: node.id,
      type: (node.type as WorkflowNode['type']) || 'trigger',
      label: (node.data?.label as string) || '',
      position: node.position,
      data: node.data || {},
      config: originalNode?.config || {}, // Preserve original config
      connected: originalNode?.connected || []
    };
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToReactFlowNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeIdRef = useRef<string | null>(null);

  // Update local state when props change
  React.useEffect(() => {
    setNodes(convertToReactFlowNodes(initialNodes));
  }, [initialNodes, setNodes]);

  const onNodeClick = useCallback((event: any, node: Node) => {
    const workflowNode = convertToWorkflowNode(node);
    onSelectNode(workflowNode);
  }, [onSelectNode]);

  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
    onDeleteNode(node.id);
  }, [onDeleteNode]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (!params.source || !params.target) {
        return;
      }
      onConnectEnd(params.source, params.target);
      setEdges((eds) => addEdge(params, eds));
    },
    [onConnectEnd, setEdges]
  );

  const onConnectStartHandler = useCallback(
    (event: any, { nodeId }: { nodeId: string }) => {
      connectingNodeIdRef.current = nodeId;
      onConnectStart(nodeId);
    },
    [onConnectStart]
  );

  const onPaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, position: node.position };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  return (
    <div className="react-flow-wrapper" ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onConnect={onConnect}
        onConnectStart={onConnectStartHandler}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
