import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Search,
  Share2,
  BellRing,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  title: string;
  to: "/" | "/upload" | "/documents" | "/query" | "/graph" | "/alerts" | "/settings";
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
  { title: "Chat AI", to: "/query", icon: Search },
  { title: "Knowledge Graph", to: "/graph", icon: Share2 },
  { title: "Document Explorer", to: "/documents", icon: FileText },
  { title: "Ingestion", to: "/upload", icon: Upload },
  { title: "Alerts", to: "/alerts", icon: BellRing, badge: "3" },
  { title: "Settings", to: "/settings", icon: Settings },
];

export function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
        <Sparkles className="h-5 w-5 fill-current" aria-hidden />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="font-bold tracking-tight text-primary text-base">
            Mhmm<span className="text-foreground">.ai</span>
          </p>
          <p className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Operations Platform
          </p>
        </div>
      )}
    </div>
  );
}

interface NavListProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

import { useAlerts } from "@/hooks/useAlerts";

export function NavList({ collapsed = false, onNavigate }: NavListProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: alerts } = useAlerts();
  const unackAlertsCount = alerts?.filter((a: any) => !a.acknowledged).length || 0;

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* New Chat Primary Action Button */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <button
              onClick={() => {
                navigate({ to: "/query", search: { reset: Date.now().toString() } });
                onNavigate?.();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>
        )}

        <nav aria-label="Primary navigation" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            const badgeValue = item.to === "/alerts" ? (unackAlertsCount > 0 ? unackAlertsCount.toString() : undefined) : item.badge;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-label={item.title}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-foreground/80 hover:bg-primary/10 hover:text-primary",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-white" : "text-muted-foreground group-hover:text-primary",
                  )}
                  aria-hidden
                />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.title}</span>
                    {badgeValue && (
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                          active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {badgeValue}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Help & Logout */}
      <div className="px-3 pt-4 border-t border-border/40 space-y-1">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all",
            collapsed && "justify-center px-0",
          )}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
          {!collapsed && <span>Help & Docs</span>}
        </Link>
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-all cursor-pointer",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
