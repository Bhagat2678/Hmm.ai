import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Search,
  Share2,
  BellRing,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  to: "/" | "/upload" | "/documents" | "/query" | "/graph" | "/alerts";
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  badgeTone?: "info" | "signal" | "danger";
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
      { title: "Alerts", to: "/alerts", icon: BellRing, badge: "12", badgeTone: "signal" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Knowledge Query", to: "/query", icon: Search },
      { title: "Knowledge Graph", to: "/graph", icon: Share2 },
    ],
  },
  {
    label: "Data Sources",
    items: [
      { title: "Upload", to: "/upload", icon: Upload },
      { title: "Documents", to: "/documents", icon: FileText },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1.5 py-1">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-linear-to-br from-primary/25 to-primary/5 ring-1 ring-primary/40">
        <Cog className="h-[18px] w-[18px] text-primary" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/15%),transparent_60%)]"
        />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            Mhmm<span className="text-primary">.ai</span>
          </p>
          <p className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            IND · KIP v0.1
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

export function NavList({ collapsed = false, onNavigate }: NavListProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Primary" className="flex flex-col gap-5 px-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-0.5">
          {!collapsed && (
            <p className="px-2.5 pb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              {section.label}
            </p>
          )}
          {collapsed && (
            <div className="mx-3 mb-1 h-px bg-sidebar-border" aria-hidden />
          )}
          {section.items.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-label={item.title}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active && "bg-sidebar-accent text-sidebar-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-primary shadow-[0_0_8px_currentColor]"
                  />
                )}
                <Icon
                  className={cn(
                    "h-[17px] w-[17px] shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                  aria-hidden
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                          item.badgeTone === "signal" &&
                            "bg-signal/15 text-signal ring-1 ring-signal/30",
                          item.badgeTone === "danger" &&
                            "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
                          (!item.badgeTone || item.badgeTone === "info") &&
                            "bg-primary/15 text-primary ring-1 ring-primary/30",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
