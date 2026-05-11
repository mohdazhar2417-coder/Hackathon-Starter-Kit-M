import type { ExecutionStep } from "../simulate/simulationEngine";

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, string | number>;
  labelStyle?: Record<string, string | number>;
  markerEnd?: { type: string; color?: string };
}

export function buildFlowEdges(steps: ExecutionStep[]): FlowEdge[] {
  const edges: FlowEdge[] = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const curr = steps[i];
    const next = steps[i + 1];

    const isLoopBack = next.stepIndex < curr.stepIndex;
    const isBranch = curr.type === "condition" || curr.type === "loop-start";
    const isTrue = curr.branchTaken === "true";

    const edgeColor = isBranch
      ? isTrue
        ? "#6ee7b7"
        : "#f87171"
      : "#6366f1";

    edges.push({
      id: `e-${curr.nodeId}-${next.nodeId}`,
      source: curr.nodeId,
      target: next.nodeId,
      label: isBranch ? (isTrue ? "Yes" : "No") : undefined,
      type: isLoopBack ? "smoothstep" : "smoothstep",
      animated: isLoopBack,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
      labelStyle: {
        fill: edgeColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      },
      markerEnd: {
        type: "ArrowClosed",
        color: edgeColor,
      },
    });
  }

  return edges;
}
