import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, AlertCircle, RefreshCw, GitBranch } from "lucide-react";

const NODE_THEMES = {
  start: { icon: Play, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  operation: { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  decision: { icon: GitBranch, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  loop: { icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  end: { icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

export const ExecutionNode = memo(({ data, selected }: NodeProps) => {
  const { label, codeLine, variables = {}, active = false, status, type } = data;
  const theme = NODE_THEMES[type as keyof typeof NODE_THEMES] || NODE_THEMES.operation;
  const Icon = theme.icon;

  const isDecision = type === "decision";

  return (
    <div className={cn(
      "group relative flex flex-col items-center",
      active ? "z-50" : "z-0"
    )}>
      {/* Node Container */}
      <div className={cn(
        "relative px-5 py-4 rounded-2xl border-2 transition-all duration-300 min-w-[220px] max-w-[300px]",
        "backdrop-blur-xl shadow-2xl",
        active 
          ? "bg-card border-primary ring-8 ring-primary/10 scale-110 -translate-y-2" 
          : cn("bg-card/90", theme.border),
        status === "completed" ? "opacity-100" : "opacity-80",
        isDecision && "rounded-[2rem]" // More rounded for decisions
      )}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-4 border-background" />
        
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter", theme.bg, theme.color)}>
              <Icon className="w-3 h-3" />
              {label}
            </div>
            {active && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Active
              </motion.div>
            )}
          </div>
          
          {/* Code Body */}
          <div className={cn(
            "font-mono text-xs font-bold leading-tight break-all p-3 rounded-xl",
            active ? "bg-primary/5 text-foreground" : "bg-muted/30 text-muted-foreground"
          )}>
            {codeLine}
          </div>

          {/* Variables - Only show if they exist and node is active/completed */}
          <AnimatePresence mode="popLayout">
            {Object.entries(variables).length > 0 && (status === "current" || status === "completed") && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                {Object.entries(variables).map(([name, value]: [string, any]) => (
                  <motion.div 
                    key={name}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between group/var"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/40 group-hover/var:bg-primary transition-colors" />
                      <span className="text-[10px] font-mono text-muted-foreground">{name}</span>
                    </div>
                    <motion.div 
                      key={`${name}-${value}`}
                      initial={{ scale: 1.2, color: "#3b82f6" }}
                      animate={{ scale: 1, color: "inherit" }}
                      className="px-2 py-0.5 rounded bg-muted/50 font-mono text-[11px] font-black text-foreground shadow-sm border border-border/50"
                    >
                      {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-4 border-background" />
        
        {/* Glow & Particles */}
        {active && (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut" 
              }}
              className={cn("absolute inset-[-15px] rounded-[2.5rem] -z-10 blur-2xl opacity-40")}
              style={{ backgroundColor: "hsla(var(--primary), 0.4)" }}
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-[2.5rem] border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] pointer-events-none" 
            />
          </>
        )}
      </div>

      {/* Decision Branch Labels */}
      {isDecision && (
        <div className="absolute -bottom-8 flex justify-between w-full px-2">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">True</span>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">False</span>
        </div>
      )}
    </div>
  );
});
