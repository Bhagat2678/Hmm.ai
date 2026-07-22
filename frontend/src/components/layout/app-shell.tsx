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
  User,
} from "lucide-react";
import { Outlet, useRouterState, Link, Navigate, useNavigate } from "@tanstack/react-router";
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
      <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary to-transparent" />
      <style>{`@keyframes progress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(120%); }
        100% { transform: translateX(320%); }
      }`}</style>
    </div>
  );
}

import { useAlerts } from "@/hooks/useAlerts";

function StatusRail() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, "0");
      const mm = String(now.getUTCMinutes()).padStart(2, "0");
      setUtcTime(`${hh}:${mm}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-border/40 bg-white/40 px-8 py-2 font-sans text-xs font-bold text-muted-foreground backdrop-blur-sm">
      <span className="text-foreground font-extrabold tracking-tight text-sm">Bedrock</span>
      <span className="font-mono text-xs tabular-nums text-foreground font-bold">
        {utcTime ? `UTC ${utcTime}` : ""}
      </span>
    </div>
  );
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [year, setYear] = useState("");
  const { match, pathname } = useCurrentPage();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState("Operator");
  const [profileRole, setProfileRole] = useState("Reliability Eng");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const loadProfile = () => {
      const storedName = localStorage.getItem("bedrock-fullName");
      const storedBio = localStorage.getItem("bedrock-bio");
      const storedAvatar = localStorage.getItem("bedrock-avatarUrl");
      if (storedName) setProfileName(storedName);
      if (storedBio) {
        const cleanBio = storedBio.split("on")[0].split("&")[0].trim();
        setProfileRole(cleanBio.length > 20 ? cleanBio.slice(0, 20) + "..." : cleanBio);
      } else {
        setProfileRole("Reliability Eng");
      }
      if (storedAvatar) setAvatarUrl(storedAvatar);
    };
    loadProfile();
    window.addEventListener("bedrock-settings-update", loadProfile);
    window.addEventListener("storage", loadProfile);
    return () => {
      window.removeEventListener("bedrock-settings-update", loadProfile);
      window.removeEventListener("storage", loadProfile);
    };
  }, []);

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

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
    <div className="min-h-screen bg-background text-foreground flex">
      <TopProgressBar />

      {/* Desktop Sidebar (Fixed Stitch Style) */}
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden glass-panel border-r border-primary/20 backdrop-blur-2xl bg-white/70 shadow-xl transition-all duration-300 md:flex md:flex-col p-4",
          collapsed ? "md:w-20" : "md:w-64",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <BrandMark collapsed={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <NavList collapsed={collapsed} />
        </div>
      </aside>

      {/* Main Body Canvas */}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-all duration-300",
          collapsed ? "md:ml-20" : "md:ml-64",
        )}
      >
        <StatusRail />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 glass-panel bg-white/80 backdrop-blur-md border-b border-border/50 shadow-xs">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile Drawer Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className="md:hidden rounded-xl"
                  >
                    <Menu className="h-5 w-5 text-primary" aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 glass-panel border-r border-border p-0 text-foreground"
                >
                  <SheetHeader className="border-b border-border p-4">
                    <SheetTitle className="text-left text-foreground">
                      <BrandMark />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-4 h-full">
                    <NavList onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Breadcrumb Trail */}
              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-muted-foreground"
              >
                <Link to="/" className="hidden shrink-0 hover:text-primary sm:inline">
                  Bedrock
                </Link>
                <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:inline" aria-hidden />
                <span className="truncate text-primary font-bold">
                  {match?.title ?? pathname.replace("/", "") ?? "Dashboard"}
                </span>
              </nav>
            </div>

            {/* Global Search Input */}
            <div className="hidden md:block">
              <label htmlFor="global-search" className="sr-only">
                Global search
              </label>
              <div className="relative mx-auto w-full max-w-xl">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                  aria-hidden
                />
                <input
                  id="global-search"
                  type="search"
                  placeholder="Search equipment, manuals, failure logs, knowledge graph..."
                  className="h-10 w-full rounded-2xl border border-border/60 bg-white/60 pl-10 pr-16 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const q = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      navigate({ to: "/query", search: { q } });
                    }
                  }}
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded-xl border border-border/60 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary sm:inline-block">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Top Right Action Controls */}
            <div className="flex items-center gap-3 justify-self-end">
              <div className="hidden items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 xl:flex">
                <Activity className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                <span>All Systems Operational</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="View alerts"
                className="relative rounded-xl hover:bg-primary/10 hover:text-primary cursor-pointer"
                onClick={() => navigate({ to: "/alerts" })}
              >
                <Bell className="h-5 w-5" aria-hidden />
                <span
                  aria-hidden
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white live-dot"
                />
              </Button>
              <Link
                to="/settings"
                title="Go to Workspace Settings"
                className="hidden items-center gap-3 rounded-2xl glass-panel p-1.5 pr-3 sm:flex hover:bg-primary/10 transition-colors cursor-pointer"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profileName}
                    className="h-8 w-8 rounded-xl object-cover shadow-sm border border-primary/20"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {profileName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <p className="text-xs font-bold text-foreground">{profileName}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">{profileRole}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border/40 px-6 py-4 text-xs font-semibold text-muted-foreground sm:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
            <span>© {year || "2026"} Bedrock · Industrial Knowledge Intelligence Platform</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              <span>Online</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
