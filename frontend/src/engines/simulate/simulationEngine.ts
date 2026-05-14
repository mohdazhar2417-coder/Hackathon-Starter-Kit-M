export type StepType = "assignment" | "loop" | "condition" | "output" | "start" | "end";

export interface VariableState {
  [key: string]: string | number | boolean;
}

export interface CalculationStep {
  expr: string;
  result: string | number | boolean;
}

export interface StateChange {
  varName: string;
  before: any;
  after: any;
}

export type StepStatus = "completed" | "current" | "pending";

export interface ExecutionStep {
  stepIndex: number;
  stepNumber: number;
  lineNumber: number;
  type: StepType;
  title: string;
  codeLine: string;
  description: string;
  beforeState: VariableState;
  afterState: VariableState;
  stateChanges: StateChange[];
  calculations: CalculationStep[];
  iteration?: number;
  nodeId: string;
  loopId?: string;

  parentLoopId?: string;
  accumulatedOutput: string;
  branchTaken?: "true" | "false";
  status: StepStatus;
}



export interface GraphNode {
  id: string;
  type: "start" | "operation" | "decision" | "loop" | "end";
  label: string;
  codeLine: string;
  line: number;
  data?: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface SimulationResult {
  steps: ExecutionStep[];
  finalOutput: string;
  variables: VariableState;
  error?: string;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}



interface CustomInputs {
  [key: string]: string | number;
}

// Simple Java statement types
type Statement = (
  | { type: "declaration"; varName: string; value: string; line: number; raw: string }
  | { type: "assignment"; varName: string; value: string; line: number; raw: string }
  | { type: "print"; content: string; newline: boolean; line: number; raw: string }
  | { type: "if"; condition: string; body: Statement[]; elseBody?: Statement[]; elseIfs?: { condition: string; body: Statement[] }[]; line: number; raw: string }
  | { type: "for"; init: string; condition: string; update: string; body: Statement[]; line: number; raw: string }
  | { type: "while"; condition: string; body: Statement[]; line: number; raw: string }
  | { type: "break"; line: number; raw: string }
  | { type: "comment"; line: number; raw: string }
) & { loopTitle?: string; nodeId?: string };



const MAX_STEPS = 1000;
const MAX_LOOPS = 500;

export function simulate(code: string, customInputs: CustomInputs = {}): SimulationResult {
  const steps: ExecutionStep[] = [];
  let variables: VariableState = {};
  let accOutput = "";
  let nodeCounter = 0;
  let stepCounter = 0;
  let breakFlag = false;

  const lines = code.split("\n");

  function nextNode(type: string): string {
    return `${type}-${nodeCounter++}`;
  }

  function resolveExpr(expr: string, vars: VariableState): string | number | boolean {
    expr = expr.trim();
    if (expr === "") return "";

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);

    // Boolean literals
    if (expr === "true") return true;
    if (expr === "false") return false;

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);

    // char literal
    if (expr.startsWith("'") && expr.endsWith("'")) return expr.slice(1, -1);

    // Variable lookup
    if (/^[a-zA-Z_]\w*$/.test(expr)) {
      if (expr in vars) return vars[expr];
      if (expr in customInputs) return customInputs[expr];
      return 0;
    }

    // Substitution: replace variables with values
    let substituted = expr;
    const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
    for (const v of varNames) {
      const val = vars[v];
      const re = new RegExp(`\\b${v}\\b`, "g");
      substituted = substituted.replace(re, typeof val === "string" ? `"${val}"` : String(val));
    }
    for (const [k, v] of Object.entries(customInputs)) {
      if (!(k in vars)) {
        const re = new RegExp(`\\b${k}\\b`, "g");
        substituted = substituted.replace(re, String(v));
      }
    }

