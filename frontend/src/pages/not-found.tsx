import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Code2, Home, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = "404 — Page Not Found · LogicLens";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Logo showText={false} iconSize={48} className="mb-6" />

      {/* 404 */}
      <p className="text-8xl font-black text-primary/20 font-mono leading-none mb-2 select-none">404</p>

      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
        This page doesn't exist or may have been moved. Try heading back to where you started.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={isAuthenticated ? "/dashboard" : "/"}>
          <Button className="gap-2 w-full sm:w-auto">
            <Home className="h-4 w-4" />
            {isAuthenticated ? "Go to Dashboard" : "Go to Home"}
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Hint */}
      <p className="mt-10 text-xs text-muted-foreground">
        LogicLens · TraceWise AI
      </p>
    </div>
  );
}
