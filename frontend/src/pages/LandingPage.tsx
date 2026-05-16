import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code2, GitBranch, BarChart3, BookOpen, Zap, ChevronRight,
  Play, Terminal, ArrowRight, Check, Users, Star, Shield,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const STEPS = [
  {
    line: 3, label: "Declaration", type: "assignment",
    desc: "int num = 7",
    detail: "Variable 'num' is created in memory and assigned the value 7.",
    vars: { num: 7 },
    highlighted: "num",
  },
  {
    line: 4, label: "Condition check", type: "condition",
    desc: "num % 2 == 0",
    detail: "7 % 2 = 1, which is NOT 0 — the condition is FALSE.",
    vars: { num: 7 },
    highlighted: null,
  },
  {
    line: 7, label: "else branch", type: "branch",
    desc: "else { … }",
    detail: "The if-branch was skipped. Java jumps to the else block.",
    vars: { num: 7 },
    highlighted: null,
  },
  {
    line: 8, label: "Print", type: "output",
    desc: 'System.out.println("7 is Odd")',
    detail: 'Output: "7 is Odd" is printed to the console.',
    vars: { num: 7, result: "Odd" },
    highlighted: "result",
  },
];

const CODE_LINES = [
  'public class EvenOdd {',
  '  public static void main(String[] args) {',
  '    int num = 7;',
  '    if (num % 2 == 0) {',
  '      System.out.println(num + " is Even");',
  '    } else {',
  '      System.out.println(num + " is Odd");',
  '    }',
  '  }',
  '}',
];

const features = [
  {
    icon: <Play className="h-5 w-5" />,
    title: "Step-by-Step Execution",
    description: "Navigate through every statement — forward, backward, or jump to any step.",
    color: "text-primary", bg: "bg-primary/10",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Live Flow Graph",
    description: "A React Flow visualization shows if/else branches and loop iterations as they happen.",
    color: "text-emerald-400", bg: "bg-emerald-400/10",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Variable Tracker",
    description: "Watch every variable change in real time. See exactly what 'sum', 'i', or 'n' holds.",
    color: "text-amber-400", bg: "bg-amber-400/10",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Plain-English Explanations",
    description: "Each step says what happened, why it happened, and what comes next — like a tutor.",
    color: "text-cyan-400", bg: "bg-cyan-400/10",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Custom Inputs",
    description: "Change n, num, a, b — any variable — and re-trace to see how the path changes.",
    color: "text-pink-400", bg: "bg-pink-400/10",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "30+ Sample Programs",
    description: "A curated library across 5 categories, all ready to trace. From Hello World to Fibonacci.",
    color: "text-violet-400", bg: "bg-violet-400/10",
  },
];

