import type { ExecutionStep } from "../simulate/simulationEngine";

export interface StepExplanation {
  what: string;
  why: string;
  next: string;
  commonMistake?: string;
}

export function explainStep(step: ExecutionStep, allSteps: ExecutionStep[]): StepExplanation {
  const { type, codeLine, variables, changedVariables, branchTaken } = step;
  const nextStep = allSteps[step.stepIndex + 1];

  switch (type) {
    case "start":
      return {
        what: "The program starts executing.",
        why: "Java programs begin from the main() method. The JVM loads the class and starts here.",
        next: nextStep ? `Next: ${nextStep.codeLine.trim()}` : "Program will end.",
      };

    case "end":
      return {
        what: "The program has finished executing.",
        why: "All statements in main() have been completed. The JVM exits.",
        next: "No more steps. Review the output above.",
        commonMistake: "Make sure all variables are initialized before use — accessing uninitialized variables causes errors.",
      };

    case "declare":
      return {
        what: `Variable '${changedVariables[0]}' is declared and initialized to ${JSON.stringify(variables[changedVariables[0]])}.`,
        why: `This creates a new memory slot called '${changedVariables[0]}' and stores the value in it. Think of it as labeling a box.`,
        next: nextStep ? `Next: execute '${nextStep.codeLine.trim()}'.` : "Program ends.",
        commonMistake: "Variables must be declared before they are used. Using a variable before declaring it causes a compile error.",
      };

    case "assign":
      if (changedVariables.length > 0) {
        const v = changedVariables[0];
        return {
          what: `Variable '${v}' is updated to ${JSON.stringify(variables[v])}.`,
          why: `The right-hand side expression was evaluated and the result was stored in '${v}', overwriting its previous value.`,
          next: nextStep ? `Next: '${nextStep.codeLine.trim()}'.` : "Program ends.",
          commonMistake: "Remember: = is assignment, not comparison. Use == to compare values.",
        };
      }
      return {
        what: `Statement executed: ${codeLine.trim()}`,
        why: "This statement performs an operation but does not change any tracked variable.",
        next: nextStep ? `Next: '${nextStep.codeLine.trim()}'.` : "Program ends.",
      };

    case "condition":
      return {
        what: `Condition '${codeLine.replace(/^.*?\(/, "").replace(/\)\s*$/, "")}' evaluated to ${branchTaken === "true" ? "TRUE" : "FALSE"}.`,
        why: branchTaken === "true"
          ? "The condition is satisfied, so the if-block will execute."
          : "The condition is not satisfied, so the else-block (or next statement) will execute.",
        next: branchTaken === "true"
          ? "Entering the if-block..."
          : "Skipping the if-block...",
        commonMistake: "Common mistake: confusing = (assignment) with == (equality check) inside conditions.",
      };

    case "loop-start":
      return {
        what: `Loop condition check: ${codeLine.trim()} → ${branchTaken === "true" ? "CONTINUE" : "EXIT"}.`,
        why: branchTaken === "true"
          ? "The loop condition is still true, so another iteration begins."
          : "The loop condition is false, so we exit the loop and continue to the next statement.",
        next: branchTaken === "true"
          ? "Executing loop body..."
          : "Exiting loop...",
        commonMistake: "Infinite loop warning: make sure the loop variable changes with each iteration, otherwise the loop never ends.",
      };

    case "output": {
      const outputVal = step.output.replace(/\n$/, "");
      return {
        what: `Output printed: "${outputVal}"`,
        why: "System.out.println() sends text to the console. This is how Java programs communicate results.",
        next: nextStep ? `Next: '${nextStep.codeLine.trim()}'.` : "Program ends.",
        commonMistake: 'println() adds a newline at the end. Use print() if you want output on the same line.',
      };
    }

    default:
      return {
        what: `Executing: ${codeLine.trim()}`,
        why: "This statement is part of the program logic.",
        next: nextStep ? `Next: '${nextStep.codeLine.trim()}'.` : "Program ends.",
      };
  }
}

export function explainFinalOutput(finalOutput: string, category: string): string {
  if (!finalOutput.trim()) return "This program produced no output.";
  return `The program completed successfully. The output "${finalOutput.trim()}" was produced by combining the results of all executed statements. This is a ${category} program — the output reflects the logic defined in the code.`;
}
