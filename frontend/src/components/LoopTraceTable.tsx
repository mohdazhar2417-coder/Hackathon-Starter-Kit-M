import React from 'react';
import { ExecutionStep } from '@/engines/simulate/simulationEngine';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { cn } from "@/lib/utils";

export const LoopTraceTable: React.FC = () => {
  const { simResult, activeStep } = useWorkspaceStore();
  
  if (!simResult) return null;

  // Group steps by iteration, only up to the current active step
  const iterations: Record<number, any> = {};
  simResult.steps.slice(0, activeStep + 1).forEach(step => {
    if (step.iteration !== undefined) {
      if (!iterations[step.iteration]) {
        iterations[step.iteration] = {
          iter: step.iteration,
          before: step.beforeState,
          after: step.afterState,
          vars: { ...step.afterState }
        };
      } else {
        // Update the 'after' state as we progress through the iteration
        iterations[step.iteration].after = step.afterState;
        iterations[step.iteration].vars = { ...iterations[step.iteration].vars, ...step.afterState };
      }
    }
  });

  const iterRows = Object.values(iterations);

  if (iterRows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic p-10 text-center">
        No loop iterations detected. Tracing logic must execute a loop to populate this table.
      </div>
    );
  }

  // Determine which variables to show (n, rem, reversed etc)
  const varNames = Array.from(new Set(simResult.steps.flatMap(s => Object.keys(s.afterState))))
    .filter(v => !["args", "scanner"].includes(v));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ScrollArea className="flex-1" orientation="both">
        <Table className="min-w-[400px]">
          <TableHeader className="bg-muted/80 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-[10px] font-black uppercase text-center border-r">Iter</TableHead>
              {varNames.map(v => (
                <TableHead key={v} className="text-center p-0 border-r last:border-r-0">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase pt-1">{v}</span>
                    <div className="grid grid-cols-2 divide-x border-t border-border/50">
                      <span className="text-[8px] py-0.5 text-muted-foreground">Before</span>
                      <span className="text-[8px] py-0.5 text-primary">After</span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {iterRows.map((row, idx) => {
              const isActive = simResult.steps[activeStep]?.iteration === row.iter;
              return (
                <TableRow 
                  key={idx} 
                  className={cn(
                    "group transition-colors",
                    isActive ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                >
                  <TableCell className="text-xs font-mono font-bold text-center border-r">
                    {row.iter}
                  </TableCell>
                  {varNames.map(v => (
                    <TableCell key={v} className="p-0 border-r last:border-r-0">
                      <div className="grid grid-cols-2 divide-x divide-border/30 h-full">
                        <div className="flex items-center justify-center py-2 text-[11px] font-mono text-muted-foreground italic">
                          {row.before[v] !== undefined ? String(row.before[v]) : "-"}
                        </div>
                        <div className={cn(
                          "flex items-center justify-center py-2 text-[11px] font-mono font-bold",
                          row.before[v] !== row.after[v] ? "text-emerald-500 bg-emerald-500/5" : "text-foreground"
                        )}>
                          {row.after[v] !== undefined ? String(row.after[v]) : "-"}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
