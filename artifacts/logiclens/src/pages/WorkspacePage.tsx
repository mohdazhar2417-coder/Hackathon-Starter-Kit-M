import { useState, useEffect, useCallback, useRef } from "react";
import { useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetPrograms, useCreateTrace, useAddFavorite, useRemoveFavorite, useGetFavorites,
} from "@workspace/api-client-react";
import { FlowCanvas } from "@/components/FlowCanvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { simulate } from "@/engines/simulate/simulationEngine";
import { explainStep } from "@/engines/explain/explainStep";
import { SAMPLE_PROGRAMS, CATEGORIES } from "@/data/samplePrograms";
import {
  Play, ChevronLeft, ChevronRight, SkipBack, SkipForward,
  BookMarked, Heart, Save, Code2, GitBranch, Terminal,
  Info, SlidersHorizontal, Search, RefreshCw, Layers, X,
} from "lucide-react";
import type { ExecutionStep, SimulationResult } from "@/engines/simulate/simulationEngine";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "Basic I/O & Math": "text-blue-400",
  "Conditionals": "text-purple-400",
  "Loops": "text-emerald-400",
  "Number Logic": "text-orange-400",
  "Pattern Programs": "text-pink-400",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

function VariableTable({ vars, changed }: { vars: Record<string, string | number | boolean>; changed: string[] }) {
  const entries = Object.entries(vars);
  if (entries.length === 0) return (
    <p className="text-xs text-muted-foreground text-center py-4">No variables tracked yet.</p>
  );
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={cn(
            "flex items-center justify-between rounded px-2 py-1.5 text-xs font-mono transition-colors",
            changed.includes(k) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"
          )}
        >
          <span className={changed.includes(k) ? "text-primary font-semibold" : "text-muted-foreground"}>{k}</span>
          <span className={changed.includes(k) ? "text-primary font-bold" : "text-foreground"}>
            {JSON.stringify(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CodeViewer({ code, highlightLine }: { code: string; highlightLine?: number }) {
  const lines = code.split("\n");
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (highlightLine && lineRefs.current[highlightLine - 1]) {
      lineRefs.current[highlightLine - 1]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightLine]);

  return (
    <div className="code-editor text-sm overflow-auto h-full">
      {lines.map((line, i) => (
        <div
          key={i}
          ref={(el) => { lineRefs.current[i] = el; }}
          className={cn(
            "flex gap-3 px-3 py-0.5 min-h-[1.6rem]",
            highlightLine === i + 1 ? "highlighted-line" : ""
          )}
        >
          <span className="select-none text-muted-foreground/40 text-right shrink-0 w-6">{i + 1}</span>
          <span className="whitespace-pre text-foreground/90">{line}</span>
        </div>
      ))}
    </div>
  );
}

type LocalProgram = (typeof SAMPLE_PROGRAMS)[0];

export default function WorkspacePage() {
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();

  const params = new URLSearchParams(search);
  const initialProgramId = params.get("program") ? parseInt(params.get("program")!) : null;
  const initialCategory = params.get("category") ?? "";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<LocalProgram | null>(
    initialProgramId ? (SAMPLE_PROGRAMS.find((p) => p.id === initialProgramId) ?? null) : null
  );
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [saveNotes, setSaveNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: programs = [] } = useGetPrograms();
  const { data: favorites = [], refetch: refetchFavorites } = useGetFavorites();
  const createTrace = useCreateTrace();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const allPrograms: LocalProgram[] = (programs.length > 0 ? programs : SAMPLE_PROGRAMS) as LocalProgram[];

  const isFavorite = selectedProgram
    ? favorites.some((f) => f.programId === selectedProgram.id)
    : false;

  const favoriteId = selectedProgram
    ? (favorites.find((f) => f.programId === selectedProgram.id)?.id ?? null)
    : null;

  const filteredPrograms = allPrograms.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = !searchQuery
      || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  useEffect(() => {
    if (selectedProgram && !simResult) {
      const defaults: Record<string, string> = {};
      if (selectedProgram.defaultInputs) {
        Object.entries(selectedProgram.defaultInputs).forEach(([k, v]) => {
          defaults[k] = String(v);
        });
      }
      setCustomInputs(defaults);
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (autoPlay && simResult) {
      autoPlayRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= simResult.steps.length - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 600);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [autoPlay, simResult]);

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
      setActiveStep(0);
    } catch (err) {
      toast({ title: "Simulation error", description: String(err), variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }, [selectedProgram, customInputs, toast]);

  const handleSaveTrace = () => {
    if (!simResult || !selectedProgram || !user) return;
    setIsSaving(true);
    createTrace.mutate(
      {
        data: {
          title: selectedProgram.name + (saveNotes ? ` — ${saveNotes}` : ""),
          category: selectedProgram.category,
          subtype: selectedProgram.subtype,
          code: selectedProgram.code,
          customInputs: customInputs as Record<string, unknown>,
          traceSummary: `${simResult.steps.length} steps. ${saveNotes}`.trim(),
          finalOutput: simResult.finalOutput,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Trace saved!", description: "View it in your Saved Traces." });
          setSaveNotes("");
          setIsSaving(false);
        },
        onError: () => {
          toast({ title: "Error saving trace", variant: "destructive" });
          setIsSaving(false);
        },
      }
    );
  };

  const handleToggleFavorite = () => {
    if (!selectedProgram || !user) return;
    if (isFavorite && favoriteId !== null) {
      removeFavorite.mutate(
        { id: favoriteId },
        {
          onSuccess: () => {
            toast({ title: "Removed from favorites" });
            refetchFavorites();
          },
        }
      );
    } else {
      addFavorite.mutate(
        {
          data: {
            programId: selectedProgram.id,
            programName: selectedProgram.name,
            programCategory: selectedProgram.category,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Added to favorites!" });
            refetchFavorites();
          },
        }
      );
    }
  };

  const selectProgram = (prog: LocalProgram) => {
    setSelectedProgram(prog);
    setSimResult(null);
    setActiveStep(0);
    setAutoPlay(false);
    const defaults: Record<string, string> = {};
    if (prog.defaultInputs) {
      Object.entries(prog.defaultInputs).forEach(([k, v]) => { defaults[k] = String(v); });
    }
    setCustomInputs(defaults);
  };

  const currentStep: ExecutionStep | null = simResult?.steps[activeStep] ?? null;
  const explanation = currentStep ? explainStep(currentStep, simResult!.steps) : null;
  const totalSteps = simResult?.steps.length ?? 0;
  const goTo = (i: number) => setActiveStep(Math.max(0, Math.min(i, totalSteps - 1)));
  const stepProgressPct = totalSteps > 1 ? (activeStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="h-[calc(100vh-56px)] bg-background flex overflow-hidden">
      {/* Left Sidebar */}
      {showSidebar && (
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSidebar(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {["All", ...CATEGORIES.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {cat === "All" ? "All" : cat.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredPrograms.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No programs found</p>
              ) : (
                filteredPrograms.map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => selectProgram(prog)}
                    data-testid={`program-item-${prog.id}`}
                    className={cn(
                      "w-full text-left rounded-md p-2.5 transition-colors group",
                      selectedProgram?.id === prog.id
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-xs font-medium", selectedProgram?.id === prog.id ? "text-primary" : "text-foreground")}>
                        {prog.name}
                      </span>
                      {prog.featured && <span className="text-[9px] text-amber-400">★</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[9px]", CATEGORY_COLORS[prog.category] ?? "text-muted-foreground")}>
                        {prog.category?.split(" ")[0]}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">·</span>
                      <span className={cn("text-[9px] capitalize",
                        prog.difficulty === "beginner" ? "text-emerald-400/70"
                          : prog.difficulty === "intermediate" ? "text-amber-400/70"
                          : "text-red-400/70"
                      )}>
                        {prog.difficulty}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/60 px-4 py-2 flex items-center gap-3 flex-wrap">
          {!showSidebar && (
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5" onClick={() => setShowSidebar(true)}>
              <Layers className="h-3.5 w-3.5" />
              <span className="text-xs">Programs</span>
            </Button>
          )}
          {selectedProgram ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{selectedProgram.name}</span>
              <Badge className={cn("text-[10px] px-1.5 border hidden sm:inline-flex", DIFFICULTY_BADGE[selectedProgram.difficulty] ?? "")} variant="outline">
                {selectedProgram.difficulty}
              </Badge>
              <span className={cn("text-[10px] hidden sm:block", CATEGORY_COLORS[selectedProgram.category] ?? "text-muted-foreground")}>
                {selectedProgram.category}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground flex-1">Select a program from the sidebar</span>
          )}

          <div className="flex items-center gap-2">
            {selectedProgram && user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 w-8 p-0", isFavorite ? "text-pink-400" : "text-muted-foreground")}
                  onClick={handleToggleFavorite}
                  data-testid="btn-favorite"
                >
                  <Heart className={cn("h-4 w-4", isFavorite ? "fill-pink-400" : "")} />
                </Button>
                {simResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1.5 text-xs text-muted-foreground"
                    onClick={handleSaveTrace}
                    disabled={isSaving}
                    data-testid="btn-save-trace"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleRun}
              disabled={!selectedProgram || isRunning}
              data-testid="btn-run"
            >
              {isRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {simResult ? "Re-trace" : "Analyze & Trace"}
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Code + Inputs */}
          <div className="flex flex-col w-[360px] flex-shrink-0 border-r border-border">
            {selectedProgram?.defaultInputs && (
              <div className="border-b border-border bg-card/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Input Variables</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedProgram.defaultInputs).map(([key, defaultVal]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <label className="text-xs font-mono text-muted-foreground shrink-0">{key} =</label>
                      <Input
                        type="number"
                        value={customInputs[key] ?? String(defaultVal)}
                        onChange={(e) => setCustomInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-20 h-7 text-xs font-mono bg-background"
                        data-testid={`input-var-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden bg-background/50">
              {selectedProgram ? (
                <CodeViewer code={selectedProgram.code} highlightLine={currentStep?.lineNumber} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                  <Code2 className="h-12 w-12 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">No program selected</p>
                    <p className="text-xs text-muted-foreground">Pick a Java program from the sidebar to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Flow Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            {simResult && (
              <div className="border-b border-border bg-card/40 px-4 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setAutoPlay(false); goTo(0); }}>
                    <SkipBack className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setAutoPlay(false); goTo(activeStep - 1); }} disabled={activeStep === 0}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={autoPlay ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs"
                    onClick={() => setAutoPlay(!autoPlay)}
                    disabled={activeStep >= totalSteps - 1}
                  >
                    {autoPlay ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    {autoPlay ? "Pause" : "Play"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setAutoPlay(false); goTo(activeStep + 1); }} disabled={activeStep >= totalSteps - 1}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setAutoPlay(false); goTo(totalSteps - 1); }}>
                    <SkipForward className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${stepProgressPct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {activeStep + 1} / {totalSteps}
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <FlowCanvas steps={simResult?.steps ?? []} activeStep={activeStep} onNodeClick={goTo} />
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-72 flex-shrink-0 border-l border-border flex flex-col">
            <Tabs defaultValue="explain" className="flex-1 flex flex-col">
              <TabsList className="rounded-none border-b border-border bg-card/60 h-9 px-2 justify-start gap-1">
                <TabsTrigger value="explain" className="h-7 text-xs gap-1 px-2">
                  <Info className="h-3 w-3" />
                  Explain
                </TabsTrigger>
                <TabsTrigger value="variables" className="h-7 text-xs gap-1 px-2">
                  <GitBranch className="h-3 w-3" />
                  Vars
                </TabsTrigger>
                <TabsTrigger value="output" className="h-7 text-xs gap-1 px-2">
                  <Terminal className="h-3 w-3" />
                  Output
                </TabsTrigger>
              </TabsList>

              <TabsContent value="explain" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {!simResult ? (
                      <div className="text-center py-8">
                        <Info className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Run a trace to see explanations</p>
                      </div>
                    ) : currentStep ? (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-5 w-5 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {activeStep + 1}
                            </div>
                            <span className="text-xs font-semibold">Step {activeStep + 1}</span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 ml-auto">{currentStep.type}</Badge>
                          </div>
                          <code className="text-xs font-mono text-primary block bg-primary/5 rounded px-2 py-1.5 border border-primary/10 break-all">
                            {currentStep.codeLine.trim()}
                          </code>
                        </div>
                        {explanation && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">What happened</p>
                              <p className="text-xs text-foreground leading-relaxed">{explanation.what}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why</p>
                              <p className="text-xs text-foreground leading-relaxed">{explanation.why}</p>
                            </div>
                            {explanation.commonMistake && (
                              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                                <p className="text-[10px] font-semibold text-amber-400 mb-1">Common Mistake</p>
                                <p className="text-xs text-amber-200/80">{explanation.commonMistake}</p>
                              </div>
                            )}
                            <div className="rounded-md bg-muted/30 px-3 py-2">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1">Next</p>
                              <p className="text-xs text-muted-foreground">{explanation.next}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="variables" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {!currentStep ? (
                      <div className="text-center py-8">
                        <GitBranch className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Run a trace to see variables</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Variables at Step {activeStep + 1}
                        </p>
                        <VariableTable vars={currentStep.variables} changed={currentStep.changedVariables} />
                        {currentStep.changedVariables.length > 0 && (
                          <p className="mt-3 text-[10px] text-muted-foreground">
                            Changed: {currentStep.changedVariables.map((v) => (
                              <code key={v} className="text-primary font-mono">{v} </code>
                            ))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="output" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Console Output</p>
                    {!simResult ? (
                      <div className="text-center py-8">
                        <Terminal className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Run a trace to see output</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md bg-background border border-border p-3 mb-4">
                          <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                            {currentStep?.accumulatedOutput || "(no output yet)"}
                          </pre>
                        </div>
                        {simResult.error && (
                          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                            <p className="text-xs text-destructive">{simResult.error}</p>
                          </div>
                        )}
                        <div className="mb-4">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Final Output</p>
                          <div className="rounded-md bg-background border border-border p-3">
                            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                              {simResult.finalOutput || "(no output)"}
                            </pre>
                          </div>
                        </div>
                        {user && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Save Trace</p>
                            <Input
                              placeholder="Add notes (optional)..."
                              value={saveNotes}
                              onChange={(e) => setSaveNotes(e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 gap-1.5 text-xs"
                              onClick={handleSaveTrace}
                              disabled={isSaving}
                              data-testid="btn-save-trace-output"
                            >
                              <BookMarked className="h-3.5 w-3.5" />
                              {isSaving ? "Saving..." : "Save Trace"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
