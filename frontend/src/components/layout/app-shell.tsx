import { useEffect, useState } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Menu,
  Search,
  Bell,
  ChevronRight,
  Activity,
  Radio,
} from "lucide-react";
import { Outlet, useRouterState, Link, Navigate } from "@tanstack/react-router";
import { BrandMark, NavList, NAV_ITEMS } from "./nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function useCurrentPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const match = NAV_ITEMS.find((n) =>
    n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`),
  );
  return { pathname, match };
}

function TopProgressBar() {
  const status = useRouterState({ select: (s) => s.status });
  const isPending = status === "pending";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] overflow-hidden transition-opacity duration-200",
        isPending ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-linear-to-r from-transparent via-primary to-transparent" />
      <style>{`@keyframes progress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(120%); }
        100% { transform: translateX(320%); }
      }`}</style>
    </div>
  );
}

function StatusRail() {
  return (
    <div className="hidden items-center gap-4 border-b border-border/70 bg-surface/60 px-6 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:flex">
      <span className="inline-flex items-center gap-1.5">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        <span>SITE-01 · REFINERY-A</span>
      </span>
      <span className="text-border-strong">│</span>
      <span>Env: <span className="text-foreground/80">Production</span></span>
      <span className="text-border-strong">│</span>
      <span>Ingest: <span className="text-success">Streaming</span></span>
      <span className="text-border-strong">│</span>
      <span>Model: <span className="text-foreground/80">kip-eng-2.4</span></span>
      <span className="text-border-strong">│</span>
      <span className="inline-flex items-center gap-1.5">
        <Radio className="h-3 w-3 text-signal" aria-hidden />
        <span>3 alerts open</span>
      </span>
      <span className="ml-auto tabular-nums">UTC {new Date().toISOString().slice(11, 16)}</span>
    </div>
  );
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { match, pathname } = useCurrentPage();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("global-search") as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <TopProgressBar />

      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "md:w-[68px]" : "md:w-64",
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <BrandMark collapsed={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <NavList collapsed={collapsed} />
        </div>

        {/* Sidebar footer: system telemetry */}
        <div className="border-t border-sidebar-border">
          {!collapsed && (
            <div className="space-y-2 px-3 py-3">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Cluster load</span>
                <span className="text-foreground/80 tabular-nums">42%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted/60">
                <div className="h-full w-[42%] bg-linear-to-r from-primary/60 to-primary" />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Graph nodes</span>
                <span className="text-foreground/80 tabular-nums">184,309</span>
              </div>
            </div>
          )}
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center",
              )}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" aria-hidden />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    Collapse
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "md:pl-[68px]" : "md:pl-64",
        )}
      >
        <StatusRail />

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className="md:hidden"
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
                >
                  <SheetHeader className="border-b border-sidebar-border p-4">
                    <SheetTitle className="text-left text-sidebar-foreground">
                      <BrandMark />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <NavList onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                <Link
                  to="/"
                  className="hidden shrink-0 hover:text-foreground sm:inline"
                >
                  KIP
                </Link>
                <ChevronRight className="hidden h-3 w-3 shrink-0 sm:inline" aria-hidden />
                <span className="truncate text-foreground">
                  {match?.title ?? pathname.replace("/", "") ?? "Overview"}
                </span>
              </nav>
            </div>

            {/* Global search */}
            <div className="hidden md:block">
              <label htmlFor="global-search" className="sr-only">
                Global search
              </label>
              <div className="relative mx-auto w-full max-w-xl">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="global-search"
                  type="search"
                  placeholder="Ask Mhmm.ai about equipment, failures, SOPs, manuals, incidents, or engineering knowledge..."
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-surface/70 pl-9 pr-16 text-sm text-foreground",
                    "placeholder:text-muted-foreground/80",
                    "focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-transparent",
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const q = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      // @ts-ignore - bypassing router typings for dynamic route
                      window.location.href = `/query?q=${encodeURIComponent(q)}`;
                    }
                  }}
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-self-end">
              <div className="hidden items-center gap-2 rounded-sm border border-border bg-surface/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground xl:flex">
                <Activity className="h-3 w-3 text-success" aria-hidden />
                <span className="text-foreground/85">All systems nominal</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="View alerts"
                className="relative"
              >
                <Bell className="h-[18px] w-[18px]" aria-hidden />
                <span
                  aria-hidden
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-signal ring-2 ring-background live-dot"
                />
              </Button>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-surface/70 pl-2 pr-1 py-1 sm:flex group relative">
                <div className="leading-tight">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Operator
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    Authenticated User
                  </p>
                </div>
                <button
                  aria-label="Sign out"
                  onClick={logout}
                  className="grid h-7 w-7 place-items-center rounded-sm bg-primary/20 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/30 hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive cursor-pointer transition-colors"
                  title="Sign out"
                >
                  X
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Mhmm.ai · Industrial Knowledge Intelligence</span>
            <span className="flex items-center gap-3">
              <span>Build 0.1.0 · Phase 1 Shell</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                <span>Uplink active</span>
              </span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
