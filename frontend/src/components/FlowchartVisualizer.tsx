import React, { useMemo, useEffect, useState } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  ConnectionLineType,
  BackgroundVariant
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { ExecutionNode } from "./ExecutionNode";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Zap, Focus, Maximize, ChevronDown, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const nodeTypes = {
  start: ExecutionNode,
  operation: ExecutionNode,
  decision: ExecutionNode,
  loop: ExecutionNode,
  end: ExecutionNode,
};

const edgeTypes = {
  default: SmoothStepEdge,
};

const FlowchartInner = () => {
  const { simResult, activeStep } = useWorkspaceStore();
  const { setCenter, fitView, zoomTo } = useReactFlow();
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const [speed, setSpeed] = useState(1); // speed factor (1x default)
  const currentStep = simResult?.steps[activeStep];

  // Advanced Branch-Aware Layout Engine
  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (!simResult?.graph) return { layoutNodes: [], layoutEdges: [] };
    
    const nodes = simResult.graph.nodes;
    const edges = simResult.graph.edges;

    const adj: Record<string, string[]> = {};
    edges.forEach(e => {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    });

    const positioned: Record<string, { x: number, y: number }> = {};
    const levelOccupancy: Record<number, number> = {}; // level -> rightmost X

    // Recursive layout that handles branching
    const positionNode = (nodeId: string, level: number, preferredX: number) => {
      if (positioned[nodeId]) return;

      const currentLevelRight = levelOccupancy[level] || 0;
      const x = Math.max(preferredX, currentLevelRight);
      
      positioned[nodeId] = { x, y: level * 300 }; // Increased vertical spacing
      levelOccupancy[level] = x + 450; // Increased horizontal spacing buffer

      const children = adj[nodeId] || [];
      if (children.length === 1) {
        positionNode(children[0], level + 1, x);
      } else if (children.length > 1) {
        // Spread children out
        const totalWidth = (children.length - 1) * 450;
        const startX = x - totalWidth / 2;
        children.forEach((childId, i) => {
          positionNode(childId, level + 1, startX + i * 450);
        });
      }
    };

    positionNode("start", 0, 0);

    // Fallback for disconnected nodes
    nodes.forEach(n => {
      if (!positioned[n.id]) {
        const fallbackLevel = 0;
        const fallbackX = (levelOccupancy[fallbackLevel] || 0);
        positioned[n.id] = { x: fallbackX, y: 0 };
        levelOccupancy[fallbackLevel] = fallbackX + 450;
      }
    });

    const flowNodes = nodes.map(node => ({
      ...node,
      position: positioned[node.id],
      data: { 
        ...node,
        active: false,
        variables: {},
        status: "pending"
      },
    }));

    const flowEdges = edges.map(edge => ({
      ...edge,
      type: "smoothstep",
      animated: false,
      label: edge.label,
      labelStyle: { fill: "#94a3b8", fontWeight: 800, fontSize: 10, textTransform: "uppercase" },
      labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.8 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      style: { strokeWidth: 2, stroke: "rgba(148, 163, 184, 0.3)" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(148, 163, 184, 0.3)" },
    }));

    return { layoutNodes: flowNodes, layoutEdges: flowEdges };
  }, [simResult?.graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize nodes/edges when graph changes
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
  }, [layoutNodes, layoutEdges]);

  // Real-time execution animation logic
  useEffect(() => {
    if (!currentStep || !simResult) return;

    // Pre-compute the most recent step index for each node up to the current activeStep
    // This correctly handles backward navigation and loops where nodes repeat
    const latestStepByNode: Record<string, number> = {};
    for (let i = 0; i <= activeStep; i++) {
      const step = simResult.steps[i];
      if (step) {
        latestStepByNode[step.nodeId] = i;
      }
    }

    try {
      setNodes((nds) => nds.map((node) => {
        const isActive = node.id === currentStep.nodeId;
        const latestIdx = latestStepByNode[node.id];
        const isCompleted = latestIdx !== undefined && latestIdx < activeStep;

        let completedVars = {};
        if (isCompleted && latestIdx !== undefined) {
          completedVars = simResult.steps[latestIdx]?.afterState || {};
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            active: isActive,
            status: isActive ? "current" : (isCompleted ? "completed" : "pending"),
            variables: isActive ? currentStep.afterState : (isCompleted ? completedVars : {})
          }
        };
      }));

      setEdges((eds) => eds.map((edge) => {
        const prevStep = activeStep > 0 ? simResult.steps[activeStep - 1] : null;
        const isTraversed = currentStep.nodeId === edge.target && prevStep?.nodeId === edge.source;
        const isBranchTaken = isTraversed && (currentStep.branchTaken === edge.label || !edge.label);

        return {
          ...edge,
          animated: isBranchTaken,
          style: { 
            strokeWidth: isBranchTaken ? 4 : 2, 
            stroke: isBranchTaken ? "hsl(var(--primary))" : "rgba(148, 163, 184, 0.2)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: isBranchTaken ? "drop-shadow(0 0 8px hsl(var(--primary)))" : "none"
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: isBranchTaken ? "hsl(var(--primary))" : "rgba(148, 163, 184, 0.2)" 
          },
        };
      }));
    } catch (err) {
      console.error("Animation error:", err);
    }

    // Intelligent Camera Tracking - use layoutNodes to avoid stale closure
    if (isAutoFollowing) {
      const activeNode = layoutNodes.find(n => n.id === currentStep.nodeId);
      if (activeNode) {
        const baseDuration = 800; // Snappier than the step interval to avoid overlap lag
        const adjusted = baseDuration / speed; 
        setCenter(activeNode.position.x + 110, activeNode.position.y + 60, { zoom: 1.1, duration: adjusted });
      }
    }
  }, [activeStep, currentStep, simResult, setNodes, setEdges, setCenter, isAutoFollowing, layoutNodes, speed]);

  return (
    <div className="h-full w-full bg-[#0a0a0b] rounded-3xl border border-border/40 overflow-hidden relative group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background 
          variant="dots" 
          gap={30} 
          size={1} 
          color="#1e1e24" 
          className="opacity-40"
        />
        <Controls className="bg-card/80 border-border rounded-xl overflow-hidden shadow-2xl" />
      </ReactFlow>

      {/* Startup-Level Overlay UI */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div className="flex gap-2 pointer-events-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAutoFollowing(!isAutoFollowing)}
              className={cn(
                "h-10 px-4 rounded-xl border-white/5 backdrop-blur-md transition-all font-black uppercase text-[9px] tracking-widest",
                isAutoFollowing ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60"
              )}
            >
              <Focus className="w-3.5 h-3.5 mr-2" />
              {isAutoFollowing ? "Camera Locked" : "Free Roam"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fitView({ duration: 800 })}
              className="h-10 px-4 rounded-xl border-white/5 bg-white/5 backdrop-blur-md text-white/60 font-black uppercase text-[9px] tracking-widest"
            >
              <Maximize className="w-3.5 h-3.5 mr-2" />
              Center View
            </Button>
            {/* Speed Control Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 rounded-xl border-white/5 bg-white/5 backdrop-blur-md text-white/60 font-black uppercase text-[9px] tracking-widest gap-2"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  {speed}x
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10 rounded-xl min-w-[80px]">
                {[0.25, 0.5, 1, 2].map(v => (
                  <DropdownMenuItem 
                    key={v} 
                    onClick={() => setSpeed(v)}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider py-2 cursor-pointer",
                      speed === v ? "text-primary bg-primary/10" : "text-white/60"
                    )}
                  >
                    {v}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest border border-white/5">
          Drag to explore • Scroll to zoom • Click nodes to inspect
        </div>
      </div>
    </div>
  );
};

export const FlowchartVisualizer = () => (
  <ReactFlowProvider>
    <FlowchartInner />
  </ReactFlowProvider>
);
