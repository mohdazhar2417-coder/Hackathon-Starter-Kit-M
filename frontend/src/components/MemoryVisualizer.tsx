import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { cn } from "@/lib/utils";
import { Box, Layers, Database } from "lucide-react";
import { motion } from "framer-motion";

export const MemoryVisualizer: React.FC = () => {
  const { simResult, activeStep } = useWorkspaceStore();
  
  const currentStep = simResult?.steps[activeStep];
  if (!currentStep) return null;

  const variables = currentStep.afterState;
  const changedVars = new Set(currentStep.stateChanges.map(sc => sc.varName));
  const varEntries = Object.entries(variables);

  return (
    <ScrollArea className="h-full bg-background/50">
      <div className="p-4 space-y-6">
        {/* Variables Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            <Box className="w-3 h-3 text-primary" />
            Active Variables
          </div>
          
          <div className="space-y-2">
            {varEntries.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic p-4 text-center border border-dashed rounded-lg bg-muted/20">
                No active variables in current scope
              </div>
            ) : (
              varEntries.map(([name, value]) => (
                <motion.div 
                  key={name}
                  layout
                  initial={false}
                  animate={changedVars.has(name) ? {
                    scale: [1, 1.05, 1],
                    backgroundColor: ["hsla(var(--primary), 0)", "hsla(var(--primary), 0.15)", "hsla(var(--primary), 0.05)"],
                    borderColor: ["hsla(var(--border), 1)", "hsla(var(--primary), 0.5)", "hsla(var(--primary), 0.2)"],
                  } : {
                    scale: 1,
                    backgroundColor: "hsla(var(--muted), 0.3)",
                    borderColor: "hsla(var(--border), 1)",
                  }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all shadow-sm"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">Variable</span>
                    <span className="font-mono text-sm font-bold text-foreground">{name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">Value</span>
                    <motion.span 
                      key={String(value)}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={cn(
                        "font-mono text-sm font-black",
                        typeof value === 'number' ? "text-blue-500" : "text-emerald-500"
                      )}
                    >
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                    </motion.span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Call Stack Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            <Layers className="w-3 h-3 text-primary" />
            Call Stack
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono font-bold text-primary">main()</span>
              <span className="text-[10px] text-muted-foreground">L{currentStep.lineNumber}</span>
            </div>
            <div className="p-2 rounded-md bg-muted/20 border border-transparent opacity-50">
              <span className="text-xs font-mono text-muted-foreground">JVM Startup</span>
            </div>
          </div>
        </div>

        {/* Heap Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            <Database className="w-3 h-3 text-primary" />
            Heap Space
          </div>
          <div className="p-6 text-center rounded-lg border border-dashed border-border bg-muted/10">
            <p className="text-[11px] text-muted-foreground italic">No heap objects allocated</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
