import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, Loader2, LogOut, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            <span className="font-display text-sm font-semibold tracking-tight">Eduvanta Intelligence</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <Link to="/dashboard">
              <Button variant={path === "/dashboard" ? "secondary" : "ghost"} size="sm">
                <LayoutDashboard className="size-4" />
                Research library
              </Button>
            </Link>
            <Link to="/research/new">
              <Button variant={path === "/research/new" ? "secondary" : "ghost"} size="sm">
                <Plus className="size-4" />
                New research
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
