import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacePage from "@/pages/WorkspacePage";
import TracesPage from "@/pages/TracesPage";
import FavoritesPage from "@/pages/FavoritesPage";
import AdminPage from "@/pages/AdminPage";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;
  if (isAuthenticated) return null;
  return <>{children}</>;
}

function AppLayout({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background dark">
      {showNav && <Navbar />}
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <AppLayout>
            <LandingPage />
          </AppLayout>
        )}
      </Route>

      <Route path="/login">
        {() => (
          <AuthRoute>
            <div className="dark">
              <LoginPage />
            </div>
          </AuthRoute>
        )}
      </Route>

      <Route path="/signup">
        {() => (
          <AuthRoute>
            <div className="dark">
              <SignupPage />
            </div>
          </AuthRoute>
        )}
      </Route>

      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/workspace">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <WorkspacePage />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/traces">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <TracesPage />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/favorites">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <FavoritesPage />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <AdminPage />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route>
        {() => (
          <AppLayout>
            <NotFound />
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
