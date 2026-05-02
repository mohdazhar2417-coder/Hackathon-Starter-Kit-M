import { useAuth } from "@/contexts/AuthContext";
import { useAdminGetPrograms, useAdminDeleteProgram, useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Shield, Code2, Trash2, ChevronLeft, RefreshCw, Users, BarChart3 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: programs = [], isLoading: programsLoading, refetch: refetchPrograms } = useAdminGetPrograms();
  const { data: stats } = useAdminGetStats();
  const deleteProgram = useAdminDeleteProgram();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">You don't have admin privileges.</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleDeleteProgram = (id: number, name: string) => {
    deleteProgram.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Program deleted", description: `"${name}" has been removed.` });
          refetchPrograms();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete program.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-sm text-muted-foreground">Manage the program library and view platform stats</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Programs", value: stats?.totalPrograms ?? programs.length, icon: <Code2 className="h-4 w-4" />, color: "text-primary" },
            { label: "Total Users", value: stats?.totalUsers ?? "–", icon: <Users className="h-4 w-4" />, color: "text-emerald-400" },
            { label: "Total Traces", value: stats?.totalTraces ?? "–", icon: <BarChart3 className="h-4 w-4" />, color: "text-amber-400" },
            { label: "Total Favorites", value: stats?.totalFavorites ?? "–", icon: <Shield className="h-4 w-4" />, color: "text-purple-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                  {stat.icon}
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="programs">
          <TabsList className="mb-6">
            <TabsTrigger value="programs" className="gap-2">
              <Code2 className="h-3.5 w-3.5" /> Programs
            </TabsTrigger>
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base">Program Library</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => refetchPrograms()} className="gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {programsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((prog) => (
                        <TableRow key={prog.id} data-testid={`program-row-${prog.id}`}>
                          <TableCell className="font-medium text-sm">{prog.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {prog.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs capitalize ${
                              prog.difficulty === "beginner" ? "text-emerald-400"
                              : prog.difficulty === "intermediate" ? "text-amber-400"
                              : "text-red-400"
                            }`}>
                              {prog.difficulty}
                            </span>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  data-testid={`delete-program-${prog.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete program?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{prog.name}" from the library. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProgram(prog.id, prog.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
