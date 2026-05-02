export type StepType = "start" | "declare" | "assign" | "condition" | "loop-start" | "loop-iter" | "output" | "end" | "branch-true" | "branch-false";

export interface VariableState {
  [key: string]: string | number | boolean;
}

export interface ExecutionStep {
  stepIndex: number;
  nodeId: string;
  lineNumber: number;
  codeLine: string;
  type: StepType;
  variables: VariableState;
  previousVariables: VariableState;
  changedVariables: string[];
  output: string;
  accumulatedOutput: string;
  explanation: string;
  branchTaken?: "true" | "false";
}

export interface SimulationResult {
  steps: ExecutionStep[];
  finalOutput: string;
  variables: VariableState;
  error?: string;
}

interface CustomInputs {
  [key: string]: string | number;
}

// Simple Java statement types
type Statement =
  | { type: "declaration"; varName: string; value: string; line: number; raw: string }
  | { type: "assignment"; varName: string; value: string; line: number; raw: string }
  | { type: "print"; content: string; newline: boolean; line: number; raw: string }
  | { type: "if"; condition: string; body: Statement[]; elseBody?: Statement[]; elseIfs?: { condition: string; body: Statement[] }[]; line: number; raw: string }
  | { type: "for"; init: string; condition: string; update: string; body: Statement[]; line: number; raw: string }
  | { type: "while"; condition: string; body: Statement[]; line: number; raw: string }
  | { type: "break"; line: number; raw: string }
  | { type: "comment"; line: number; raw: string };

