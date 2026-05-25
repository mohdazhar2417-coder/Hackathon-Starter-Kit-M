import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminGetPrograms, useAdminDeleteProgram, useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  Shield, Code2, Trash2, ChevronLeft, RefreshCw, Users, 
  BarChart3, Activity, Plus, Edit2, Search, TrendingUp,
  UserPlus, UserCheck, CreditCard, Clock
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from "recharts";
import { format } from "date-fns";

// Custom hooks for new admin endpoints
const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });
};

const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });
};

const useAdminActivity = () => {
  return useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activity", {
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    }
  });
};

const useAdminPayments = () => {
  return useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/upi-payments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    }
  });
};

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { document.title = "Admin Panel · LogicLens"; }, []);

  const { data: programs = [], isLoading: programsLoading, refetch: refetchPrograms } = useAdminGetPrograms();
  const { data: stats } = useAdminGetStats();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: analytics } = useAdminAnalytics();
  const { data: activity = [] } = useAdminActivity();
  const { data: payments = [] } = useAdminPayments();
  
  const approvePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/upi-payments/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to approve payment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      toast({ title: "Payment Approved", description: "The user has been upgraded successfully." });
    }
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/upi-payments/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to reject payment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      toast({ title: "Payment Rejected", description: "The payment status was updated to failed." });
    }
  });

  const deleteProgram = useAdminDeleteProgram();
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("logiclens_token")}` }
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User deleted", description: "The account has been permanently removed." });
    }
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            You are attempting to access a secure administrative area. Please return to your dashboard.
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="min-w-[200px]">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteProgram = (id: number, name: string) => {
    deleteProgram.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Program deleted", description: `"${name}" removed from library.` });
        refetchPrograms();
      }
    });
  };

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Command Center
              </h1>
            </div>
            <p className="text-muted-foreground">Strategic oversight for LogicLens platform operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/dashboard")} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Exit Admin
            </Button>
            <Button className="bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all">
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </div>
        </div>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Growth", value: stats?.totalUsers ?? "–", sub: "Total Active Users", icon: <Users className="h-5 w-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Activity", value: stats?.totalTraces ?? "–", sub: "Simulations Ran", icon: <Activity className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
            { label: "Library", value: programs.length, sub: "Sample Algorithms", icon: <Code2 className="h-5 w-5" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { label: "Retention", value: stats?.totalFavorites ?? "–", sub: "User Favorites", icon: <TrendingUp className="h-5 w-5" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          ].map((stat, i) => (
            <Card key={i} className={`bg-card/30 backdrop-blur-md ${stat.border} border border-white/5 overflow-hidden group`}>
              <CardContent className="p-6 relative">
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  {stat.icon}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10 p-1 h-auto grid grid-cols-5 w-full md:w-auto max-w-xl">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 text-xs">
              <Users className="h-3.5 w-3.5 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="programs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 text-xs">
              <Code2 className="h-3.5 w-3.5 mr-2" /> Programs
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 text-xs">
              <Activity className="h-3.5 w-3.5 mr-2" /> Activity
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-emerald-400" />
                    User Registration Trend
                  </CardTitle>
                  <CardDescription>New account signups over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.registrations || []}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#555" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                        itemStyle={{ color: "#10b981" }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorReg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Simulation Volume
                  </CardTitle>
                  <CardDescription>Total code traces executed globally</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.traceActivity || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#555" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                        itemStyle={{ color: "hsl(var(--primary))" }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-lg">User Accounts</CardTitle>
                  <CardDescription>Manage roles and plan access for all users</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 bg-white/5 border-white/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>User</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => (
                      <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={u.planType === 'pro' ? 'border-amber-500/50 text-amber-400 bg-amber-500/5' : 'text-muted-foreground'}>
                            {u.planType === 'pro' ? <CreditCard className="h-3 w-3 mr-1" /> : null}
                            {u.planType === 'pro' ? 'Pro Plan' : 'Free Tier'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={u.role === 'admin' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/10 text-white border-white/10'}>
                            {u.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : null}
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#111] border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Are you sure you want to delete {u.name}? This action is irreversible and will remove all their saved traces.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteUserMutation.mutate(u.id)}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Real-time Platform Activity</CardTitle>
                  <CardDescription>Live stream of code traces and simulations globally</CardDescription>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Live</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5 group hover:border-primary/30 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative z-10">
                        <Code2 className="h-5 w-5 text-primary" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.userName}</span>
                          <span className="text-muted-foreground text-xs">traced</span>
                          <span className="text-primary text-xs font-mono">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-4 py-0">{item.category}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.savedAt), "HH:mm:ss")}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Trace
                      </Button>
                    </div>
                  ))}
                  {activity.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p>No platform activity recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Programs Tab (Original refined) */}
          <TabsContent value="programs" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">Algorithm Library</CardTitle>
                  <CardDescription>Central repository of educational sample programs</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchPrograms()} className="text-xs gap-2">
                  <RefreshCw className={`h-3.5 w-3.5 ${programsLoading ? 'animate-spin' : ''}`} />
                  Sync Library
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>Algorithm Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead className="text-right">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((prog) => (
                      <TableRow key={prog.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-medium text-sm text-white/90">{prog.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10 text-[10px]">
                            {prog.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            prog.difficulty === "beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : prog.difficulty === "intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {prog.difficulty.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive group">
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#111] border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Algorithm?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{prog.name}" will be removed from the public library. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProgram(prog.id, prog.name)} className="bg-destructive text-white hover:bg-destructive/90">
                                    Remove Program
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-lg">Payment Transactions</CardTitle>
                  <CardDescription>Review and approve manual or gateway payments</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Payment Request ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pay: any) => (
                      <TableRow key={pay.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white/90 text-sm">{pay.userName}</p>
                            <p className="text-xs text-muted-foreground">{pay.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {pay.planType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary font-bold">
                          ₹{pay.amount}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-white/70">
                          {pay.paymentMethod.replace("upi_", "UPI ").toUpperCase()}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-white/50">
                          {pay.paymentRequestId}
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pay.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : pay.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}>
                            {pay.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-white/60">
                          {format(new Date(pay.createdAt), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          {pay.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approvePaymentMutation.mutate(pay.id)}
                                className="h-7 text-xs bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 font-bold"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectPaymentMutation.mutate(pay.id)}
                                className="h-7 text-xs bg-red-500/10 border-red-500/20 hover:bg-red-50 hover:text-white text-red-400 font-bold"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                              Verified
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-10" />
                          <p>No transactions registered in the database.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
