import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  FileText,
  BellRing,
  Network,
  ArrowUpRight,
  Gauge,
  Cpu,
  ShieldAlert,
  CircleDot,
  Sparkles,
  Workflow,
  HardDrive,
  Boxes,
  GitBranch,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Brain,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useDashboard } from "../hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

type Metric = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  hint: string;
  icon: typeof FileText;
};

function DashboardPage() {
  const { documents, alerts, stats, isLoading } = useDashboard();
  
  const totalDocs = documents?.length || 0;
  const totalAlerts = alerts?.filter(a => !a.acknowledged).length || 0;
  
  // Calculate dynamic metrics based on actual backend data if available
  const METRICS: Metric[] = [
    {
      label: "Knowledge Documents",
      value: totalDocs.toString(),
      unit: "docs",
      delta: "",
      deltaTone: "flat",
      hint: "Ingested documents",
      icon: FileText,
    },
    {
      label: "Graph Nodes",
      value: stats?.graph_nodes != null ? stats.graph_nodes.toString() : "-",
      unit: "nodes",
      delta: "",
      deltaTone: "flat",
      hint: "Neo4j knowledge graph",
      icon: Network,
    },
    {
      label: "Relationships",
      value: stats?.graph_edges != null ? stats.graph_edges.toString() : "-",
      unit: "edges",
      delta: "",
      deltaTone: "flat",
      hint: "Extracted by LangGraph",
      icon: GitBranch,
    },
    {
      label: "Industrial Assets",
      value: stats?.equipment_count != null ? stats.equipment_count.toString() : "-",
      unit: "assets",
      delta: "",
      deltaTone: "flat",
      hint: "Equipment entities",
      icon: Gauge,
    },
    {
      label: "AI Queries · 24h",
      value: stats?.queries_24h != null ? stats.queries_24h.toString() : "-",
      unit: "runs",
      delta: "",
      deltaTone: "flat",
      hint: "Gemini + Groq RAG",
      icon: Cpu,
    },
    {
      label: "Active Alerts",
      value: totalAlerts.toString(),
      unit: "open",
      delta: "",
      deltaTone: totalAlerts > 0 ? "down" : "flat",
      hint: "Requires attention",
      icon: BellRing,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Command bar */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Mhmm.ai · Operations Overview
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Industrial Knowledge Intelligence
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Current Workspace · <span className="text-foreground/90 normal-case">Refinery-A</span>
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Unified view of ingested engineering knowledge, live alerts, and
            equipment intelligence for on-shift operators and reliability
            engineers.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>
            <dt>Shift</dt>
            <dd className="mt-1 text-sm text-foreground normal-case">A · Day</dd>
          </div>
          <div>
            <dt>Uptime</dt>
            <dd className="mt-1 text-sm text-success tabular-nums">99.982%</dd>
          </div>
          <div>
            <dt>Last sync</dt>
            <dd className="mt-1 text-sm text-foreground tabular-nums">00:42s</dd>
          </div>
        </dl>
      </header>

      {/* Metrics */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      >
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={cn(
                "group relative overflow-hidden rounded-md border border-border bg-card/70 p-4",
                "transition-colors hover:border-primary/50",
              )}
            >
              <div
                aria-hidden
                className="absolute left-0 top-0 h-full w-[2px] bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    {m.value}
                    {m.unit && (
                      <span className="ml-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        {m.unit}
                      </span>
                    )}
                  </p>
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{m.hint}</span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    m.deltaTone === "up" && "text-success",
                    m.deltaTone === "down" && "text-signal",
                    m.deltaTone === "flat" && "text-muted-foreground",
                  )}
                >
                  {m.delta}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Graph + Alerts */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <KnowledgeGraphPreview />
        <AlertsPanel alerts={alerts || []} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <AiInsightsPanel />
        <PipelineStatus />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RecentUploads documents={documents || []} />
        <ProcessTelemetry />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SystemHealth />
        <GraphStatistics stats={stats} />
        <RecentQueries />
      </section>

      <section>
        <AiActivityTimeline />
      </section>
    </div>
  );
}

/* ---------- AI Operational Insights ---------- */

