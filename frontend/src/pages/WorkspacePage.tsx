import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward,
  Info, Layers, Terminal, Table, Search, X, SlidersHorizontal,
  RefreshCw, BookMarked, Lightbulb, CheckCircle2, Database,
  Code, GitBranch, Maximize2, Minimize2,
  ChevronDown, Sparkles, ChevronsRight, Orbit, Heart, Share2
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { simulate, ExecutionStep } from "@/engines/simulate/simulationEngine";
import { JavaEditor } from "@/components/JavaEditor";
import { ExecutionTimeline } from "@/components/ExecutionTimeline";
import { MemoryVisualizer } from "@/components/MemoryVisualizer";
import { LoopTraceTable } from "@/components/LoopTraceTable";
import { ModuleTree } from "@/components/ModuleTree";
import { FinalCheckPanel } from "@/components/FinalCheckPanel";
import { FlowchartVisualizer } from "@/components/FlowchartVisualizer";
import { CATEGORIES, SAMPLE_PROGRAMS } from "@/data/samplePrograms";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetTraces, useCreateTrace, useGetFavorites, useAddFavorite, useRemoveFavorite 
} from "@workspace/api-client-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";

// Stubs removed

const CATEGORY_COLORS: Record<string, string> = {
  "Basic I/O & Math": "text-blue-500",
  "Conditionals": "text-purple-500",
  "Loops": "text-green-500",
  "Number Logic": "text-orange-500",
  "Pattern Programs": "text-yellow-500",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  intermediate: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  advanced: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

export default function WorkspacePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location] = useLocation();
  const { 
    simResult, activeStep, isRunning, autoPlay, selectedProgram, customInputs,
    setSimResult, setActiveStep, setIsRunning, setAutoPlay, setSelectedProgram, setCustomInputs,
    nextStep, prevStep, goToStep
  } = useWorkspaceStore();

  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: traces = [], refetch: refetchTraces } = useGetTraces();
  const { data: favorites = [], refetch: refetchFavorites } = useGetFavorites();
  const createTrace = useCreateTrace();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editorSize, setEditorSize] = useState({ width: 384, height: 320 });
  const [isResizing, setIsResizing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredPrograms = useMemo(() => {
    return SAMPLE_PROGRAMS.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (!selectedProgram && filteredPrograms.length > 0) {
      setSelectedProgram(filteredPrograms[0]);
    }
  }, []);

  // Handle Shared Traces
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareSlug = params.get("share");
    if (shareSlug) {
      toast({ title: "Loading shared trace...", description: "Fetching shared logic from the cloud." });
      // In a real app, you'd use useGetTraceBySlug hook
      // For now, we'll simulate the fetch or use a fetch call
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/traces/share/${shareSlug}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setSelectedProgram({
            id: -1, // Virtual ID
            name: data.title,
            category: data.category,
            subtype: data.subtype,
            code: data.code,
            description: "Shared logic trace",
            difficulty: "intermediate",
            featured: false,
            tags: []
          } as any);
          
          if (data.customInputs) {
            setCustomInputs(data.customInputs);
          }
          
          // Trigger simulation
          const result = simulate(data.code, data.customInputs || {});
          setSimResult(result);
          toast({ title: "Shared Trace Loaded", description: `Viewing logic by another user: ${data.title}` });
        })
        .catch(err => {
          toast({ title: "Failed to load", description: err.message, variant: "destructive" });
        });
    }
  }, [location]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        setAutoPlay(false);
        nextStep();
      } else if (e.key === "ArrowLeft") {
        setAutoPlay(false);
        prevStep();
      } else if (e.key === " ") {
        e.preventDefault();
        setAutoPlay(!autoPlay);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [simResult, autoPlay, nextStep, prevStep]);

  useEffect(() => {
    let interval: any;
    if (autoPlay && simResult) {
      interval = setInterval(() => {
        if (activeStep >= simResult.steps.length - 1) {
          setAutoPlay(false);
        } else {
          nextStep();
        }
      }, 1000); // Slower for flowchart animation
    }
    return () => clearInterval(interval);
  }, [autoPlay, simResult, activeStep, nextStep]);

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = editorSize.width;
    const startHeight = editorSize.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(window.innerWidth - 100, startWidth - (moveEvent.pageX - startX)));
      const newHeight = Math.max(160, Math.min(window.innerHeight - 200, startHeight + (moveEvent.pageY - startY)));
      setEditorSize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleRun = useCallback(() => {
    if (!selectedProgram) return;
    setIsRunning(true);
    setAutoPlay(false);
    try {
      const inputs: Record<string, number> = {};
      Object.entries(customInputs).forEach(([k, v]) => {
        const num = parseFloat(v);
        if (!isNaN(num)) inputs[k] = num;
      });
      const result = simulate(selectedProgram.code, inputs);
      setSimResult(result);
      toast({ title: "Analysis Complete", description: "Flowchart generated successfully." });
    } catch (err) {
      toast({ title: "Simulation error", description: String(err), variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }, [selectedProgram, customInputs, setSimResult, setIsRunning, setAutoPlay, toast]);

  const selectProgram = (prog: any) => {
    setSelectedProgram(prog);
    const defaults: Record<string, string> = {};
    if (prog.defaultInputs) {
      Object.entries(prog.defaultInputs).forEach(([k, v]) => { defaults[k] = String(v); });
    }
    setCustomInputs(defaults);
    setSimResult(null);
  };

  const currentStep: ExecutionStep | null = simResult?.steps[activeStep] ?? null;
  const totalSteps = simResult?.steps.length ?? 0;

  return (
    <div className="h-[calc(100vh-56px)] bg-background flex flex-col overflow-hidden">
      {/* Dynamic Header */}
      <div className="h-auto min-h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between shrink-0 z-30 gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            {isMobile ? (
              <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-all">
                    <Layers className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-background border-r border-border">
                  <div className="h-full flex flex-col">
                    <SheetHeader className="p-6 border-b border-border">
                      <SheetTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Algorithm Library</SheetTitle>
                    </SheetHeader>
                    <SidebarContent 
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      filteredPrograms={filteredPrograms}
                      selectedProgram={selectedProgram}
                      selectProgram={(p) => {
                        selectProgram(p);
                        setMobileSidebarOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-all">
                <Layers className="h-4 w-4" />
              </Button>
            )}
            {selectedProgram && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-black tracking-tight uppercase truncate max-w-[120px] sm:max-w-none">{selectedProgram.name}</span>
                  {!isMobile && (
                    <Badge variant="outline" className={cn("text-[9px] uppercase font-black", DIFFICULTY_BADGE[selectedProgram.difficulty])}>
                      {selectedProgram.difficulty}
                    </Badge>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-widest truncate">{selectedProgram.category}</span>
              </div>
            )}
          </div>
          
          {isMobile && (
            <Button 
              size="sm" 
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground gap-2 font-bold text-[10px] shadow-lg shadow-primary/25"
              onClick={handleRun}
              disabled={isRunning || !selectedProgram}
            >
              {isRunning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              {simResult ? "Trace" : "Build"}
            </Button>
          )}
        </div>

        {/* Playback Controls - Scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 justify-center sm:justify-start">
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-play toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-9 w-9 p-0 rounded-xl border-white/10 bg-[#1a1a2e] backdrop-blur-md transition-all",
                autoPlay ? "text-primary border-primary/30" : "text-white/60"
              )}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Orbit className="h-3.5 w-3.5" />}
            </Button>

            <div className="flex items-center gap-1.5 bg-muted/20 p-1 rounded-2xl border border-border/50 shrink-0">
              <Button 
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg text-white/60 hover:text-white"
                onClick={() => goToStep(0)}
                disabled={!simResult || activeStep === 0}
              >
                <SkipBack className="h-3.5 w-3.5" />
              </Button>

              <Button 
                variant="ghost"
                size="sm" 
                className="h-7 px-2 rounded-lg text-white/80 gap-1.5 font-bold text-[10px] hover:text-white"
                onClick={() => prevStep()}
                disabled={!simResult || activeStep === 0}
              >
                <Sparkles className="h-3 w-3" />
                {!isMobile && "Step Back"}
              </Button>

              <div className="w-px h-4 bg-border/40 mx-0.5" />

              <Button 
                variant="ghost"
                size="sm" 
                className="h-7 px-2 rounded-lg text-primary gap-1.5 font-bold text-[10px] hover:bg-primary/10"
                onClick={() => nextStep()}
                disabled={!simResult || activeStep >= totalSteps - 1}
              >
                {!isMobile && "Step Forward"}
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>

              <Button 
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg text-white/60 hover:text-white"
                onClick={() => goToStep(totalSteps - 1)}
                disabled={!simResult || activeStep >= totalSteps - 1}
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="h-6 w-px bg-border/30 mx-1 shrink-0" />

          {!isMobile && (
            <Button 
              size="sm" 
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground gap-2 font-bold text-[10px] shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
              onClick={handleRun}
              disabled={isRunning || !selectedProgram}
            >
              {isRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {simResult ? "Re-Analyze" : "Build Flowchart"}
            </Button>
          )}

          {/* Save/Favorite Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-xl border-white/10 bg-[#1a1a2e] transition-all",
                favorites.some(f => f.programId === selectedProgram?.id) ? "text-pink-500 border-pink-500/30 bg-pink-500/5" : "text-white/60"
              )}
              onClick={() => {
                if (!selectedProgram) return;
                const fav = favorites.find(f => f.programId === selectedProgram.id);
                if (fav) {
                  removeFavorite.mutate({ id: fav.id }, { onSuccess: () => refetchFavorites() });
                } else {
                  addFavorite.mutate({
                    data: {
                      programId: selectedProgram.id,
                      programName: selectedProgram.name,
                      programCategory: selectedProgram.category
                    }
                  }, { onSuccess: () => refetchFavorites() });
                }
              }}
            >
              <Heart className={cn("h-3.5 w-3.5", favorites.some(f => f.programId === selectedProgram?.id) && "fill-current")} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl border-white/10 bg-[#1a1a2e] text-white/80 gap-1.5 font-bold text-[10px] transition-all"
              onClick={() => {
                if (!selectedProgram || !simResult) return;
                setIsSaving(true);
                createTrace.mutate({
                  data: {
                    title: selectedProgram.name,
                    category: selectedProgram.category,
                    subtype: selectedProgram.subtype,
                    code: selectedProgram.code,
                    customInputs: customInputs as any,
                    traceSummary: simResult.summary,
                    finalOutput: currentStep?.accumulatedOutput || ""
                  }
                }, {
                  onSuccess: () => {
                    setIsSaving(false);
                    toast({ title: "Trace Saved", description: "Saved to Recent Saves." });
                    refetchTraces();
                  },
                  onError: () => setIsSaving(false)
                });
              }}
              disabled={!simResult || isSaving}
            >
              {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <BookMarked className="h-3 w-3" />}
              Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl border-white/10 bg-[#1a1a2e] text-primary transition-all"
              onClick={() => {
                if (!selectedProgram || !simResult) return;
                
                const publishAndCopy = (id: number) => {
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/traces/${id}/publish`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  })
                  .then(res => res.json())
                  .then(data => {
                    const url = `${window.location.origin}/workspace?share=${data.shareSlug}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Link Copied!", description: "Anyone can view your trace." });
                  });
                };

                setIsSaving(true);
                createTrace.mutate({
                  data: {
                    title: selectedProgram.name,
                    category: selectedProgram.category,
                    subtype: selectedProgram.subtype,
                    code: selectedProgram.code,
                    customInputs: customInputs as any,
                    traceSummary: simResult.summary,
                    finalOutput: currentStep?.accumulatedOutput || ""
                  }
                }, {
                  onSuccess: (data) => {
                    setIsSaving(false);
                    publishAndCopy(data.id);
                  },
                  onError: () => setIsSaving(false)
                });
              }}
              disabled={!simResult || isSaving}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-80 border-r border-border/40 bg-[#0a0a0b]/50 backdrop-blur-3xl flex flex-col shrink-0 z-20 transition-all duration-500">
            <div className="p-6 border-b border-border/40 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Algorithm Library</h2>
                <p className="text-xs text-white/40">Select a logic pattern to visualize</p>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter logic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-xs bg-white/5 border-white/5 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["All", ...CATEGORIES.map(c => c.name)].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      selectedCategory === cat 
                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {cat.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {filteredPrograms.map(prog => (
                  <button
                    key={prog.id}
                    onClick={() => selectProgram(prog)}
                    className={cn(
                      "w-full text-left rounded-2xl p-4 transition-all relative overflow-hidden group",
                      selectedProgram?.id === prog.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-white/[0.03] border border-transparent"
                    )}
                  >
                    {selectedProgram?.id === prog.id && (
                      <motion.div 
                        layoutId="activeSide"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <div className={cn(
                        "text-[11px] font-black uppercase tracking-tight transition-colors",
                        selectedProgram?.id === prog.id ? "text-primary" : "text-white/70 group-hover:text-white"
                      )}>
                        {prog.name}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter opacity-60")}>
                          {prog.category}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[8px] h-4 px-1.5 font-black uppercase border-none",
                            prog.difficulty === "beginner" ? "bg-emerald-500/10 text-emerald-500" :
                            prog.difficulty === "intermediate" ? "bg-amber-500/10 text-amber-500" :
                            "bg-rose-500/10 text-rose-500"
                          )}
                        >
                          {prog.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}


        {/* Visualization Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/5 relative">
          <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="flex-1">
            <ResizablePanel defaultSize={isMobile ? 60 : 75} minSize={30} className="relative">
              <div className="absolute inset-0 z-0">
                {simResult ? (
                  <FlowchartVisualizer />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20 animate-pulse">
                      <GitBranch className="h-10 w-10 text-primary/40" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-widest">Ready to Visualize</h3>
                      <p className="text-xs font-medium italic opacity-60 max-w-xs">Select a program and click 'Build Flowchart' to see the execution flow.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Panels over Flowchart */}
              <div 
                className={cn(
                  "absolute flex flex-col gap-4 z-10 transition-all",
                  isMobile ? "bottom-4 left-4 right-4 top-auto w-auto" : "top-6 right-6"
                )}
                style={!isMobile ? { width: editorSize.width } : {}}
              >
                {/* Minimal Editor Toggle */}
                <div className={cn(
                  "bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden transition-all",
                  isResizing ? "ring-2 ring-primary/50" : "",
                  isMobile && !showEditor ? "h-12" : ""
                )}>
                  <div className="p-2.5 sm:p-3 bg-muted/50 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">Code View</span>
                        {selectedProgram && (
                          <span className="text-[8px] text-muted-foreground font-mono mt-0.5 truncate">{selectedProgram.name}.java</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-white/5" onClick={() => setShowEditor(!showEditor)}>
                      {showEditor ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {showEditor && (
                    <div 
                      className="bg-background relative group"
                      style={{ height: isMobile ? "200px" : editorSize.height }}
                    >
                      {selectedProgram && (
                        <JavaEditor 
                          code={selectedProgram.code} 
                          highlightLine={currentStep?.lineNumber} 
                          width={isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 48 : 300) : editorSize.width}
                          height={isMobile ? 200 : editorSize.height}
                        />
                      )}
                      
                      {!isMobile && (
                        /* Resize Handle */
                        <div 
                          onMouseDown={handleResize}
                          className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-20 flex items-end justify-start p-1 group-hover:bg-primary/5 transition-colors rounded-tr-xl"
                        >
                          <div className="w-1.5 h-1.5 border-b-2 border-l-2 border-white/20 group-hover:border-primary/50" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* State Analysis Summary - Hidden on mobile if editor is open to save space */}
                {currentStep && (!isMobile || !showEditor) && (
                  <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 sm:p-4 animate-in slide-in-from-right duration-500 max-h-[120px] overflow-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Execution Info</span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold leading-relaxed">{currentStep.description}</p>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Partitioned Lower Panel */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full bg-card border-t border-border flex flex-col">
                <div className="px-6 h-10 border-b border-border bg-muted/20 flex items-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Execution Workspace</span>
                </div>
                
                <div className="flex-1 min-h-0">
                  <ResizablePanelGroup direction="horizontal">
                    {/* Console Section */}
                    <ResizablePanel defaultSize={33} minSize={15} maxSize={60}>
                      <div className="h-full flex flex-col border-r border-border/40">
                        <div className="px-4 py-2 border-b border-border/40 bg-black/20 flex items-center gap-2">
                          <Terminal className="h-3 w-3 text-emerald-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Console</span>
                        </div>
                        <div className="flex-1 p-4 bg-black/5 overflow-auto custom-scrollbar">
                          <pre className="font-mono text-[11px] leading-relaxed text-emerald-500/90 whitespace-pre-wrap">
                            {currentStep?.accumulatedOutput || "(Output will appear here...)"}
                            <span className="inline-block w-1.5 h-3 bg-emerald-500/50 animate-pulse ml-1" />
                          </pre>
                        </div>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Iteration Table Section */}
                    <ResizablePanel defaultSize={34} minSize={20} maxSize={70}>
                      <div className="h-full flex flex-col border-r border-border/40">
                        <div className="px-4 py-2 border-b border-border/40 bg-black/20 flex items-center gap-2">
                          <Table className="h-3 w-3 text-primary" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Iteration Table</span>
                        </div>
                        <div className="flex-1 min-h-0">
                          <LoopTraceTable />
                        </div>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Memory Section */}
                    <ResizablePanel defaultSize={33} minSize={15} maxSize={60}>
                      <div className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b border-border/40 bg-black/20 flex items-center gap-2">
                          <Database className="h-3 w-3 text-amber-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">Full Memory</span>
                        </div>
                        <div className="flex-1 min-h-0">
                          <MemoryVisualizer />
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
