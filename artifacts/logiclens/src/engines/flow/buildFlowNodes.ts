import type { ExecutionStep } from "../simulate/simulationEngine";

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    stepIndex: number;
    stepType: string;
    variables: Record<string, string | number | boolean>;
    explanation: string;
    isActive: boolean;
    isVisited: boolean;
    branchTaken?: "true" | "false";
  };
}

export function buildFlowNodes(steps: ExecutionStep[], activeStep: number): FlowNode[] {
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 60;
  const V_GAP = 90;
  const H_OFFSET = 220;

  const nodes: FlowNode[] = [];
  let y = 50;
  const baseX = 300;

  // Group consecutive steps for layout
  steps.forEach((step, idx) => {
    let x = baseX;
    let nodeType = "processNode";

    switch (step.type) {
      case "start":
        nodeType = "startNode";
        break;
      case "end":
        nodeType = "endNode";
        break;
      case "condition":
      case "loop-start":
        nodeType = "decisionNode";
        break;
      case "output":
        nodeType = "outputNode";
        break;
      case "branch-true":
        x = baseX + H_OFFSET;
        nodeType = "processNode";
        break;
      case "branch-false":
        x = baseX - H_OFFSET;
        nodeType = "processNode";
        break;
      default:
        nodeType = "processNode";
    }

    const label = truncateLabel(step.codeLine, 28);

    nodes.push({
      id: step.nodeId,
      type: nodeType,
      position: { x, y },
      data: {
        label,
        stepIndex: idx,
        stepType: step.type,
        variables: step.variables,
        explanation: step.explanation,
        isActive: idx === activeStep,
        isVisited: idx < activeStep,
        branchTaken: step.branchTaken,
      },
    });

    y += V_GAP;
  });

  return nodes;
}

function truncateLabel(text: string, max: number): string {
  const cleaned = text.replace(/^\s+/, "").replace(/\s+/g, " ");
  return cleaned.length > max ? cleaned.slice(0, max - 1) + "…" : cleaned;
}