type Insight = {
  id: string;
  tone: "critical" | "warning" | "info";
  title: string;
  detail: string;
  asset: string;
  confidence: number;
};

const INSIGHTS: Insight[] = [
  {
    id: "IN-401",
    tone: "critical",
    title: "Bearing failure predicted on P-101 within 72h",
    detail:
      "Vibration harmonics correlate with 3 prior failures on API 610 pumps. Recommend inspection during next shutdown window.",
    asset: "P-101 · Main feed pump",
    confidence: 0.94,
  },
  {
    id: "IN-398",
    tone: "warning",
    title: "HX-31 fouling trend accelerating",
    detail:
      "ΔP up 12% vs 30-day baseline. SOP-9 §4.2 recommends CIP within 96h to avoid throughput derate.",
    asset: "HX-31 · Feed/effluent exchanger",
    confidence: 0.81,
  },
  {
    id: "IN-395",
    tone: "info",
    title: "Vendor manual revision detected for P-101",
    detail:
      "Vendor issued Rev 12 with updated NPSH curve. Graph nodes and 3 SOP references have been re-linked.",
    asset: "Doc corpus · Vendor P-101",
    confidence: 0.99,
  },
];

const INSIGHT_TONE: Record<Insight["tone"], string> = {
  critical: "text-destructive bg-destructive/10 ring-destructive/30",
  warning: "text-signal bg-signal/10 ring-signal/30",
  info: "text-primary bg-primary/10 ring-primary/30",
};