    // String concatenation and formatting: handle "..." + x or x + "..."
    if (substituted.includes('"') && substituted.includes('+')) {
      try {
        // eslint-disable-next-line no-new-func
        return new Function(`return (${substituted})`)();
      } catch {
        const parts = substituted.split(/\+(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        let res = "";
        for (const p of parts) {
          const t = p.trim();
          if (t.startsWith('"') && t.endsWith('"')) res += t.slice(1, -1);
          else res += String(resolveExpr(t, vars));
        }
        return res;
      }
    }

    // Arithmetic/boolean evaluation
    try {
      // Handle integer division by replacing '/' with a call to a truncation helper
      // This is a simple regex that won't handle all cases but works for typical 'a / b'
      let jsExpr = substituted
        .replace(/&&/g, "&&")
        .replace(/\|\|/g, "||")
        .replace(/!/g, "!");

      // If it looks like a division of integers, wrap it
      // We'll use a more general approach: wrap the whole expression and provide a custom '/' operator via a function if possible
      // Actually, since we use new Function, we can inject a helper
      
      // eslint-disable-next-line no-new-func
      const result = new Function('Math', `
        const _div = (a, b) => (Number.isInteger(a) && Number.isInteger(b)) ? Math.trunc(a / b) : a / b;
        return (${jsExpr.replace(/\//g, ' / ')}); 
      `)(Math);

      // Wait, replacing '/' globally might break regexes or strings, but we already handled strings above.
      // A better way for division is to just truncate the result if it was supposed to be an int.
      // But we don't know that. Let's use the property that Java truncates if BOTH are ints.
      
      // Let's refine the jsExpr to handle division specifically
      const divFixExpr = jsExpr.replace(/([^/]+)\s*\/\s*([^/]+)/g, (match, p1, p2) => {
        return `((Number.isInteger(${p1}) && Number.isInteger(${p2})) ? Math.trunc(${p1} / ${p2}) : (${p1} / ${p2}))`;
      });

      // eslint-disable-next-line no-new-func
      const finalResult = new Function(`return (${divFixExpr})`)();
      
      if (typeof finalResult === "number" && !isNaN(finalResult)) {
        return finalResult % 1 === 0 ? Math.round(finalResult) : finalResult;
      }
      return finalResult;
    } catch {
      return substituted;
    }
  }


  function getCalculations(expr: string, vars: VariableState): CalculationStep[] {
    const calcs: CalculationStep[] = [];
    
    // Step 1: Substitution
    let substituted = expr;
    const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
    let changed = false;
    for (const v of varNames) {
      if (substituted.includes(v)) {
        const val = vars[v];
        const re = new RegExp(`\\b${v}\\b`, "g");
        substituted = substituted.replace(re, String(val));
        changed = true;
      }
    }
    
    if (changed) {
      calcs.push({ expr: expr, result: substituted });
    }

    // Step 2: Final Result
    const finalResult = resolveExpr(expr, vars);
    if (String(finalResult) !== substituted) {
      calcs.push({ expr: substituted, result: finalResult });
    }

    return calcs;
  }



  function evalCondition(condition: string, vars: VariableState): boolean {
    try {
      let c = condition.trim();
      const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
      for (const v of varNames) {
        const val = vars[v];
        const re = new RegExp(`\\b${v}\\b`, "g");
        c = c.replace(re, typeof val === "string" ? `"${val}"` : String(val));
      }
      for (const [k, v] of Object.entries(customInputs)) {
        if (!(k in vars)) {
          const re = new RegExp(`\\b${k}\\b`, "g");
          c = c.replace(re, String(v));
        }
      }
      // eslint-disable-next-line no-new-func
      return !!new Function(`return !!(${c})`)();
    } catch {
      return false;
    }
  }

  function findLineNumber(raw: string): number {
    if (!raw) return 1;
    const firstLine = raw.split("\n")[0].trim();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes(firstLine)) return i + 1;
    }
    return 1;
  }

  let currentIteration: number | undefined;
  let currentLoopId: string | undefined;
  let loopStack: string[] = [];

  function addStep(
    type: StepType,
    title: string,
    description: string,
    codeLine: string,
    beforeState: VariableState,
    afterState: VariableState,
    newOutput: string = "",
    calculations: CalculationStep[] = [],
    forceLine?: number,
    branchTaken?: "true" | "false",
    nodeId?: string
  ) {
    if (stepCounter >= MAX_STEPS) return;
    accOutput += newOutput;
    const lineNum = forceLine || findLineNumber(codeLine);
    
    // Calculate state changes
    const stateChanges: StateChange[] = [];
    const allKeys = new Set([...Object.keys(beforeState), ...Object.keys(afterState)]);
    allKeys.forEach(key => {
      if (beforeState[key] !== afterState[key]) {
        stateChanges.push({
          varName: key,
          before: beforeState[key],
          after: afterState[key]
        });
      }
    });

    steps.push({
      stepIndex: stepCounter,
      stepNumber: stepCounter + 1,
      lineNumber: lineNum,
      type,
      title,
      codeLine,
      description,
      beforeState: { ...beforeState },
      afterState: { ...afterState },
      stateChanges,
      calculations,
      iteration: currentIteration,
      nodeId: nodeId || `node-${lineNum}`,
      loopId: currentLoopId,
      parentLoopId: loopStack.length > 1 ? loopStack[loopStack.length - 2] : undefined,
      accumulatedOutput: accOutput,
      branchTaken,
      status: "pending"
    });
    stepCounter++;
  }





  function generateGraph(stmts: Statement[]): { nodes: GraphNode[], edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let nodeIdCounter = 0;

    const createNode = (s: Statement, type: GraphNode["type"]): string => {
      const id = `node-${s.line}-${nodeIdCounter++}`;
      s.nodeId = id; // Store ID on the statement for simulation sync
      nodes.push({
        id,
        type,
        label: s.type,
        codeLine: s.raw,
        line: s.line
      });
      return id;
    };

    const processBlock = (block: Statement[], entryId: string, exitId: string): string => {
      let lastId = entryId;
      for (const s of block) {
        if (s.type === "declaration" || s.type === "assignment" || s.type === "print" || s.type === "break") {
          const id = createNode(s, "operation");
          edges.push({ id: `edge-${lastId}-${id}`, source: lastId, target: id });
          lastId = id;
        } else if (s.type === "if") {
          const id = createNode(s, "decision");
          edges.push({ id: `edge-${lastId}-${id}`, source: lastId, target: id });
          
          const endIfId = `endif-${s.line}-${nodeIdCounter++}`;
          nodes.push({ id: endIfId, type: "operation", label: "End If", codeLine: "}", line: s.line });

          // True branch
          const trueBranchEnd = processBlock(s.body, id, endIfId);
          // Label the first edge from decision node
          const trueEdge = edges.find(e => e.source === id && !e.label);
          if (trueEdge) trueEdge.label = "true";

          // Else branch
          if (s.elseBody && s.elseBody.length > 0) {
             const falseBranchEnd = processBlock(s.elseBody, id, endIfId);
             // Label the second edge from decision node
             const falseEdge = edges.find(e => e.source === id && e.target !== trueEdge?.target && !e.label);
             if (falseEdge) falseEdge.label = "false";
          } else {
             edges.push({ id: `edge-${id}-${endIfId}`, source: id, target: endIfId, label: "false" });
          }
          lastId = endIfId;
        } else if (s.type === "while" || s.type === "for") {
          const id = createNode(s, "loop");
          edges.push({ id: `edge-${lastId}-${id}`, source: lastId, target: id });
          
          const endLoopId = `endloop-${s.line}-${nodeIdCounter++}`;
          nodes.push({ id: endLoopId, type: "operation", label: "Loop End", codeLine: "}", line: s.line });

          // Loop body flows back to condition header
          processBlock(s.body, id, id); 
          
          // Exit path
          edges.push({ id: `edge-${id}-${endLoopId}`, source: id, target: endLoopId, label: "exit" });
          lastId = endLoopId;
        }
      }
      if (lastId !== exitId && exitId !== "") {
        edges.push({ id: `edge-${lastId}-${exitId}`, source: lastId, target: exitId });
      }
      return lastId;
    };


    const startNode = { id: "start", type: "start" as const, label: "Start", codeLine: "main()", line: 1 };
    const endNode = { id: "end", type: "end" as const, label: "End", codeLine: "}", line: lines.length };
    nodes.push(startNode, endNode);
    
    processBlock(stmts, "start", "end");

    return { nodes, edges };
  }

  function parseBody(text: string, startLine: number = 1): Statement[] {
    const stmts: Statement[] = [];
    let i = 0;
    const tkns = tokenizeBody(text, startLine);

    while (i < tkns.length) {
      const tk = tkns[i];
      const parsed = parseStatement(tkns, i);
      if (parsed) {
        stmts.push(parsed.stmt);
        i = parsed.nextI;
      } else {
        i++;
      }
    }
    return stmts;
  }


  interface Token {
    text: string;
    line: number;
  }

  function tokenizeBody(text: string, startLine: number = 1): Token[] {
    const result: Token[] = [];
    let braceDepth = 0;
    let parenDepth = 0;
    let current = "";
    let inStr = false;
    let currentLine = startLine;
    let tokenStartLine = startLine;

    const pushToken = () => {
      const trimmed = current.trim();
      if (trimmed) {
        result.push({ text: trimmed, line: tokenStartLine });
      }
      current = "";
    };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      
      // Update line tracking before appending to current
      if (!inStr && current.trim() === "") {
        if (ch === "\n") tokenStartLine = currentLine + 1;
        else if (ch === " ") tokenStartLine = currentLine;
      }

      if (ch === '"' && text[i - 1] !== "\\") inStr = !inStr;
      
      if (!inStr) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
        if (ch === "(") parenDepth++;
        if (ch === ")") parenDepth--;

        current += ch;

        // Special handling for if-else: don't push token yet if followed by 'else'
        if (ch === "}" && braceDepth === 0) {
          // Look ahead for 'else'
          let lookAhead = "";
          let j = i + 1;
          while (j < text.length && /\s/.test(text[j])) j++;
          if (text.substring(j, j + 4) === "else") {
            // Keep going, don't push yet
          } else {
            pushToken();
            tokenStartLine = currentLine;
          }
        } else if (ch === ";" && braceDepth === 0 && parenDepth === 0) {
          pushToken();
          tokenStartLine = currentLine;
        }
      } else {
        current += ch;
      }
      if (ch === "\n") currentLine++;
    }
    pushToken();
    return result.filter(t => t.text);
  }




  function parseStatement(tkns: Token[], i: number): { stmt: Statement; nextI: number } | null {
    const t = tkns[i];
    if (!t) return null;
    const tk = t.text;
    const lineNum = t.line;

    // Comments
    if (tk.startsWith("//") || tk.startsWith("/*")) {
      return { stmt: { type: "comment", line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // For loop
    const forMatch = tk.match(/^for\s*\(\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*\)\s*\{([\s\S]*)\}$/);
    if (forMatch) {
      const bodyText = forMatch[4];
      const bodyStartLine = lineNum + (tk.indexOf("{") !== -1 ? tk.substring(0, tk.indexOf("{")).split("\n").length - 1 : 0);
      const body = parseBody(bodyText, bodyStartLine + 1);
      return {
        stmt: { type: "for", init: forMatch[1], condition: forMatch[2], update: forMatch[3], body, line: lineNum, raw: tk },
        nextI: i + 1,
      };
    }

    // While loop
    const whileMatch = tk.match(/^while\s*\((.*?)\)\s*\{([\s\S]*)\}$/);
    if (whileMatch) {
      const bodyText = whileMatch[2];
      const bodyStartLine = lineNum + (tk.indexOf("{") !== -1 ? tk.substring(0, tk.indexOf("{")).split("\n").length - 1 : 0);
      const body = parseBody(bodyText, bodyStartLine + 1);
      return {
        stmt: { type: "while", condition: whileMatch[1], body, line: lineNum, raw: tk },
        nextI: i + 1,
      };
    }

    // If/else-if/else
    const ifMatch = tk.match(/^if\s*\(([\s\S]*?)\)\s*\{([\s\S]*?)\}([\s\S]*)$/);
    if (ifMatch) {
      const condition = ifMatch[1];
      const bodyText = ifMatch[2];
      const bodyStartLine = lineNum + (tk.indexOf("{") !== -1 ? tk.substring(0, tk.indexOf("{")).split("\n").length - 1 : 0);
      const body = parseBody(bodyText, bodyStartLine + 1);
      
      const rest = ifMatch[3].trim();
      const elseIfs: { condition: string; body: Statement[] }[] = [];
      let elseBody: Statement[] | undefined;

      let remaining = rest;
      while (remaining.startsWith("else if") || remaining.startsWith("else if")) {
        const eiMatch = remaining.match(/^else\s+if\s*\(([\s\S]*?)\)\s*\{([\s\S]*?)\}([\s\S]*)$/);
        if (!eiMatch) break;
        elseIfs.push({ condition: eiMatch[1], body: parseBody(eiMatch[2], lineNum) }); // simplified line for else-if
        remaining = eiMatch[3].trim();
      }
      const elseMatch = remaining.match(/^else\s*\{([\s\S]*)\}$/);
      if (elseMatch) elseBody = parseBody(elseMatch[1], lineNum);

      return {
        stmt: { type: "if", condition, body, elseBody, elseIfs, line: lineNum, raw: tk },
        nextI: i + 1,
      };
    }

    // break
    if (tk === "break;") {
      return { stmt: { type: "break", line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // Print
    const printlnMatch = tk.match(/^System\.out\.println\s*\(([\s\S]*)\);$/);
    if (printlnMatch) {
      return { stmt: { type: "print", content: printlnMatch[1], newline: true, line: lineNum, raw: tk }, nextI: i + 1 };
    }
    const printMatch = tk.match(/^System\.out\.print\s*\(([\s\S]*)\);$/);
    if (printMatch) {
      return { stmt: { type: "print", content: printMatch[1], newline: false, line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // Variable declaration
    const declMatch = tk.match(/^(?:int|double|float|long|String|char|boolean|byte|short)\s+(\w+)\s*=\s*([\s\S]+?);$/);
    if (declMatch) {
      return { stmt: { type: "declaration", varName: declMatch[1], value: declMatch[2], line: lineNum, raw: tk }, nextI: i + 1 };
    }
    const uninitMatch = tk.match(/^(?:int|double|float|long|String|char|boolean|byte|short)\s+(\w+)\s*;$/);
    if (uninitMatch) {
      return { stmt: { type: "declaration", varName: uninitMatch[1], value: "0", line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // Assignment
    const assignMatch = tk.match(/^(\w+)\s*([+\-*\/]?=)\s*([\s\S]+?);$/);
    if (assignMatch) {
      let rhs = assignMatch[3];
      const op = assignMatch[2];
      if (op !== "=") rhs = `${assignMatch[1]} ${op[0]} (${rhs})`;
      return { stmt: { type: "assignment", varName: assignMatch[1], value: rhs, line: lineNum, raw: tk }, nextI: i + 1 };
    }

    const incrMatch = tk.match(/^(\w+)(\+\+|--);$/);
    if (incrMatch) {
      const op = incrMatch[2] === "++" ? `${incrMatch[1]} + 1` : `${incrMatch[1]} - 1`;
      return { stmt: { type: "assignment", varName: incrMatch[1], value: op, line: lineNum, raw: tk }, nextI: i + 1 };
    }

    return null;
  }


  function execStatements(stmts: Statement[]) {
    for (const stmt of stmts) {
      if (stepCounter >= MAX_STEPS) return;
      if (breakFlag) return;
      execStatement(stmt);
    }
  }

  function execStatement(stmt: Statement) {
    if (stepCounter >= MAX_STEPS) return;
    if (breakFlag && stmt.type !== "break") return;

    const prevVars = { ...variables };

    switch (stmt.type) {
      case "comment":
        return;

      case "declaration":
      case "assignment": {
        const val = resolveExpr(stmt.value, variables);
        const calculations = getCalculations(stmt.value, prevVars);
        const isDecl = stmt.type === "declaration";
        
        variables = { ...variables, [stmt.varName]: val };
        
        addStep(
          "assignment",
          stmt.loopTitle || (isDecl ? "Variable Declaration" : "Variable Assignment"),
          isDecl 
            ? `Initialize '${stmt.varName}' with ${JSON.stringify(val)}` 
            : `Update '${stmt.varName}' to ${JSON.stringify(val)}`,
          stmt.raw,
          prevVars,
          variables,
          "",
          calculations,
          stmt.line,
          undefined,
          stmt.nodeId
        );


        break;
      }

      case "print": {
        const val = resolveExpr(stmt.content, variables);
        const out = String(val) + (stmt.newline ? "\n" : "");
        const calculations = getCalculations(stmt.content, variables);
        
        addStep(
          "output",
          stmt.loopTitle || "Program Output",
          `Print "${String(val)}" to console`,
          stmt.raw,
          variables,
          variables,
          out,
          calculations,
          stmt.line,
          undefined,
          stmt.nodeId
        );


        break;
      }


      case "if": {
        const result = evalCondition(stmt.condition, variables);
        const calculations = getCalculations(stmt.condition, variables);
        
        addStep(
          "condition",
          "Condition Check",
          `Checking if (${stmt.condition}) is ${result ? "True" : "False"}`,
          `if (${stmt.condition})`,
          variables,
          variables,
          "",
          calculations,
          stmt.line,
          result ? "true" : "false",
          stmt.nodeId
        );

        
        if (result) {
          execStatements(stmt.body);
        } else if (stmt.elseIfs && stmt.elseIfs.length > 0) {
          let handled = false;
          for (const ei of stmt.elseIfs) {
            const eiResult = evalCondition(ei.condition, variables);
            const eiCalcs = getCalculations(ei.condition, variables);
            
            addStep(
              "condition",
              "Else-If Check",
              `Checking else if (${ei.condition}) is ${eiResult ? "True" : "False"}`,
              `else if (${ei.condition})`,
              variables,
              variables,
              "",
              eiCalcs,
              stmt.line,
              eiResult ? "true" : "false",
              stmt.nodeId
            );

            
            if (eiResult) {
              execStatements(ei.body);
              handled = true;
              break;
            }
          }
          if (!handled && stmt.elseBody) {
            execStatements(stmt.elseBody);
          }
        } else if (stmt.elseBody) {
          execStatements(stmt.elseBody);
        }
        break;
      }


      case "for": {
        const loopId = `loop-${stepCounter}`;
        const oldLoopId = currentLoopId;
        const oldIteration = currentIteration;
        currentLoopId = loopId;
        loopStack.push(loopId);
        
        // Execute init
        const initToken = tokenizeBody(stmt.init + ";", stmt.line)[0];
        const initStmt = parseStatement([initToken], 0);
        if (initStmt) {
          // Force the init statement to use the loop's line and nodeId
          initStmt.stmt.line = stmt.line;
          initStmt.stmt.nodeId = stmt.nodeId;
          execStatement(initStmt.stmt);
        }

        let loopCount = 0;
        while (loopCount < MAX_LOOPS) {
          currentIteration = loopCount + 1;
          const condResult = evalCondition(stmt.condition, variables);
          const calculations = getCalculations(stmt.condition, variables);
          
          addStep(
            "loop",
            `Loop Condition Check (Iteration ${currentIteration})`,
            `Is ${stmt.condition} still true? ${condResult ? "Yes" : "No"}`,
            stmt.raw, // Use original header for better mapping
            variables,
            variables,
            "",
            calculations,
            stmt.line,
            condResult ? "true" : "false",
            stmt.nodeId
          );

          
          if (!condResult) break;

          // Body execution
          const oldIterationTitle = currentIteration;
          execStatements(stmt.body.map(s => ({ ...s, loopTitle: `Loop Body (Iter ${oldIterationTitle})` })));
          
          if (breakFlag) { breakFlag = false; break; }

          // Update
          const updateToken = tokenizeBody(stmt.update + ";", stmt.line)[0];
          const updateStmt = parseStatement([updateToken], 0);
          if (updateStmt) {
            // Force the update statement to use the loop's line and nodeId
            updateStmt.stmt.line = stmt.line;
            updateStmt.stmt.nodeId = stmt.nodeId;
            execStatement(updateStmt.stmt);
          }
          
          loopCount++;
          if (stepCounter >= MAX_STEPS) break;
        }
        
        loopStack.pop();
        currentLoopId = oldLoopId;
        currentIteration = oldIteration;
        break;
      }



      case "while": {
        const loopId = `loop-${stepCounter}`;
        const oldLoopId = currentLoopId;
        const oldIteration = currentIteration;
        currentLoopId = loopId;
        loopStack.push(loopId);
        
        let loopCount = 0;
        while (loopCount < MAX_LOOPS) {
          currentIteration = loopCount + 1;
          const condResult = evalCondition(stmt.condition, variables);
          const calculations = getCalculations(stmt.condition, variables);
          
          addStep(
            "loop",
            `Loop Condition Check (Iteration ${currentIteration})`,
            `Is ${stmt.condition} still true? ${condResult ? "Yes" : "No"}`,
            stmt.raw,
            variables,
            variables,
            "",
            calculations,
            stmt.line,
            condResult ? "true" : "false",
            stmt.nodeId
          );

          
          if (!condResult) break;

          const oldIterationTitle = currentIteration;
          execStatements(stmt.body.map(s => ({ ...s, loopTitle: `Loop Body Execution (Iteration ${oldIterationTitle})` })));
          
          if (breakFlag) { breakFlag = false; break; }
          loopCount++;
          if (stepCounter >= MAX_STEPS) break;
        }
        
        loopStack.pop();
        currentLoopId = oldLoopId;
        currentIteration = oldIteration;
        break;
      }



      case "break": {
        breakFlag = true;
        addStep(
          "end",
          "Break Statement",
          "Exiting loop early",
          "break;",
          variables,
          variables,
          "",
          [],
          stmt.line,
          undefined,
          stmt.nodeId
        );

        break;
      }

    }

  }

  // Extract body of main method
  // Match the main method and its body, stopping at the corresponding closing brace
  let body = code;
  let methodStartLine = 1;
  const mainHeaderMatch = code.match(/public\s+static\s+void\s+main\s*\(String\[\]\s+\w+\)\s*\{/);
  if (mainHeaderMatch) {
    const startIdx = mainHeaderMatch.index! + mainHeaderMatch[0].length;
    const prefix = code.substring(0, startIdx);
    methodStartLine = prefix.split("\n").length;

    let depth = 1;
    let endIdx = startIdx;
    while (depth > 0 && endIdx < code.length) {
      if (code[endIdx] === '{') depth++;
      else if (code[endIdx] === '}') depth--;
      endIdx++;
    }
    body = code.substring(startIdx, endIdx - 1);
  }


  // Apply custom inputs
  const inputDefaults: Record<string, number> = {};
  for (const [k, v] of Object.entries(customInputs)) {
    inputDefaults[k] = typeof v === "string" ? parseFloat(v) || 0 : v;
  }

  const stmts = parseBody(body, methodStartLine);
  const graph = generateGraph(stmts);

  // Start step
  addStep(
    "start", 
    "Program Start", 
    "The program begins execution in the main method.", 
    "// Program Start", 
    {}, 
    {}, 
    "", 
    [], 
    1,
    undefined,
    "start"
  );

  try {
    // Apply custom input overrides to initial variable declarations
    const processedStmts = stmts.map((s) => {
      if ((s.type === "declaration") && inputDefaults[s.varName] !== undefined) {
        return { ...s, value: String(inputDefaults[s.varName]) };
      }
      return s;
    });

    execStatements(processedStmts);
  } catch (err) {
    return {
      steps,
      finalOutput: accOutput,
      variables,
      error: `Simulation error: ${err}`,
      graph
    };
  }

  // End step
  addStep(
    "end", 
    "Program End", 
    `Execution finished. Final output: ${accOutput || "(no output)"}`, 
    "// Program End", 
    variables, 
    variables, 
    "", 
    [], 
    lines.length,
    undefined,
    "end"
  );


  return { steps, finalOutput: accOutput, variables, graph };
}

