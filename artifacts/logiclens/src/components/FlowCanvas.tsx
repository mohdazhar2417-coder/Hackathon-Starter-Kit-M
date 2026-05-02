import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { buildFlowNodes } from "@/engines/flow/buildFlowNodes";
import { buildFlowEdges } from "@/engines/flow/buildFlowEdges";
import type { ExecutionStep } from "@/engines/simulate/simulationEngine";
import { cn } from "@/lib/utils";

// Custom node components
function StartNode({ data }: { data: { label: string; isActive: boolean; isVisited: boolean } }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 px-4 py-2 text-xs font-bold transition-all duration-300 min-w-[80px]",
        data.isActive
          ? "border-primary bg-primary text-primary-foreground active-node-glow scale-105"
          : data.isVisited
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
          : "border-border bg-card text-foreground"
      )}
    >
      START
    </div>
  );
}

function EndNode({ data }: { data: { label: string; isActive: boolean; isVisited: boolean } }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 px-4 py-2 text-xs font-bold transition-all duration-300 min-w-[80px]",
        data.isActive
          ? "border-primary bg-primary text-primary-foreground active-node-glow scale-105"
          : data.isVisited
          ? "border-muted-foreground/50 bg-muted/30 text-muted-foreground"
          : "border-border bg-card text-foreground"
      )}
    >
      END
    </div>
  );
}

function ProcessNode({ data }: { data: { label: string; isActive: boolean; isVisited: boolean } }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border px-3 py-2 text-xs font-mono transition-all duration-300 max-w-[200px] text-center",
        data.isActive
          ? "border-primary bg-primary/10 text-primary active-node-glow scale-105 font-semibold"
          : data.isVisited
          ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-300 visited-node"
          : "border-border bg-card text-foreground hover:border-primary/30"
      )}
    >
      {data.label}
    </div>
  );
}

function DecisionNode({ data }: { data: { label: string; isActive: boolean; isVisited: boolean; branchTaken?: string } }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 80 }}>
      <div
        className={cn(
          "absolute inset-0 border-2 transition-all duration-300",
          data.isActive
            ? "border-amber-400 bg-amber-400/10 active-node-glow"
            : data.isVisited
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border bg-card"
        )}
        style={{ transform: "rotate(45deg)", borderRadius: 4 }}
      />
      <div className="relative z-10 px-2 text-center">
        <p className={cn("text-[10px] font-mono leading-tight", data.isActive ? "text-amber-400 font-semibold" : data.isVisited ? "text-amber-400/60" : "text-foreground")}>
          {data.label.length > 20 ? data.label.slice(0, 20) + "…" : data.label}
        </p>
        {data.branchTaken && (
          <p className={cn("text-[9px] mt-0.5 font-bold", data.branchTaken === "true" ? "text-emerald-400" : "text-red-400")}>
            {data.branchTaken === "true" ? "YES" : "NO"}
          </p>
        )}
      </div>
    </div>
  );
}

function OutputNode({ data }: { data: { label: string; isActive: boolean; isVisited: boolean } }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-all duration-300 max-w-[200px]",
        data.isActive
          ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 active-node-glow scale-105 font-semibold"
          : data.isVisited
          ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400/60 visited-node"
          : "border-border bg-card text-foreground"
      )}
    >
      <span className="text-[10px] opacity-60">OUT</span>
      <span className="font-mono truncate">{data.label}</span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  processNode: ProcessNode,
  decisionNode: DecisionNode,
  outputNode: OutputNode,
};

interface FlowCanvasProps {
  steps: ExecutionStep[];
  activeStep: number;
  onNodeClick?: (stepIndex: number) => void;
}

export function FlowCanvas({ steps, activeStep, onNodeClick }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!steps.length) return;
    const newNodes = buildFlowNodes(steps, activeStep);
    const newEdges = buildFlowEdges(steps);
    setNodes(newNodes as Parameters<typeof setNodes>[0]);
    setEdges(newEdges as Parameters<typeof setEdges>[0]);
  }, [steps, activeStep, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: unknown, node: { data: { stepIndex: number } }) => {
      onNodeClick?.(node.data.stepIndex);
    },
    [onNodeClick]
  );

  if (!steps.length) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
          <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No trace running</p>
          <p className="text-xs text-muted-foreground mt-1">Select a program and click "Analyze & Trace"</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={2}
      style={{ background: "hsl(222 47% 8%)" }}
      defaultEdgeOptions={{
        type: "smoothstep",
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="hsl(222 30% 18%)"
      />
      <Controls
        style={{
          background: "hsl(222 40% 11%)",
          border: "1px solid hsl(222 30% 16%)",
          borderRadius: 8,
        }}
      />
      <MiniMap
        style={{
          background: "hsl(222 40% 11%)",
          border: "1px solid hsl(222 30% 16%)",
        }}
        nodeColor={(node) =>
          node.data?.isActive ? "#6366f1" : node.data?.isVisited ? "#4338ca" : "hsl(222 35% 18%)"
        }
      />
    </ReactFlow>
  );
}