function AiInsightsPanel() {
  return (
    <div className="col-span-1 rounded-md border border-border bg-card/70 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            AI Operational Insights
          </h3>
          <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary ring-1 ring-primary/30">
            Gemini · RAG
          </span>
        </div>
        <button className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
      <ul className="divide-y divide-border">
        {INSIGHTS.map((i) => (
          <li key={i.id} className="px-4 py-3 transition-colors hover:bg-accent/40">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 min-w-16 items-center justify-center rounded-sm px-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest ring-1",
                  INSIGHT_TONE[i.tone],
                )}
              >
                {i.tone}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{i.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{i.detail}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="text-primary">{i.asset}</span>
                  <span className="text-border-strong">│</span>
                  <span>Confidence <span className="text-foreground tabular-nums">{(i.confidence * 100).toFixed(0)}%</span></span>
                  <span className="text-border-strong">│</span>
                  <span>{i.id}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Processing Pipeline Status ---------- */

const PIPELINE_STAGES = [
  { label: "Ingestion", count: 4, tone: "primary", icon: HardDrive },
  { label: "OCR", count: 2, tone: "primary", icon: FileText },
  { label: "Chunking", count: 7, tone: "primary", icon: Boxes },
  { label: "Embedding", count: 12, tone: "primary", icon: Brain },
  { label: "Knowledge Extract", count: 3, tone: "primary", icon: Workflow },
  { label: "Graph Update", count: 1, tone: "success", icon: GitBranch },
] as const;

function PipelineStatus() {
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Processing Pipeline
          </h3>
        </div>
        <span className="rounded-sm bg-success/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-success ring-1 ring-success/30">
          Healthy
        </span>
      </div>
      <ul className="divide-y divide-border">
        {PIPELINE_STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.label} className="flex items-center gap-3 px-4 py-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary/10 ring-1 ring-primary/20">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{s.label}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full bg-linear-to-r from-primary/50 to-primary"
                    style={{ width: `${Math.min(100, s.count * 12 + 20)}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-muted-foreground">
                {s.count} in queue
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- System Health ---------- */

const HEALTH = [
  { name: "Gemini Gateway", status: "operational", latency: "312 ms" },
  { name: "Groq Inference", status: "operational", latency: "98 ms" },
  { name: "Neo4j Cluster", status: "operational", latency: "14 ms" },
  { name: "pgvector Index", status: "operational", latency: "8 ms" },
  { name: "LangGraph Runner", status: "degraded", latency: "1.2 s" },
  { name: "Object Storage", status: "operational", latency: "22 ms" },
];

function SystemHealth() {
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-success" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            System Health
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          5/6 nominal
        </span>
      </div>
      <ul className="divide-y divide-border">
        {HEALTH.map((h) => (
          <li key={h.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full live-dot",
                  h.status === "operational" && "bg-success",
                  h.status === "degraded" && "bg-signal",
                )}
              />
              <span className="truncate text-xs text-foreground">{h.name}</span>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {h.latency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Graph Statistics ---------- */

function GraphStatistics({ stats }: { stats?: any }) {
  const graphStats = [
    { label: "Equipment", value: stats?.equipment_count != null ? stats.equipment_count.toString() : "-", color: "var(--color-primary)" },
    { label: "Sensors", value: stats?.sensor_count != null ? stats.sensor_count.toString() : "-", color: "var(--color-success)" },
    { label: "Documents", value: stats?.documents_total != null ? stats.documents_total.toString() : "-", color: "var(--color-muted-foreground)" },
    { label: "Procedures", value: stats?.procedure_count != null ? stats.procedure_count.toString() : "-", color: "var(--color-signal)" },
    { label: "Failures", value: stats?.failure_count != null ? stats.failure_count.toString() : "-", color: "var(--color-destructive)" },
  ];
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Graph Statistics
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {stats?.graph_nodes != null ? `${stats.graph_nodes} nodes` : "Neo4j v5.19"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {graphStats.map((s) => (
          <li key={s.label} className="flex items-center gap-3 px-4 py-2.5">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-xs text-foreground">{s.label}</span>
            <span className="ml-auto font-mono text-xs tabular-nums text-foreground">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Recent Queries ---------- */

const RECENT_QUERIES = [
  { q: "What is the NPSH margin for P-101 at current suction pressure?", ago: "2m", user: "E. Nakamura" },
  { q: "List failure modes for API 610 centrifugal pumps in H2S service.", ago: "14m", user: "R. Alvarez" },
  { q: "Show SOPs referenced by HX-31 during the last 6 months.", ago: "38m", user: "J. Kim" },
  { q: "Which sensors feed the T-500 level control loop?", ago: "1h", user: "M. Osei" },
];

function RecentQueries() {
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Recent Queries
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          RAG · cited
        </span>
      </div>
      <ul className="divide-y divide-border">
        {RECENT_QUERIES.map((r, i) => (
          <li key={i} className="px-4 py-2.5">
            <p className="line-clamp-2 text-xs text-foreground">{r.q}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {r.user} · {r.ago} ago
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- AI Activity Timeline ---------- */

const TIMELINE = [
  { t: "00:42", icon: GitBranch, tone: "success", label: "Graph update", detail: "Rev 12 of Vendor Manual P-101 linked to 3 SOPs and 8 equipment nodes." },
  { t: "00:31", icon: Brain, tone: "primary", label: "Embedding batch", detail: "1,204 chunks embedded via text-embedding-004 · pgvector index refreshed." },
  { t: "00:18", icon: AlertTriangle, tone: "warning", label: "Predictive alert", detail: "Vibration harmonics on P-101 flagged as bearing-failure precursor." },
  { t: "00:09", icon: MessageSquare, tone: "primary", label: "RAG query", detail: "E. Nakamura queried NPSH margin — 4 citations returned in 1.2s." },
  { t: "00:02", icon: CheckCircle2, tone: "success", label: "Ingestion", detail: "PID-A-Unit300-Rev12.pdf parsed · 184 entities extracted." },
];

function AiActivityTimeline() {
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            AI Activity Timeline
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Last hour · UTC
        </span>
      </div>
      <ol className="relative divide-y divide-border">
        {TIMELINE.map((e, i) => {
          const Icon = e.icon;
          return (
            <li key={i} className="flex gap-4 px-4 py-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-sm ring-1",
                    e.tone === "success" && "bg-success/10 ring-success/30",
                    e.tone === "primary" && "bg-primary/10 ring-primary/30",
                    e.tone === "warning" && "bg-signal/10 ring-signal/30",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      e.tone === "success" && "text-success",
                      e.tone === "primary" && "text-primary",
                      e.tone === "warning" && "text-signal",
                    )}
                    aria-hidden
                  />
                </div>
                {i < TIMELINE.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="text-foreground tabular-nums">-{e.t}</span>
                  <span className="text-border-strong">│</span>
                  <span className="text-primary">{e.label}</span>
                </div>
                <p className="mt-1 text-xs text-foreground">{e.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Knowledge Graph Preview ---------- */

const GRAPH_NODES = [
  { id: "P-101", x: 190, y: 120, r: 22, kind: "pump", label: "P-101" },
  { id: "V-204", x: 90, y: 60, r: 14, kind: "valve", label: "V-204" },
  { id: "HX-31", x: 320, y: 70, r: 16, kind: "exchanger", label: "HX-31" },
  { id: "T-500", x: 60, y: 200, r: 18, kind: "tank", label: "T-500" },
  { id: "S-12", x: 300, y: 210, r: 12, kind: "sensor", label: "S-12" },
  { id: "SOP-9", x: 400, y: 150, r: 12, kind: "doc", label: "SOP-9" },
  { id: "PID-A", x: 180, y: 240, r: 12, kind: "doc", label: "PID-A" },
] as const;

const GRAPH_EDGES: Array<[string, string]> = [
  ["P-101", "V-204"],
  ["P-101", "HX-31"],
  ["P-101", "T-500"],
  ["P-101", "S-12"],
  ["HX-31", "SOP-9"],
  ["T-500", "PID-A"],
  ["V-204", "PID-A"],
  ["S-12", "SOP-9"],
];

const KIND_COLOR: Record<string, string> = {
  pump: "var(--color-primary)",
  valve: "var(--color-success)",
  exchanger: "var(--color-primary)",
  tank: "var(--color-signal)",
  sensor: "var(--color-success)",
  doc: "var(--color-muted-foreground)",
};

function KnowledgeGraphPreview() {
  const byId = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));

  return (
    <div className="relative col-span-1 overflow-hidden rounded-md border border-border bg-card/70 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Knowledge Graph · Unit 300
          </h3>
          <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            live
          </span>
        </div>
        <button className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
          Open explorer
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </button>
      </div>

      <div className="relative">
        <svg
          role="img"
          aria-label="Knowledge graph preview showing pump P-101 and related equipment"
          viewBox="0 0 480 280"
          className="h-[280px] w-full"
        >
          <defs>
            <pattern
              id="graphGrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="oklch(1 0 0 / 4%)"
                strokeWidth="1"
              />
            </pattern>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.74 0.11 220 / 40%)" />
              <stop offset="100%" stopColor="oklch(0.74 0.11 220 / 0)" />
            </radialGradient>
          </defs>

          <rect width="480" height="280" fill="url(#graphGrid)" />

          {/* Edges */}
          {GRAPH_EDGES.map(([a, b], i) => {
            const na = byId[a];
            const nb = byId[b];
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="oklch(1 0 0 / 14%)"
                strokeWidth={1}
                strokeDasharray={na.kind === "doc" || nb.kind === "doc" ? "3 3" : undefined}
              />
            );
          })}

          {/* Central node glow */}
          <circle cx={190} cy={120} r={44} fill="url(#nodeGlow)" />

          {/* Nodes */}
          {GRAPH_NODES.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill="var(--color-background)"
                stroke={KIND_COLOR[n.kind]}
                strokeWidth={n.id === "P-101" ? 2 : 1.25}
              />
              {n.id === "P-101" && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 4}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
              )}
              <text
                x={n.x}
                y={n.y + n.r + 12}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          <LegendDot color="var(--color-primary)" label="Equipment" />
          <LegendDot color="var(--color-success)" label="Sensor" />
          <LegendDot color="var(--color-signal)" label="Vessel" />
          <LegendDot color="var(--color-muted-foreground)" label="Document" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

/* ---------- Alerts panel ---------- */

type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  tag: string;
  message: string;
  time: string;
};

const ALERTS: Alert[] = [
  {
    id: "A-2081",
    severity: "critical",
    tag: "P-101",
    message: "Vibration exceeds ISO 10816 zone C · trend rising",
    time: "02m",
  },
  {
    id: "A-2079",
    severity: "warning",
    tag: "HX-31",
    message: "ΔP drift detected · fouling likely within 96h",
    time: "18m",
  },
  {
    id: "A-2074",
    severity: "warning",
    tag: "T-500",
    message: "Level sensor S-12 disagrees with radar by 4.2%",
    time: "41m",
  },
  {
    id: "A-2069",
    severity: "info",
    tag: "SOP-9",
    message: "Procedure revision v3.2 published · review required",
    time: "2h",
  },
];

const SEV_STYLES: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive ring-destructive/30",
  warning: "bg-signal/15 text-signal ring-signal/30",
  info: "bg-primary/15 text-primary ring-primary/30",
  high: "bg-destructive/15 text-destructive ring-destructive/30",
  medium: "bg-signal/15 text-signal ring-signal/30",
  low: "bg-primary/15 text-primary ring-primary/30",
};

function AlertsPanel({ alerts }: { alerts: any[] }) {
  const displayAlerts = alerts.length > 0 ? alerts : ALERTS;
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-signal" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Active Alerts
          </h3>
        </div>
        <span className="rounded-sm bg-signal/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal ring-1 ring-signal/30">
          {displayAlerts.length} open
        </span>
      </div>
      <ul className="divide-y divide-border h-64 overflow-y-auto">
        {displayAlerts.map((a: any) => (
          <li
            key={a.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 min-w-14 items-center justify-center rounded-sm px-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest ring-1",
                SEV_STYLES[a.severity] || SEV_STYLES.info,
              )}
            >
              {a.severity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <span className="font-mono text-xs text-primary">{a.tag || 'System'}</span>
                <span className="truncate">{a.message}</span>
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.id} · {a.created_at ? formatDistanceToNow(new Date(a.created_at)) : (a.time || '1m')} ago
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Recent Uploads ---------- */

const UPLOADS = [
  { name: "PID-A-Unit300-Rev12.pdf", size: "4.2 MB", status: "indexed", tag: "P&ID" },
  { name: "SOP-9_startup_v3.2.docx", size: "312 KB", status: "processing", tag: "SOP" },
  { name: "Vendor_Manual_P101.pdf", size: "18.7 MB", status: "indexed", tag: "Manual" },
  { name: "Inspection_Report_HX31.xlsx", size: "824 KB", status: "queued", tag: "Report" },
];

function RecentUploads({ documents }: { documents: any[] }) {
  const displayDocs = documents && documents.length > 0 ? documents : UPLOADS;
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Recent Ingestions
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Last 24h
        </span>
      </div>
      <ul className="divide-y divide-border h-64 overflow-y-auto">
        {displayDocs.slice(0, 5).map((u: any) => (
          <li key={u.id || u.name} className="flex items-center gap-3 px-4 py-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-surface/70 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {u.filename ? u.filename.slice(0, 3) : u.tag.slice(0, 3)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{u.filename || u.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {u.upload_date ? formatDistanceToNow(new Date(u.upload_date)) : u.size}
              </p>
            </div>
            <StatusChip status={u.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { c: string; label: string }> = {
    indexed: { c: "text-success bg-success/10 ring-success/30", label: "Indexed" },
    processing: { c: "text-primary bg-primary/10 ring-primary/30", label: "Processing" },
    queued: { c: "text-muted-foreground bg-muted/50 ring-border-strong", label: "Queued" },
  };
  const s = map[status] ?? map.queued;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1",
        s.c,
      )}
    >
      {status === "processing" && (
        <CircleDot className="h-2.5 w-2.5 live-dot" aria-hidden />
      )}
      {s.label}
    </span>
  );
}

/* ---------- Process telemetry ---------- */

function ProcessTelemetry() {
  const bars = [42, 61, 58, 74, 63, 82, 71, 55, 68, 79, 88, 74, 66, 70, 78, 84, 72, 65, 60, 70];
  return (
    <div className="rounded-md border border-border bg-card/70">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-success" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Process Telemetry
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Ingest rate · docs/hr
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-end justify-between gap-1.5 h-32">
          {bars.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-linear-to-t from-primary/40 to-primary/80"
              style={{ height: `${v}%` }}
              aria-hidden
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>−20h</span>
          <span>−10h</span>
          <span className="text-foreground">Now</span>
        </div>
      </div>
    </div>
  );
}
