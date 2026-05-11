import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StepCard } from "./StepCard";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { cn } from "@/lib/utils";

export const ExecutionTimeline: React.FC = () => {
  const { simResult, activeStep, goToStep } = useWorkspaceStore();

  if (!simResult || !simResult.steps) return null;

  const steps = simResult.steps.map((step, idx) => ({
    ...step,
    status: idx < activeStep ? "completed" : idx === activeStep ? "current" : "pending"
  })) as any[];

  return (
    <ScrollArea className="h-full bg-muted/5">
      <div className="p-6 relative min-h-full">
        {/* Continuous vertical line in background */}
        <div className="absolute left-[38px] top-10 bottom-10 w-0.5 bg-border -z-0" />
        
        <div className="space-y-2 relative z-10">
          {steps.map((step, idx) => (
            <div key={step.stepIndex} className="relative">
              {/* Node circle on the line */}
              <div className={cn(
                "absolute left-[-22px] top-6 w-3 h-3 rounded-full border-2 bg-background z-20 transition-all duration-300",
                activeStep === idx 
                  ? "border-primary scale-150 bg-primary shadow-lg shadow-primary/30" 
                  : idx < activeStep 
                    ? "border-emerald-500 bg-emerald-500" 
                    : "border-muted-foreground/30"
              )} />
              
              <StepCard
                step={step}
                isActive={activeStep === idx}
                onClick={() => goToStep(idx)}
              />
            </div>
          ))}
        </div>
        
        <div className="h-20" /> 
      </div>
    </ScrollArea>
  );
};
