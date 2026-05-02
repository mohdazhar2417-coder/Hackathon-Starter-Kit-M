import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Code2, GitBranch, RefreshCw, Zap, BookOpen, BarChart3, ChevronRight, Play } from "lucide-react";

const features = [
  {
    icon: <Play className="h-5 w-5" />,
    title: "Step-by-Step Execution",
    description: "Watch your Java code execute one statement at a time. Navigate forward, backward, and see exactly what the computer does.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Interactive Flow Graph",
    description: "A live React Flow visualization shows the control flow — if/else branches, loop iterations, and decision paths — as it happens.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Live Variable Tracker",
    description: "See every variable's value change in real time. Know exactly what 'sum', 'i', or 'reversed' holds at each step.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Teacher-Mode Explanations",
    description: "Each step explains what happened, why it happened, and what comes next — like having a tutor walk you through the code.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Custom Input Support",
    description: "Change n, num, a, b — any input variable — and re-trace to see how different inputs affect the execution path.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "30+ Sample Programs",
    description: "A curated library of beginner Java programs across 5 categories, all ready to trace. From Hello World to Fibonacci.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
];

const categories = [
  { name: "Basic I/O & Math", count: 6, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { name: "Conditionals", count: 6, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { name: "Loops", count: 6, color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { name: "Number Logic", count: 7, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { name: "Pattern Programs", count: 5, color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
];

const codeSnippet = `public class EvenOdd {
  public static void main(String[] args) {
    int num = 7;
    if (num % 2 == 0) {
      System.out.println(num + " is Even");
    } else {
      System.out.println(num + " is Odd");
    }
  }
}`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-xs gap-1.5">
                <Zap className="h-3 w-3" />
                Powered by TraceWise AI
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-6">
                See how your{" "}
                <span className="text-primary">Java code</span>{" "}
                actually thinks
              </h1>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed max-w-lg">
                You can memorize syntax. But do you understand <em>why</em> the output is what it is?
              </p>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-lg">
                LogicLens turns beginner Java programs into interactive execution stories — step by step, variable by variable, with real explanations at every decision point.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg" className="gap-2" data-testid="hero-get-started">
                    Start Tracing Free
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/workspace">
                  <Button size="lg" variant="outline" className="gap-2" data-testid="hero-try-demo">
                    <Play className="h-4 w-4" />
                    Try a Demo
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Demo credentials: student@logiclens.dev / student123
              </p>
            </div>

            {/* Code preview */}
            <div className="relative">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">EvenOdd.java</span>
                </div>
                <pre className="code-editor p-4 text-sm overflow-x-auto text-foreground/90">
                  <code>{codeSnippet}</code>
                </pre>
                <div className="border-t border-border bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-primary">Step 3 of 6 — Condition check</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check condition: <code className="text-primary font-mono">num % 2 == 0</code> → <code className="text-red-400 font-mono">7 % 2 = 1 ≠ 0</code> → FALSE
                  </p>
                </div>
              </div>
              {/* Floating variable tracker */}
              <div className="absolute -right-4 -bottom-4 rounded-lg border border-border bg-card p-3 shadow-xl w-48">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">VARIABLES</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">num</span>
                    <span className="text-amber-400 font-mono font-semibold">7</span>
                  </div>
                  <div className="flex justify-between text-xs bg-primary/5 rounded px-1">
                    <span className="text-primary font-mono">result</span>
                    <span className="text-primary font-mono font-semibold">Odd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium uppercase tracking-wider">
            5 Learning Categories
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${cat.color}`}
              >
                {cat.name}
                <span className="text-[10px] opacity-60">{cat.count} programs</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Everything you need to understand code</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not a static diagram. Not a simple syntax highlighter. A real execution environment that shows you the internals.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg} ${f.color} mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to understand your code?</h2>
          <p className="text-muted-foreground mb-8">
            Join LogicLens and start seeing what your programs actually do — not just what they output.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="cta-signup">
                Create Free Account
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="cta-login">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Built for CS students, bootcamp learners, and self-taught programmers.
          </p>
        </div>
      </section>
    </div>
  );
}