const MAX_STEPS = 200;
const MAX_LOOPS = 50;

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

    // String concatenation: "..." + x
    if (/"\s*\+|"\s*$/.test(substituted) || substituted.includes('+ "') || substituted.includes('" ')) {
      try {
        // Eval-safe string concat
        const parts = substituted.split(/\+(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        let result = "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            result += trimmed.slice(1, -1);
          } else {
            const num = parseFloat(trimmed);
            result += isNaN(num) ? trimmed : String(num % 1 === 0 ? Math.round(num) : num);
          }
        }
        return result;
      } catch {
        return substituted;
      }
    }

    // Arithmetic/boolean evaluation
    try {
      // Replace Java modulo with JS modulo, handle integer division
      let jsExpr = substituted
        .replace(/\/\//g, "/") // integer div approximation
        .replace(/&&/g, "&&")
        .replace(/\|\|/g, "||")
        .replace(/!/g, "!");

      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${jsExpr})`)();
      if (typeof result === "number" && !isNaN(result)) {
        return result % 1 === 0 ? Math.round(result) : result;
      }
      return result;
    } catch {
      return substituted;
    }
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
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === raw.trim()) return i + 1;
    }
    return 1;
  }

  function addStep(
    nodeId: string,
    type: StepType,
    codeLine: string,
    vars: VariableState,
    prevVars: VariableState,
    changed: string[],
    explanation: string,
    newOutput: string = "",
    branchTaken?: "true" | "false"
  ) {
    if (stepCounter >= MAX_STEPS) return;
    accOutput += newOutput;
    const lineNum = findLineNumber(codeLine);
    steps.push({
      stepIndex: stepCounter++,
      nodeId,
      lineNumber: lineNum,
      codeLine,
      type,
      variables: { ...vars },
      previousVariables: { ...prevVars },
      changedVariables: changed,
      output: newOutput,
      accumulatedOutput: accOutput,
      explanation,
      branchTaken,
    });
  }

  // Tokenize/parse the code body
  function parseBody(text: string): Statement[] {
    const stmts: Statement[] = [];
    let i = 0;
    const tkns = tokenizeBody(text);

    while (i < tkns.length) {
      const tk = tkns[i];
      if (!tk.trim() || tk.trim().startsWith("//") || tk.trim().startsWith("/*")) {
        i++;
        continue;
      }
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

  function tokenizeBody(text: string): string[] {
    // Split into logical lines, preserving blocks
    const result: string[] = [];
    let depth = 0;
    let current = "";
    let inStr = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"' && text[i - 1] !== "\\") inStr = !inStr;
      if (!inStr) {
        if (ch === "{") {
          depth++;
          current += ch;
        } else if (ch === "}") {
          depth--;
          current += ch;
          if (depth === 0) {
            result.push(current.trim());
            current = "";
          }
        } else if (ch === ";" && depth === 0) {
          current += ch;
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      } else {
        current += ch;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result.filter(Boolean);
  }

  function parseStatement(tkns: string[], i: number): { stmt: Statement; nextI: number } | null {
    const tk = tkns[i]?.trim() || "";
    const lineNum = 1;

    // Comments
    if (tk.startsWith("//") || tk.startsWith("/*")) {
      return { stmt: { type: "comment", line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // For loop
    const forMatch = tk.match(/^for\s*\(\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*\)\s*\{([\s\S]*)\}$/);
    if (forMatch) {
      const body = parseBody(forMatch[4]);
      return {
        stmt: { type: "for", init: forMatch[1], condition: forMatch[2], update: forMatch[3], body, line: lineNum, raw: tk },
        nextI: i + 1,
      };
    }

    // While loop
    const whileMatch = tk.match(/^while\s*\((.*?)\)\s*\{([\s\S]*)\}$/);
    if (whileMatch) {
      const body = parseBody(whileMatch[2]);
      return {
        stmt: { type: "while", condition: whileMatch[1], body, line: lineNum, raw: tk },
        nextI: i + 1,
      };
    }

    // If/else-if/else
    const ifMatch = tk.match(/^if\s*\(([\s\S]*?)\)\s*\{([\s\S]*?)\}([\s\S]*)$/);
    if (ifMatch) {
      const condition = ifMatch[1];
      const body = parseBody(ifMatch[2]);
      const rest = ifMatch[3].trim();
      const elseIfs: { condition: string; body: Statement[] }[] = [];
      let elseBody: Statement[] | undefined;

      let remaining = rest;
      while (remaining.startsWith("else if") || remaining.startsWith("else if")) {
        const eiMatch = remaining.match(/^else\s+if\s*\(([\s\S]*?)\)\s*\{([\s\S]*?)\}([\s\S]*)$/);
        if (!eiMatch) break;
        elseIfs.push({ condition: eiMatch[1], body: parseBody(eiMatch[2]) });
        remaining = eiMatch[3].trim();
      }
      const elseMatch = remaining.match(/^else\s*\{([\s\S]*)\}$/);
      if (elseMatch) elseBody = parseBody(elseMatch[1]);

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

    // Variable declaration: int x = 5; or double y = 3.14;
    const declMatch = tk.match(/^(?:int|double|float|long|String|char|boolean|byte|short)\s+(\w+)\s*=\s*([\s\S]+?);$/);
    if (declMatch) {
      return { stmt: { type: "declaration", varName: declMatch[1], value: declMatch[2], line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // Uninitialized declaration
    const uninitMatch = tk.match(/^(?:int|double|float|long|String|char|boolean|byte|short)\s+(\w+)\s*;$/);
    if (uninitMatch) {
      return { stmt: { type: "declaration", varName: uninitMatch[1], value: "0", line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // Assignment: x = expr; or x += y; x++; etc.
    const assignMatch = tk.match(/^(\w+)\s*([+\-*\/]?=)\s*([\s\S]+?);$/);
    if (assignMatch) {
      let rhs = assignMatch[3];
      const op = assignMatch[2];
      if (op !== "=") rhs = `${assignMatch[1]} ${op[0]} (${rhs})`;
      return { stmt: { type: "assignment", varName: assignMatch[1], value: rhs, line: lineNum, raw: tk }, nextI: i + 1 };
    }

    // x++; or x--;
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
        const changed = variables[stmt.varName] !== val ? [stmt.varName] : [];
        variables = { ...variables, [stmt.varName]: val };
        const isDecl = stmt.type === "declaration";
        addStep(
          nextNode("assign"),
          isDecl ? "declare" : "assign",
          stmt.raw,
          variables,
          prevVars,
          changed,
          isDecl
            ? `Declare variable '${stmt.varName}' and set it to ${JSON.stringify(val)}.`
            : `Update '${stmt.varName}' from ${JSON.stringify(prevVars[stmt.varName] ?? "undefined")} to ${JSON.stringify(val)}.`
        );
        break;
      }

      case "print": {
        const val = resolveExpr(stmt.content, variables);
        const out = String(val) + (stmt.newline ? "\n" : "");
        addStep(
          nextNode("output"),
          "output",
          stmt.raw,
          variables,
          prevVars,
          [],
          `Print "${String(val)}" to the console${stmt.newline ? " with a newline" : ""}.`,
          out
        );
        break;
      }

      case "if": {
        const result = evalCondition(stmt.condition, variables);
        addStep(
          nextNode("condition"),
          "condition",
          `if (${stmt.condition})`,
          variables,
          prevVars,
          [],
          `Check condition: ${stmt.condition}. It evaluates to ${result ? "TRUE" : "FALSE"}.`,
          "",
          result ? "true" : "false"
        );
        if (result) {
          execStatements(stmt.body);
        } else if (stmt.elseIfs && stmt.elseIfs.length > 0) {
          let handled = false;
          for (const ei of stmt.elseIfs) {
            const eiResult = evalCondition(ei.condition, variables);
            addStep(
              nextNode("condition"),
              "condition",
              `else if (${ei.condition})`,
              variables,
              prevVars,
              [],
              `Check else-if condition: ${ei.condition}. It evaluates to ${eiResult ? "TRUE" : "FALSE"}.`,
              "",
              eiResult ? "true" : "false"
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
        // Execute init
        const initStmt = parseStatement(tokenizeBody(stmt.init + ";"), 0);
        if (initStmt) execStatement(initStmt.stmt);

        let loopCount = 0;
        while (loopCount < MAX_LOOPS) {
          const condResult = evalCondition(stmt.condition, variables);
          addStep(
            nextNode("loop"),
            "loop-start",
            `for condition: ${stmt.condition}`,
            variables,
            { ...variables },
            [],
            `Loop check: ${stmt.condition} is ${condResult ? "TRUE - continue looping" : "FALSE - exit loop"}.`,
            "",
            condResult ? "true" : "false"
          );
          if (!condResult) break;

          execStatements(stmt.body);
          if (breakFlag) { breakFlag = false; break; }

          // Update
          const updateStmt = parseStatement(tokenizeBody(stmt.update + ";"), 0);
          if (updateStmt) execStatement(updateStmt.stmt);
          loopCount++;
          if (stepCounter >= MAX_STEPS) break;
        }
        break;
      }

      case "while": {
        let loopCount = 0;
        while (loopCount < MAX_LOOPS) {
          const condResult = evalCondition(stmt.condition, variables);
          addStep(
            nextNode("loop"),
            "loop-start",
            `while (${stmt.condition})`,
            variables,
            { ...variables },
            [],
            `While check: ${stmt.condition} is ${condResult ? "TRUE — enter loop body" : "FALSE — exit loop"}.`,
            "",
            condResult ? "true" : "false"
          );
          if (!condResult) break;
          execStatements(stmt.body);
          if (breakFlag) { breakFlag = false; break; }
          loopCount++;
          if (stepCounter >= MAX_STEPS) break;
        }
        break;
      }

      case "break": {
        breakFlag = true;
        addStep(
          nextNode("break"),
          "assign",
          "break;",
          variables,
          prevVars,
          [],
          "Break statement encountered — exit the current loop immediately."
        );
        break;
      }
    }
  }

  // Extract body of main method
  const mainMatch = code.match(/public\s+static\s+void\s+main[\s\S]*?\{([\s\S]*)\}/);
  const body = mainMatch ? mainMatch[1] : code;

  // Apply custom inputs
  const inputDefaults: Record<string, number> = {};
  for (const [k, v] of Object.entries(customInputs)) {
    inputDefaults[k] = typeof v === "string" ? parseFloat(v) || 0 : v;
  }

  // Start step
  addStep(nextNode("start"), "start", "// Program Start", {}, {}, [], "The program begins execution. The Java Virtual Machine starts running the main method.");

  try {
    const stmts = parseBody(body);

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
    };
  }

  // End step
  addStep(nextNode("end"), "end", "// Program End", variables, variables, [], `The program has completed execution. Final output:\n${accOutput || "(no output)"}`);

  return { steps, finalOutput: accOutput, variables };
}