const categories = [
  { name: "Basic I/O & Math", count: 6, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { name: "Conditionals", count: 6, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { name: "Loops", count: 6, color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { name: "Number Logic", count: 7, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { name: "Pattern Programs", count: 5, color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
];

const howItWorks = [
  {
    step: "01",
    title: "Choose a Java program",
    description: "Pick from 30+ beginner programs organized by concept — loops, conditionals, number logic, and more.",
    color: "text-primary",
  },
  {
    step: "02",
    title: "Hit Analyze & Trace",
    description: "TraceWise AI simulates execution on the client side — no server needed, instant results.",
    color: "text-emerald-400",
  },
  {
    step: "03",
    title: "Step through and understand",
    description: "Use arrow keys or the controls to move through each step. Variables, output, and explanations update live.",
    color: "text-amber-400",
  },
];

const educatorFeatures = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Classroom Oversight",
    description: "The Elite Admin Panel gives instructors a bird's-eye view of all student activity and progress.",
    color: "text-emerald-400", bg: "bg-emerald-400/10",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Performance Analytics",
    description: "Identify common logic pitfalls across your entire cohort with global trace analytics.",
    color: "text-primary", bg: "bg-primary/10",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Campus-Wide Licensing",
    description: "Easily onboard hundreds of students at once with institutional SSO and bulk seat management.",
    color: "text-amber-400", bg: "bg-amber-500/10",
  }
];

const testimonials = [
  {
    quote: "LogicLens has transformed how we teach loops. Students can finally 'see' the off-by-one errors that used to take hours to debug.",
    name: "Dr. Aris T.",
    role: "Head of CS Department",
    avatar: "A",
  },
  {
    quote: "I finally understood why my loop wasn't stopping — LogicLens showed me exactly which condition was false at each step.",
    name: "Sarah K.",
    role: "CS101 Student",
    avatar: "S",
  },
  {
    quote: "The variable tracker is a game changer. I can finally see what 'reversed' actually holds at each loop iteration.",
    name: "Priya M.",
    role: "Self-taught Programmer",
    avatar: "P",
  },
];

const TYPE_COLORS: Record<string, string> = {
  assignment: "text-blue-400",
  condition: "text-amber-400",
  branch: "text-purple-400",
  output: "text-emerald-400",
};

function AnimatedHero() {
  const [stepIdx, setStepIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setStepIdx((prev) => (prev + 1) % STEPS.length);
        setAnimating(false);
      }, 200);
    }, 2200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const step = STEPS[stepIdx];
  const activeLine = step.line;

  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl ring-1 ring-white/5">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">EvenOdd.java</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary font-medium">LIVE TRACE</span>
          </div>
        </div>

        {/* Code with highlighting */}
        <div className="code-editor text-sm p-0 overflow-hidden">
          {CODE_LINES.map((line, i) => (
            <div
              key={i}
              className={`flex gap-3 px-3 py-[3px] min-h-[1.65rem] transition-colors duration-300 ${
                activeLine === i + 1 ? "bg-primary/15 border-l-2 border-primary" : "border-l-2 border-transparent"
              }`}
            >
              <span className={`select-none text-right shrink-0 w-5 text-[11px] leading-6 ${activeLine === i + 1 ? "text-primary font-bold" : "text-muted-foreground/40"}`}>
                {i + 1}
              </span>
              <span className="whitespace-pre text-foreground/85 text-[12px] leading-6">{line}</span>
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <div className={`border-t border-border bg-muted/20 px-4 py-3 transition-opacity duration-200 ${animating ? "opacity-40" : "opacity-100"}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className={`text-xs font-semibold ${TYPE_COLORS[step.type] ?? "text-primary"}`}>
              Step {stepIdx + 1} of {STEPS.length} — {step.label}
            </span>
            <div className="ml-auto flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === stepIdx ? "w-4 bg-primary" : "w-1 bg-border"}`} />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
        </div>
      </div>

      {/* Floating variable card */}
      <div className={`absolute -right-4 top-8 rounded-lg border border-border bg-card/95 backdrop-blur p-3 shadow-xl w-44 transition-all duration-300 ${animating ? "opacity-60 scale-95" : "opacity-100 scale-100"}`}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Variables</p>
        <div className="space-y-1.5">
          {Object.entries(step.vars).map(([k, v]) => (
            <div key={k} className={`flex items-center justify-between rounded px-1.5 py-1 text-xs font-mono transition-colors ${step.highlighted === k ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted/30"}`}>
              <span className={step.highlighted === k ? "text-primary font-semibold" : "text-muted-foreground"}>{k}</span>
              <span className={step.highlighted === k ? "text-primary font-bold" : "text-foreground"}>{JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating output card */}
      {step.type === "output" && (
        <div className="absolute -left-4 -bottom-4 rounded-lg border border-emerald-500/30 bg-card/95 backdrop-blur p-3 shadow-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Terminal className="h-3 w-3 text-emerald-400" />
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Output</p>
          </div>
          <code className="text-xs font-mono text-emerald-300">7 is Odd</code>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.title = "LogicLens — See How Your Java Code Thinks";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <Badge variant="secondary" className="mb-5 text-xs gap-1.5 px-3 py-1">
                <Zap className="h-3 w-3 text-primary" />
                Powered by TraceWise AI
              </Badge>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                See how your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                  Java code
                </span>{" "}
                actually thinks
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                Stop guessing at output. LogicLens turns beginner Java programs into interactive
                execution stories — step by step, variable by variable, with real explanations
                at every decision point.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 px-6 text-base h-12 shadow-lg shadow-primary/20" data-testid="hero-get-started">
                    Start Tracing Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="gap-2 px-6 text-base h-12" data-testid="hero-signin">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {["No credit card required", "30+ programs ready", "Instant execution"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative pl-4 pt-4">
              <AnimatedHero />
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-b border-border bg-card/30 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Built for CS students & bootcamp learners</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>30+ Java programs across 5 categories</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant client-side tracing</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Simple to use</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Understand code in three steps</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No complex setup. No servers to spin up. Open a program, hit Trace, and learn.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative text-center sm:text-left">
                {i < howItWorks.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-border to-transparent -translate-y-1/2 z-0 pointer-events-none" />
                )}
                <div className={`text-5xl font-black ${item.color} opacity-20 mb-2 font-mono leading-none`}>{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground mb-6 font-semibold uppercase tracking-widest">
            5 Learning Categories · 30+ Programs
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link key={cat.name} href="/signup">
                <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${cat.color}`}>
                  {cat.name}
                  <span className="text-[10px] opacity-60">{cat.count} programs</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Educators Section */}
      <section className="py-24 bg-primary/[0.03] border-b border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                For Institutions
              </Badge>
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Empower your instructors. <br />
                <span className="text-muted-foreground">Standardize your curriculum.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                LogicLens isn't just a learning tool—it's an instructional powerhouse. 
                Provide your students with a consistent, visual framework for understanding 
                logic while giving your teachers the data they need to lead effectively.
              </p>
              <div className="space-y-6">
                {educatorFeatures.map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`h-10 w-10 shrink-0 rounded-lg ${f.bg} ${f.color} flex items-center justify-center border border-white/5`}>
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/pricing">
                  <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                    View Institutional Plans
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="bg-card/40 backdrop-blur-2xl border-white/10 overflow-hidden relative shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/70">Instructor Command Center</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Live Analytics</Badge>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Class Avg. Progress</p>
                        <p className="text-xl font-bold">87%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Common Pitfall</p>
                        <p className="text-xl font-bold text-amber-400">Nested Loops</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50" style={{ width: `${100 - i * 20}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to understand code</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not a static diagram. Not a simple highlighter. A real execution environment that shows you the internals.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
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

      {/* Testimonials */}
      <section className="py-24 border-t border-border bg-card/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex justify-center gap-0.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-3xl font-bold mb-3">Loved by learners</h2>
            <p className="text-muted-foreground">Students who finally got it</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-bold mb-4">Ready to understand your code?</h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Join LogicLens and start seeing what your programs actually do — not just what they output.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/20" data-testid="cta-signup">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base" data-testid="cta-login">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Demo credentials: student@logiclens.dev / student123
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo iconSize={28} />
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/login"><span className="hover:text-foreground transition-colors cursor-pointer">Sign In</span></Link>
              <Link href="/signup"><span className="hover:text-foreground transition-colors cursor-pointer">Get Started</span></Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} LogicLens. Built for learners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
