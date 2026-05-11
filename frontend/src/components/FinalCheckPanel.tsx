import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { cn } from "@/lib/utils";

export const FinalCheckPanel: React.FC = () => {
  const { simResult, activeStep } = useWorkspaceStore();
  
  if (!simResult || activeStep < simResult.steps.length - 1) return null;

  const lastStep = simResult.steps[simResult.steps.length - 1];
  const programName = "Palindrome"; // Could be dynamic
  
  // Logic to determine if it's a palindrome check for the demo
  const isPalindrome = lastStep.afterState.original === lastStep.afterState.reversed;
  const original = lastStep.afterState.original;
  const reversed = lastStep.afterState.reversed;

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-primary" />
        Final Validation
      </div>

      <div className="flex-1 flex flex-col justify-center items-center space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-lg flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border border-border">
            <span className="text-muted-foreground">original == reversed</span>
          </div>
          <div className="font-mono text-2xl font-bold flex items-center gap-3">
            <span>{String(original)}</span>
            <span className="text-primary">==</span>
            <span>{String(reversed)}</span>
            <span className="text-primary">→</span>
            <span className={isPalindrome ? "text-emerald-500" : "text-destructive"}>
              {isPalindrome ? "True" : "False"}
            </span>
          </div>
        </div>

        <div className={cn(
          "w-full py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all animate-in fade-in zoom-in duration-500",
          isPalindrome 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-500/10" 
            : "bg-destructive/10 border-destructive/20 text-destructive shadow-lg shadow-destructive/10"
        )}>
          {isPalindrome ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <XCircle className="w-12 h-12" />
          )}
          <h2 className="text-3xl font-black tracking-tight uppercase">
            {isPalindrome ? "Palindrome ✅" : "Not Palindrome ❌"}
          </h2>
          <p className="text-xs font-medium opacity-70">Program execution verified successfully</p>
        </div>
      </div>
    </div>
  );
};
