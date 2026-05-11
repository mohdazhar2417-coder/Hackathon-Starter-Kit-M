import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExecutionStep } from "@/engines/simulate/simulationEngine";
import { CheckCircle2, Clock, Circle } from "lucide-react";

interface StepCardProps {
  step: ExecutionStep;
  isActive: boolean;
  onClick: () => void;
}

export const StepCard: React.FC<StepCardProps> = ({ step, isActive, onClick }) => {
  const getStatusBadge = () => {
    const variants: Record<string, string> = {
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      current: "bg-primary/10 text-primary border-primary/20",
      pending: "bg-muted text-muted-foreground border-border"
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0", variants[step.status])}>
        {step.status}
      </Badge>
    );
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 border-l-4 overflow-hidden mb-4",
        isActive 
          ? "border-l-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20 scale-[1.01]" 
          : "border-l-transparent hover:border-l-muted-foreground/30",
        step.status === "completed" ? "opacity-70" : "opacity-100"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Step Number Circle */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
            isActive 
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30" 
              : "bg-background text-muted-foreground border-muted group-hover:border-primary/30"
          )}>
            {step.stepNumber}
          </div>

          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "text-sm font-bold tracking-tight",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {step.title}
              </h3>
              {getStatusBadge()}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-muted pl-2">
              {step.description}
            </p>

            {/* Execution Logic (Calculations) */}
            {step.calculations.length > 0 && (
              <div className="bg-muted/30 rounded-md p-2 space-y-1 font-mono text-[11px] border border-border/50">
                {step.calculations.map((calc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{calc.expr}</span>
                    <span className="text-primary">→</span>
                    <span className="text-foreground font-bold">{calc.result}</span>
                  </div>
                ))}
              </div>
            )}

            {/* State Change */}
            {step.stateChanges.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">State Change</div>
                <div className="grid grid-cols-1 gap-1">
                  {step.stateChanges.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-foreground w-20 truncate">{change.varName}:</span>
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">{change.before === undefined ? "undefined" : String(change.before)}</span>
                      <span className="text-primary font-bold">→</span>
                      <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 rounded">{String(change.after)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
