import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BellRing,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  GitBranch,
  FileText,
  X,
  Check,
  Wrench,
  Activity,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts } from "../hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts - Bedrock" },
      {
        name: "description",
        content:
          "Predictive maintenance and rule-based alerts for industrial assets, ranked and enriched by Bedrock.",
      },
    ],
  }),
  component: AlertsPage,
});

type Severity = "critical" | "warning" | "info" | "resolved";

type Alert = {
  id: string;
  severity: Severity;
  tag: string;
  title: string;
  detail: string;
  confidence: number;
  rootCause: string;
  suggested: string;
  time: string;
  acknowledged: boolean;
};

const SEV_STYLES: Record<Severity, { badge: string; icon: typeof BellRing; text: string }> = {
  critical: { badge: "bg-red-100 text-red-700 ring-red-200", icon: ShieldAlert, text: "text-red-600" },
  warning: { badge: "bg-amber-100 text-amber-700 ring-amber-200", icon: AlertTriangle, text: "text-amber-600" },
  info: { badge: "bg-primary/10 text-primary ring-primary/20", icon: Info, text: "text-primary" },
  resolved: { badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", icon: CheckCircle2, text: "text-emerald-600" },
};

function AlertsPage() {
  const navigate = useNavigate();
  const { data: apiAlerts, acknowledge, isAcknowledging, escalate, isEscalating } = useAlerts();
  const [filter, setFilter] = useState<string | "all">("all");
  const displayAlerts = apiAlerts || [];
  const [selected, setSelected] = useState<any | null>(displayAlerts[0] || null);

  const summaryData = [
    { key: "critical" as Severity, label: "Critical", value: displayAlerts.filter((a: any) => a.severity === "critical" || a.severity === "high").length, icon: ShieldAlert },
    { key: "warning" as Severity, label: "Warning", value: displayAlerts.filter((a: any) => a.severity === "warning" || a.severity === "medium").length, icon: AlertTriangle },
    { key: "info" as Severity, label: "Information", value: displayAlerts.filter((a: any) => a.severity === "info" || a.severity === "low").length, icon: Info },
    { key: "resolved" as Severity, label: "Acknowledged", value: displayAlerts.filter((a: any) => a.acknowledged).length, icon: CheckCircle2 },
  ];

  const filtered = displayAlerts.filter((a: any) => filter === "all" || a.severity === filter);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl glass-panel p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 80% 30%, rgba(236,220,255,0.4) 0%, transparent 65%)",
          }}
        />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <BellRing className="h-3.5 w-3.5" aria-hidden />
              Predictive Operations Intelligence
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Industrial Alerts
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground leading-relaxed">
              Predictive and rule-based alerts fused across sensor telemetry, engineering knowledge, and failure history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500 live-dot" />
              {displayAlerts.filter((a: any) => !a.acknowledged).length} Open Alerts
            </span>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryData.map((s) => {
          const Icon = s.icon;
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(active ? "all" : s.key)}
              className={cn(
                "glass-card rounded-2xl p-5 text-left transition-all duration-300 cursor-pointer hover:-translate-y-1",
                active && "ring-2 ring-primary bg-primary/10 shadow-lg",
              )}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
            </button>
          );
        })}
      </section>

      {/* 7-Day Alert Trend */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
              <Activity className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <h3 className="text-sm font-bold text-foreground">7-Day Predictive Trend</h3>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Telemetric + RAG fusion</span>
        </div>
        <div className="mt-5">
          <div className="flex h-24 items-end gap-1.5">
            {[3, 5, 4, 6, 8, 12, 9, 7, 10, 14, 11, 9, 15, 12, 8, 6, 9, 11, 13, 10, 12, 14, 9, 7, 5, 8, 11, 13].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-primary/60 hover:bg-primary transition-all duration-200"
                style={{ height: `${v * 6}%` }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>-7d</span>
            <span>-3d</span>
            <span className="text-primary font-bold">Now</span>
          </div>
        </div>
      </section>

      {/* Controls & Filter Tabs */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Search alerts, equipment tags, root causes..."
            className="h-10 w-full rounded-2xl border border-border/60 bg-white/60 pl-9 pr-4 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 glass-panel rounded-2xl gap-1">
            {(["all", "critical", "warning", "info", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-xl px-3 py-1 text-[11px] font-bold transition-all cursor-pointer capitalize",
                  filter === f
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Alert List + Detail Inspector */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-3 col-span-2">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Active Alerts</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All equipment systems are operating within normal telemetry thresholds.
            </p>
          </div>
        ) : (
        <ul className="space-y-3">
          {filtered.map((a: any) => {
            const sev = SEV_STYLES[a.severity as Severity] || SEV_STYLES.info;
            const SevIcon = sev.icon;
            const active = selected?.id === a.id;
            return (
              <li key={a.id}>
                <div
                  onClick={() => setSelected(a)}
                  className={cn(
                    "glass-panel rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all duration-300 hover:shadow-md",
                    active && "ring-2 ring-primary bg-primary/5",
                    a.acknowledged && "opacity-60",
                  )}
                >
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", sev.badge)}>
                    <SevIcon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1", sev.badge)}>
                        {a.severity}
                      </span>
                      <span className="font-bold text-xs text-primary">{a.tag || "System"}</span>
                      <h4 className="font-bold text-sm text-foreground truncate">{a.title || a.message}</h4>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {a.detail || a.message}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                      <span className="font-mono text-foreground">{a.id}</span>
                      <span>·</span>
                      <span>{a.created_at ? formatDistanceToNow(new Date(a.created_at)) : a.time || "1m"} ago</span>
                      {a.confidence != null && (
                        <>
                          <span>·</span>
                          <span>Confidence <span className="font-bold text-foreground tabular-nums">{Math.round(a.confidence * 100)}%</span></span>
                        </>
                      )}
                      {a.acknowledged && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-emerald-600">Acknowledged</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        )}

        {/* Selected Alert Inspector */}
        {selected && (
          <aside className="glass-panel rounded-3xl p-6 space-y-5 h-fit sticky top-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1", SEV_STYLES[selected.severity as Severity]?.badge || "bg-primary/10 text-primary")}>
                  {selected.severity}
                </span>
                <h3 className="font-bold text-sm text-foreground">{selected.id}</h3>
              </div>
              <button
                aria-label="Close details"
                onClick={() => setSelected(null)}
                className="grid h-7 w-7 place-items-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asset / Equipment</p>
              <p className="mt-0.5 text-base font-bold text-primary">{selected.tag || "System"}</p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-foreground">{selected.title || selected.message}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selected.detail}</p>
            </div>

            <div className="rounded-2xl glass-panel p-4 space-y-2">
              <p className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="h-4 w-4" aria-hidden /> AI Root Cause Analysis
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.rootCause || "Engineered vibration anomaly analysis."}</p>
              {selected.confidence != null && (
                <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span>Confidence</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${selected.confidence * 100}%` }} />
                  </div>
                  <span className="font-bold text-foreground tabular-nums">{Math.round(selected.confidence * 100)}%</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl glass-panel p-4 space-y-1.5">
              <p className="flex items-center gap-2 text-xs font-bold text-primary">
                <Wrench className="h-4 w-4" aria-hidden /> Recommended Action
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.suggested || "Inspect pump alignment & lube oil condition per SOP-9."}</p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" aria-hidden /> Related Knowledge Nodes
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[selected.tag, "SOP-9", "S-12", "MAN-P101"].map((e) => (
                  <span key={e} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
              <button
                onClick={() =>
                  navigate({
                    to: "/query",
                    search: { q: `Explain the root cause and mitigation steps for alert ${selected.tag}: ${selected.title || selected.message}` },
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 cursor-pointer transition-all"
              >
                <Sparkles className="h-4 w-4" /> Ask AI about Alert
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => acknowledge(selected.id)}
                  disabled={selected.acknowledged || isAcknowledging}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl glass-panel border border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-40 cursor-pointer transition-all"
                >
                  <Check className="h-4 w-4" aria-hidden /> Acknowledge
                </button>
                <button
                  onClick={() => escalate(selected.id)}
                  disabled={selected.escalated || isEscalating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-200 disabled:opacity-40 cursor-pointer transition-all"
                >
                  Escalate
                </button>
              </div>
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}
