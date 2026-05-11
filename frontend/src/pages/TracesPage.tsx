import { useEffect } from "react";
import { useGetTraces, useDeleteTrace } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { BookMarked, Trash2, Play, Calendar, Code2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORY_COLORS: Record<string, string> = {
  "Basic I/O & Math": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Conditionals": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Loops": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Number Logic": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Pattern Programs": "text-pink-400 bg-pink-400/10 border-pink-400/20",
};

export default function TracesPage() {
  const { toast } = useToast();
  useEffect(() => { document.title = "Saved Traces · LogicLens"; }, []);
  const { data: traces = [], refetch, isLoading } = useGetTraces();
  const deleteTrace = useDeleteTrace();

  const handleDelete = (id: number) => {
    deleteTrace.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Trace deleted", description: "The saved trace has been removed." });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete trace.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookMarked className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Saved Traces</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Your saved execution traces for revisiting and review.
            </p>
          </div>
          <Link href="/workspace">
            <Button size="sm" className="gap-2">
              <Play className="h-3.5 w-3.5" />
              New Trace
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : traces.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border">
                <BookMarked className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-2">No saved traces yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Trace a program in the Workspace, then save it to review the execution flow later.
              </p>
              <Link href="/workspace">
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Tracing
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {traces.map((trace) => (
              <Card key={trace.id} className="bg-card border-border hover:border-primary/30 transition-colors group" data-testid={`trace-${trace.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-sm text-foreground">{trace.title}</h3>
                        {trace.category && (
                          <Badge
                            className={`text-[10px] px-1.5 border ${CATEGORY_COLORS[trace.category] ?? "text-muted-foreground"}`}
                            variant="outline"
                          >
                            {trace.category}
                          </Badge>
                        )}
                        {trace.subtype && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {trace.subtype}
                          </Badge>
                        )}
                      </div>
                      {trace.traceSummary && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{trace.traceSummary}</p>
                      )}
                      {trace.finalOutput && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Code2 className="h-3 w-3" />
                          <span className="font-mono truncate max-w-xs">{trace.finalOutput.trim().slice(0, 60)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{trace.savedAt ? new Date(trace.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown date"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/workspace?subtype=${trace.subtype}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Play className="h-3 w-3" />
                          Re-trace
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            data-testid={`delete-trace-${trace.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete trace?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the saved trace "{trace.title}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(trace.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {traces.length} saved trace{traces.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
