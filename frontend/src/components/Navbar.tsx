import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, Code2, LogOut, LayoutDashboard,
  BookMarked, Heart, Shield, Menu, X, Play, CreditCard
} from "lucide-react";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/workspace", label: "Workspace", icon: <Play className="h-4 w-4" /> },
        { href: "/traces", label: "Saved Traces", icon: <BookMarked className="h-4 w-4" /> },
        { href: "/favorites", label: "Favorites", icon: <Heart className="h-4 w-4" /> },
        { href: "/pricing", label: "Pricing", icon: <CreditCard className="h-4 w-4" /> },
        ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: <Shield className="h-4 w-4" /> }] : []),
      ]
    : [];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <Logo iconSize={32} />
          </Link>

          {/* Desktop nav links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <button
                    data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      location === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </button>
                </Link>
              ))}
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Desktop user menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:flex items-center gap-2 text-sm"
                      data-testid="nav-user-menu"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:block max-w-[100px] truncate">{user?.name}</span>
                      {user?.role === "admin" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/workspace"><Play className="h-4 w-4 mr-2" />Workspace</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing"><CreditCard className="h-4 w-4 mr-2" />Pricing / Upgrade</Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin"><Shield className="h-4 w-4 mr-2" />Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="nav-logout">
                      <LogOut className="h-4 w-4 mr-2" />Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile hamburger */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" data-testid="nav-mobile-menu">
                      {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 bg-card border-border p-0">
                    <SheetHeader className="px-5 py-4 border-b border-border">
                      <SheetTitle className="flex items-center gap-2.5 text-left">
                        <Logo iconSize={28} />
                      </SheetTitle>
                    </SheetHeader>
                    {/* User info */}
                    <div className="px-5 py-3 border-b border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    {/* Nav links */}
                    <nav className="px-3 py-3 flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <button
                            onClick={() => setMobileOpen(false)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                              location === link.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            {link.icon}
                            {link.label}
                          </button>
                        </Link>
                      ))}
                    </nav>
                    <div className="absolute bottom-5 left-0 right-0 px-4">
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { logout(); setMobileOpen(false); }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="nav-login">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" data-testid="nav-signup">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
