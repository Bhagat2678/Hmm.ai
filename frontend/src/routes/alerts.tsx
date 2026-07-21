import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts } from "../hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Mhmm.ai" },
      {
        name: "description",
        content:
          "Predictive maintenance and rule-based alerts for industrial assets, ranked and enriched by Mhmm.ai.",
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

const ALERTS: Alert[] = [
  {
    id: "A-2081",
    severity: "critical",
    tag: "P-101",
    title: "Bearing failure predicted within 72h",
    detail: "Vibration exceeds ISO 10816 zone C · trend rising 0.11 mm/s per day",
    confidence: 0.94,
    rootCause: "Vibration harmonics at 2x and 4x running speed suggest inner race defect.",
    suggested: "Schedule inspection in next shutdown window; verify lube oil condition and re-align coupling.",
    time: "02m",
    acknowledged: false,
  },
  {
    id: "A-2079",
    severity: "warning",
    tag: "HX-31",
    title: "Heat exchanger fouling accelerating",
    detail: "ΔP drift +12% vs 30-day baseline · fouling likely within 96h",
    confidence: 0.81,
    rootCause: "Feed contamination or crystallization on tube-side. Correlated with T-500 turbidity trend.",
    suggested: "Initiate CIP per SOP-9 §4.2; sample feed for solids content.",
    time: "18m",
    acknowledged: false,
  },
  {
    id: "A-2076",
    severity: "warning",
    tag: "V-204",
    title: "Control valve stiction detected",
    detail: "Valve travel deviation vs SP has doubled over the last shift",
    confidence: 0.72,
    rootCause: "Actuator air supply pressure fluctuating outside normal band; possible packing tightening.",
    suggested: "Verify instrument air header pressure; schedule valve step test.",
    time: "34m",
    acknowledged: true,
  },
  {
    id: "A-2074",
    severity: "info",
    tag: "T-500",
    title: "Level sensor disagreement",
    detail: "S-12 disagrees with radar LT-500 by 4.2%",
    confidence: 0.66,
    rootCause: "Possible foam in vessel or radar calibration drift.",
    suggested: "Trigger anti-foam injection cycle; schedule LT-500 verification.",
    time: "41m",
    acknowledged: false,
  },
  {
    id: "A-2069",
    severity: "resolved",
    tag: "SOP-9",
    title: "Procedure revision published",
    detail: "Rev 3.2 released; graph re-linked to 8 equipment nodes",
    confidence: 0.99,
    rootCause: "Scheduled documentation update.",
    suggested: "Ops team acknowledged; no further action required.",
    time: "2h",
    acknowledged: true,
  },
];

const SEV_STYLES: Record<Severity, { badge: string; ring: string; icon: typeof BellRing }> = {
  critical: { badge: "bg-destructive/15 text-destructive ring-destructive/30", ring: "border-destructive/40", icon: ShieldAlert },
  warning: { badge: "bg-signal/15 text-signal ring-signal/30", ring: "border-signal/40", icon: AlertTriangle },
  info: { badge: "bg-primary/15 text-primary ring-primary/30", ring: "border-primary/40", icon: Info },
  resolved: { badge: "bg-success/15 text-success ring-success/30", ring: "border-success/40", icon: CheckCircle2 },
};

const SUMMARY = [
  { key: "critical" as Severity, label: "Critical", value: 3, delta: "+1", icon: ShieldAlert, tone: "text-destructive" },
  { key: "warning" as Severity, label: "Warning", value: 9, delta: "-2", icon: AlertTriangle, tone: "text-signal" },
  { key: "info" as Severity, label: "Information", value: 14, delta: "0", icon: Info, tone: "text-primary" },
  { key: "resolved" as Severity, label: "Resolved · 24h", value: 42, delta: "+7", icon: CheckCircle2, tone: "text-success" },
];

function AlertsPage() {
  const { data: apiAlerts, isLoading, acknowledge, isAcknowledging, escalate, isEscalating } = useAlerts();
  const [filter, setFilter] = useState<string | "all">("all");
  const displayAlerts = apiAlerts && apiAlerts.length > 0 ? apiAlerts : ALERTS;
  const [selected, setSelected] = useState<any | null>(displayAlerts[0] || null);

  const filtered = displayAlerts.filter((a: any) => filter === "all" || a.severity === filter);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          <BellRing className="h-3.5 w-3.5" aria-hidden />
          Mhmm.ai · Predictive Maintenance
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Alerts
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Predictive and rule-based alerts fused across sensor telemetry,
          engineering knowledge, and historical failure patterns.
        </p>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SUMMARY.map((s) => {
          const Icon = s.icon;
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(active ? "all" : s.key)}
              className={cn(
                "group relative overflow-hidden rounded-md border p-4 text-left transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border bg-card/70 hover:border-primary/30",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums", s.tone)}>{s.value}</p>
                </div>
                <Icon className={cn("h-5 w-5", s.tone)} aria-hidden />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.delta} vs prev shift
              </p>
            </button>
          );
        })}
      </section>

      {/* Trend */}
      <section className="rounded-md border border-border bg-card/70">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Alert Trend · 7 days</h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Fused predictive · rule-based
          </span>
        </div>
        <div className="p-4">
          <div className="flex h-24 items-end gap-1.5">
            {[3, 5, 4, 6, 8, 12, 9, 7, 10, 14, 11, 9, 15, 12, 8, 6, 9, 11, 13, 10, 12, 14, 9, 7, 5, 8, 11, 13].map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-linear-to-t from-destructive/30 to-signal/70" style={{ height: `${v * 6}%` }} aria-hidden />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>-7d</span><span>-3d</span><span className="text-foreground">now</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Search alerts, equipment tags, root causes…"
            className="h-9 w-full rounded-md border border-input bg-surface/70 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-hidden focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filters
          </button>
          <div className="flex overflow-hidden rounded-md border border-border font-mono text-[10px] uppercase tracking-widest">
            {(["all", "critical", "warning", "info", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline + detail */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="space-y-2">
          {filtered.map((a: any) => {
            const sev = SEV_STYLES[a.severity as Severity] || SEV_STYLES.info;
            const SevIcon = sev?.icon || Info;
            const active = selected?.id === a.id;
            return (
              <li key={a.id}>
                <button
                  onClick={() => setSelected(a)}
                  className={cn(
                    "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-md border bg-card/70 p-3 text-left transition-colors hover:border-primary/40",
                    active ? "border-primary/50 bg-primary/5" : "border-border",
                    a.acknowledged && "opacity-70",
                  )}
                >
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-sm ring-1", sev?.badge || "bg-primary/15 text-primary ring-primary/30")}>
                    <SevIcon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1", sev?.badge || "bg-primary/15 text-primary ring-primary/30")}>
                        {a.severity}
                      </span>
                      <span className="font-mono text-xs text-primary">{a.tag || "System"}</span>
                      <p className="truncate text-sm font-medium text-foreground">{a.title || a.message}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{a.detail || a.message}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>{a.id}</span>
                      <span className="text-border-strong">│</span>
                      <span><Clock className="mr-1 inline h-3 w-3" aria-hidden />{a.created_at ? formatDistanceToNow(new Date(a.created_at)) : (a.time || "1m")} ago</span>
                      {a.confidence && (
                        <>
                          <span className="text-border-strong">│</span>
                          <span>Confidence <span className="text-foreground tabular-nums">{Math.round(a.confidence * 100)}%</span></span>
                        </>
                      )}
                      {a.acknowledged && (
                        <>
                          <span className="text-border-strong">│</span>
                          <span className="text-success">ACK'd</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Detail */}
        {selected && (
          <aside className="rounded-md border border-border bg-card/70">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1", SEV_STYLES[selected.severity as Severity]?.badge || "bg-primary/15 text-primary ring-primary/30")}>
                  {selected.severity}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{selected.id}</h3>
              </div>
              <button aria-label="Close" onClick={() => setSelected(null)} className="grid h-7 w-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Asset</p>
                <p className="mt-0.5 font-mono text-primary">{selected.tag || "System"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.title || selected.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selected.detail}</p>
              </div>

              <div className="rounded-md border border-border bg-surface/40 p-3">
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-primary">
                  <Sparkles className="h-3 w-3" aria-hidden /> AI Explanation
                </p>
                <p className="mt-1.5 text-xs text-foreground">{selected.rootCause}</p>
                <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>Confidence</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div className="h-full bg-primary" style={{ width: `${selected.confidence * 100}%` }} />
                  </div>
                  <span className="tabular-nums text-foreground">{Math.round(selected.confidence * 100)}%</span>
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface/40 p-3">
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-primary">
                  <Wrench className="h-3 w-3" aria-hidden /> Suggested action
                </p>
                <p className="mt-1.5 text-xs text-foreground">{selected.suggested}</p>
              </div>

              <div>
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <GitBranch className="h-3 w-3" aria-hidden /> Referenced entities
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[selected.tag, "SOP-9", "S-12", "MAN-P101"].map((e) => (
                    <span key={e} className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary ring-1 ring-primary/25">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <FileText className="h-3 w-3" aria-hidden /> Acknowledgement history
                </p>
                <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
                  <li>· 02m — Raised by predictive engine</li>
                  <li>· 01m — Routed to reliability queue</li>
                  {selected.acknowledged && <li className="text-success">· now — Acknowledged by E. Nakamura</li>}
                </ul>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <button
                  onClick={() => acknowledge(selected.id)}
                  disabled={selected.acknowledged || isAcknowledging}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> Acknowledge
                </button>
                <button 
                  onClick={() => escalate(selected.id)}
                  disabled={selected.escalated || isEscalating}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-surface/70 px-3 py-2 text-xs text-foreground hover:bg-accent disabled:opacity-50 cursor-pointer"
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
