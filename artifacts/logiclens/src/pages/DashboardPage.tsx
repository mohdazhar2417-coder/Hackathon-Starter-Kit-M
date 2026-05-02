import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetPrograms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPrograms, CATEGORIES } from "@/data/samplePrograms";
import {
  Code2, GitBranch, RefreshCw, Hash, Grid3X3, Calculator,
  Play, BookMarked, Heart, ChevronRight, Zap, Star,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Basic I/O & Math": <Calculator className="h-5 w-5" />,
  "Conditionals": <GitBranch className="h-5 w-5" />,
  "Loops": <RefreshCw className="h-5 w-5" />,
  "Number Logic": <Hash className="h-5 w-5" />,
  "Pattern Programs": <Grid3X3 className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Basic I/O & Math": "text-blue-400 bg-blue-400/10",
  "Conditionals": "text-purple-400 bg-purple-400/10",
  "Loops": "text-emerald-400 bg-emerald-400/10",
  "Number Logic": "text-orange-400 bg-orange-400/10",
  "Pattern Programs": "text-pink-400 bg-pink-400/10",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: programs = [] } = useGetPrograms();
  const featured = getFeaturedPrograms();

  const programsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    programs: programs.filter((p) => p.category === cat.name),
    count: programs.filter((p) => p.category === cat.name).length,
  }));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {greeting()}, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground text-sm">
                What Java concept would you like to explore today?
              </p>
            </div>
            <Link href="/workspace">
              <Button className="gap-2" data-testid="btn-open-workspace">
                <Play className="h-4 w-4" />
                Open Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Programs", value: programs.length || "30+", icon: <Code2 className="h-4 w-4" />, color: "text-primary" },
            { label: "Categories", value: "5", icon: <Zap className="h-4 w-4" />, color: "text-emerald-400" },
            { label: "Saved Traces", value: "–", icon: <BookMarked className="h-4 w-4" />, color: "text-amber-400" },
            { label: "Favorites", value: "–", icon: <Heart className="h-4 w-4" />, color: "text-pink-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                  {stat.icon}
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Programs */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-semibold">Featured Programs</h2>
            </div>
            <Link href="/workspace">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.slice(0, 6).map((prog) => (
              <Link key={prog.id} href={`/workspace?program=${prog.id}`}>
                <Card className="bg-card border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group" data-testid={`featured-program-${prog.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${CATEGORY_COLORS[prog.category] ?? "text-muted-foreground bg-muted"}`}>
                        {CATEGORY_ICONS[prog.category]}
                        {prog.category}
                      </div>
                      <Badge className={`text-[10px] px-1.5 border ${DIFFICULTY_BADGE[prog.difficulty]}`} variant="outline">
                        {prog.difficulty}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{prog.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-3 w-3" />
                      Trace this program
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* All Categories */}
        <section>
          <h2 className="text-base font-semibold mb-4">Browse by Category</h2>
          <div className="space-y-4">
            {programsByCategory.map((cat) => (
              <Card key={cat.name} className="bg-card border-border">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_COLORS[cat.name] ?? "text-muted-foreground bg-muted"}`}>
                        {CATEGORY_ICONS[cat.name]}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{cat.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <Link href={`/workspace?category=${encodeURIComponent(cat.name)}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                        Explore <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    {cat.programs.slice(0, 6).map((prog) => (
                      <Link key={prog.id} href={`/workspace?program=${prog.id}`}>
                        <button
                          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                          data-testid={`cat-program-${prog.id}`}
                        >
                          {prog.name}
                        </button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
