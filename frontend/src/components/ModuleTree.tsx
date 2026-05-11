import { ChevronDown, FileCode, PlayCircle } from "lucide-react";

export function ModuleTree({ code, programName }: { code: string; programName: string }) {
  // Simple regex to find method names
  const methodRegex = /(?:public|private|protected)?\s*(?:static)?\s*(?:[\w<>\[\]]+)\s+(\w+)\s*\(/g;
  const methods: string[] = [];
  let match;
  while ((match = methodRegex.exec(code)) !== null) {
    const name = match[1];
    if (!["if", "for", "while", "switch", "catch"].includes(name) && 
        !name.includes("print")) {
       if (!methods.includes(name)) methods.push(name);
    }
  }

  // Ensure 'main' is there if it's a java program
  if (!methods.includes("main") && code.includes("main")) methods.unshift("main");

  const className = programName ? programName.replace(/[^a-zA-Z0-9]/g, '') : "Program";

  return (
    <div className="flex flex-col h-full bg-card/40 border-t border-border overflow-hidden">
      <div className="p-2 border-b border-border bg-muted/30">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Structure</h3>
      </div>
      <div className="p-3 flex-1 overflow-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          <FileCode className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-foreground">{className}.java</span>
        </div>
        <div className="pl-6 space-y-1.5 border-l border-border/50 ml-2">
          {methods.map((method) => (
            <div key={method} className="flex items-center gap-2 group cursor-default relative">
              <div className="absolute -left-[9px] top-1/2 w-2 h-px bg-border/50"></div>
              <PlayCircle className={
                method === "main" 
                  ? "h-3.5 w-3.5 text-primary" 
                  : "h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors"
              } />
              <span className={
                method === "main"
                  ? "text-xs font-mono font-medium text-foreground"
                  : "text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors"
              }>
                {method}()
              </span>
            </div>
          ))}
          {methods.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic pl-2">No methods found</span>
          )}
        </div>
      </div>
    </div>
  );
}
