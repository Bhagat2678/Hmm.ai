import { createFileRoute, Link } from "@tanstack/react-router";
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
  Search,
  Upload,
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
  hint: string;
  icon: typeof FileText;
  tone: "purple" | "emerald" | "amber" | "red" | "blue";
};

function DashboardPage() {
  const { documents, alerts, stats } = useDashboard();

  const totalDocs = documents?.length || 0;
  const totalAlerts = alerts?.filter((a: any) => !a.acknowledged).length || 0;

  const METRICS: Metric[] = [
    {
      label: "Knowledge Documents",
      value: totalDocs.toString(),
      unit: "docs",
      hint: "Ingested & indexed",
      icon: FileText,
      tone: "purple",
    },
    {
      label: "Graph Nodes",
      value: stats?.graph_nodes != null ? stats.graph_nodes.toLocaleString() : "—",
      unit: "nodes",
      hint: "Neo4j knowledge graph",
      icon: Network,
      tone: "blue",
    },
    {
      label: "Relationships",
      value: stats?.graph_edges != null ? stats.graph_edges.toLocaleString() : "—",
      unit: "edges",
      hint: "Extracted by LangGraph",
      icon: GitBranch,
      tone: "purple",
    },
    {
      label: "Industrial Assets",
      value: stats?.equipment_count != null ? stats.equipment_count.toString() : "—",
      unit: "assets",
      hint: "Equipment entities",
      icon: Gauge,
      tone: "emerald",
    },
    {
      label: "AI Queries · 24h",
      value: stats?.queries_24h != null ? stats.queries_24h.toString() : "—",
      unit: "runs",
      hint: "Gemini + Groq RAG",
      icon: Cpu,
      tone: "amber",
    },
    {
      label: "Active Alerts",
      value: totalAlerts.toString(),
      unit: "open",
      hint: "Requires attention",
      icon: BellRing,
      tone: totalAlerts > 0 ? "red" : "emerald",
    },
  ];

  const TONE_STYLES: Record<string, { bg: string; icon: string; badge: string }> = {
    purple: {
      bg: "bg-primary/10 border-primary/20",
      icon: "bg-primary/15 text-primary",
      badge: "text-primary",
    },
    blue: {
      bg: "bg-blue-50 border-blue-200/60",
      icon: "bg-blue-100 text-blue-600",
      badge: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50 border-emerald-200/60",
      icon: "bg-emerald-100 text-emerald-600",
      badge: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50 border-amber-200/60",
      icon: "bg-amber-100 text-amber-600",
      badge: "text-amber-600",
    },
    red: {
      bg: "bg-red-50 border-red-200/60",
      icon: "bg-red-100 text-red-600",
      badge: "text-red-600",
    },
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl glass-panel p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 70% 50%, rgba(236,220,255,0.5) 0%, transparent 65%)",
          }}
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Live · Bedrock Operations Overview
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Industrial Knowledge Intelligence
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Unified view of ingested engineering knowledge, live alerts, and equipment
              intelligence for on-shift operators and reliability engineers.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/query"
              search={{ q: undefined }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:brightness-110 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-xl glass-panel border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
            >
              <Upload className="h-4 w-4" />
              Ingest Data
            </Link>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-border/50 pt-6">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift</dt>
            <dd className="mt-1 text-sm font-bold text-foreground">A · Day</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uptime</dt>
            <dd className="mt-1 text-sm font-bold text-emerald-600">99.982%</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Sync</dt>
            <dd className="mt-1 text-sm font-bold text-foreground tabular-nums">00:42s</dd>
          </div>
        </dl>
      </header>

      {/* Metrics */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const tone = TONE_STYLES[m.tone];
          return (
            <div
              key={m.label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border glass-panel p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                tone.bg,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone.icon)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className={cn("text-2xl font-bold tabular-nums tracking-tight", tone.badge)}>
                  {m.value}
                  {m.unit && (
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">{m.unit}</span>
                  )}
                </p>
                <p className="text-xs font-semibold text-foreground">{m.label}</p>
                <p className="text-[11px] text-muted-foreground">{m.hint}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Knowledge Graph Preview + Alerts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KnowledgeGraphPreview stats={stats} />
        <AlertsPanel alerts={alerts || []} />
      </section>

      {/* AI Insights + Process Telemetry */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AiInsightsPanel />
        <ProcessTelemetry stats={stats} />
      </section>

      {/* System Health + Graph Stats + Recent Uploads */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SystemHealth />
        <GraphStatistics stats={stats} />
        <RecentUploads documents={documents || []} />
      </section>
    </div>
  );
}

/* ---------- Shared Glass Card + Card Header ---------- */

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl overflow-hidden", className)}>
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  badge,
  action,
}: {
  icon: typeof FileText;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        {badge}
      </div>
      {action}
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

const INSIGHTS: Insight[] = [];

const INSIGHT_PILL: Record<Insight["tone"], string> = {
  critical: "bg-red-100 text-red-700 ring-red-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  info: "bg-primary/10 text-primary ring-primary/20",
};

function AiInsightsPanel() {
  return (
    <GlassCard className="col-span-1 lg:col-span-2">
      <CardHeader
        icon={Sparkles}
        title="AI Operational Insights"
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            Gemini · RAG
          </span>
        }
      />
      {INSIGHTS.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          No operational insights generated. Upload engineering documents to extract AI insights.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {INSIGHTS.map((i) => (
            <li key={i.id} className="px-5 py-4 transition-colors hover:bg-primary/5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 min-w-[4rem] items-center justify-center rounded-full px-2 text-[10px] font-bold uppercase ring-1",
                    INSIGHT_PILL[i.tone],
                  )}
                >
                  {i.tone}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{i.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{i.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-primary">{i.asset}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground">
                      Confidence <span className="font-bold text-foreground tabular-nums">{(i.confidence * 100).toFixed(0)}%</span>
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-mono text-muted-foreground">{i.id}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/* ---------- Processing Pipeline ---------- */

const PIPELINE_STAGES = [
  { label: "Ingestion", count: 0, icon: HardDrive },
  { label: "OCR", count: 0, icon: FileText },
  { label: "Chunking", count: 0, icon: Boxes },
  { label: "Embedding", count: 0, icon: Brain },
  { label: "Knowledge Extract", count: 0, icon: Workflow },
  { label: "Graph Update", count: 0, icon: GitBranch },
] as const;

function PipelineStatus() {
  return (
    <GlassCard>
      <CardHeader
        icon={Workflow}
        title="Processing Pipeline"
        badge={
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            Idle
          </span>
        }
      />
      <ul className="divide-y divide-border/40">
        {PIPELINE_STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.label} className="flex items-center gap-3 px-5 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${s.count * 10}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
                {s.count} queued
              </span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

/* ---------- System Health ---------- */

const HEALTH = [
  { name: "Gemini Gateway", status: "operational", badge: "Active" },
  { name: "Groq Inference", status: "operational", badge: "Active" },
  { name: "Neo4j Cluster", status: "operational", badge: "Connected" },
  { name: "pgvector Index", status: "operational", badge: "Connected" },
  { name: "LangGraph Runner", status: "operational", badge: "Ready" },
  { name: "Object Storage", status: "operational", badge: "Ready" },
];

function SystemHealth() {
  return (
    <GlassCard>
      <CardHeader
        icon={Zap}
        title="System Health"
        action={<span className="text-xs font-semibold text-muted-foreground">Operational</span>}
      />
      <ul className="divide-y divide-border/40">
        {HEALTH.map((h) => (
          <li key={h.name} className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-full live-dot flex-shrink-0",
                  h.status === "operational" ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              <span className="truncate text-xs font-medium text-foreground">{h.name}</span>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 ml-2">
              {h.badge}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

/* ---------- Graph Statistics ---------- */

function GraphStatistics({ stats }: { stats?: any }) {
  const graphStats = [
    { label: "Equipment", value: stats?.equipment_count ?? 0, color: "bg-primary", textColor: "text-primary" },
    { label: "Sensors", value: stats?.sensor_count ?? 0, color: "bg-emerald-500", textColor: "text-emerald-600" },
    { label: "Documents", value: stats?.documents_total ?? 0, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
    { label: "Procedures", value: stats?.procedure_count ?? 0, color: "bg-amber-500", textColor: "text-amber-600" },
    { label: "Failures", value: stats?.failure_count ?? 0, color: "bg-red-500", textColor: "text-red-600" },
  ];
  return (
    <GlassCard>
      <CardHeader
        icon={Network}
        title="Graph Statistics"
        action={
          <span className="text-[11px] font-semibold text-muted-foreground">
            {stats?.graph_nodes != null ? `${stats.graph_nodes} nodes` : "0 nodes"}
          </span>
        }
      />
      <ul className="divide-y divide-border/40">
        {graphStats.map((s) => (
          <li key={s.label} className="flex items-center gap-3 px-5 py-2.5">
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", s.color)} />
            <span className="text-xs font-medium text-foreground flex-1">{s.label}</span>
            <span className={cn("font-mono text-xs font-bold tabular-nums", s.textColor)}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

/* ---------- Recent Queries ---------- */

const RECENT_QUERIES: any[] = [];

function RecentQueries() {
  return (
    <GlassCard>
      <CardHeader
        icon={MessageSquare}
        title="Recent Queries"
        badge={
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">RAG</span>
        }
      />
      {RECENT_QUERIES.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          No queries recorded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {RECENT_QUERIES.map((r, i) => (
            <li key={i} className="px-5 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
              <p className="line-clamp-2 text-xs font-medium text-foreground">{r.q}</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                {r.user} · {r.ago} ago
              </p>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/* ---------- AI Activity Timeline ---------- */

const TIMELINE: any[] = [];

const TIMELINE_TONE: Record<string, { icon: string; ring: string }> = {
  emerald: { icon: "bg-emerald-100 text-emerald-600", ring: "ring-emerald-200" },
  purple: { icon: "bg-primary/10 text-primary", ring: "ring-primary/20" },
  amber: { icon: "bg-amber-100 text-amber-600", ring: "ring-amber-200" },
};

function AiActivityTimeline() {
  return (
    <GlassCard>
      <CardHeader
        icon={TrendingUp}
        title="AI Activity Timeline"
        action={<span className="text-[11px] font-semibold text-muted-foreground">Last hour · UTC</span>}
      />
      {TIMELINE.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          No recent AI activity recorded.
        </div>
      ) : (
        <ol className="relative divide-y divide-border/40">
          {TIMELINE.map((e, i) => {
            const Icon = e.icon;
            const t = TIMELINE_TONE[e.tone] || TIMELINE_TONE.purple;
            return (
              <li key={i} className="flex gap-4 px-5 py-4">
                <div className="flex flex-col items-center">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1", t.icon, t.ring)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{e.label}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{e.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </GlassCard>
  );
}

/* ---------- Knowledge Graph Preview ---------- */

const KIND_COLOR: Record<string, string> = {
  pump: "#6b4c9b",
  valve: "#16a34a",
  exchanger: "#8565b6",
  tank: "#d97706",
  sensor: "#16a34a",
  doc: "#71547c",
};

function KnowledgeGraphPreview({ stats }: { stats?: any }) {
  const hasNodes = (stats?.graph_nodes ?? 0) > 0;

  return (
    <Link to="/graph" className="group block col-span-1 lg:col-span-2 cursor-pointer">
      <GlassCard className="h-full transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg">
        <CardHeader
          icon={Network}
          title="Knowledge Graph Preview"
          badge={
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {hasNodes ? `${stats.graph_nodes} nodes` : "0 nodes"}
            </span>
          }
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
              Open explorer <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          }
        />
        <div className="relative bg-gradient-to-br from-primary/5 via-white/20 to-primary/5 h-[280px] flex items-center justify-center overflow-hidden p-4">
          {!hasNodes ? (
            <div className="text-center p-6 space-y-2">
              <Network className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs font-semibold text-foreground">Knowledge Graph Empty</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Ingest engineering manuals or SOPs to automatically extract entities and relationships.
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-between">
              {/* Mini Interactive SVG Visual Nodes */}
              <svg className="w-full h-[200px] pointer-events-none" viewBox="0 0 400 200">
                {/* Edges */}
                <line x1="80" y1="100" x2="200" y2="60" stroke="#6b4c9b" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
                <line x1="200" y1="60" x2="320" y2="100" stroke="#6b4c9b" strokeWidth="2" strokeOpacity="0.25" />
                <line x1="200" y1="60" x2="200" y2="150" stroke="#16a34a" strokeWidth="2" strokeOpacity="0.25" />
                <line x1="80" y1="100" x2="200" y2="150" stroke="#d97706" strokeWidth="2" strokeOpacity="0.2" />

                {/* Node P-101 */}
                <g transform="translate(80, 100)">
                  <circle r="22" fill="#6b4c9b" fillOpacity="0.15" />
                  <circle r="14" fill="#6b4c9b" />
                  <text y="26" textAnchor="middle" fill="#1e1b4b" fontSize="10" fontWeight="bold">P-101</text>
                </g>

                {/* Node V-204 */}
                <g transform="translate(200, 60)">
                  <circle r="26" fill="#8565b6" fillOpacity="0.15" />
                  <circle r="16" fill="#8565b6" />
                  <text y="28" textAnchor="middle" fill="#1e1b4b" fontSize="10" fontWeight="bold">V-204</text>
                </g>

                {/* Node HX-31 */}
                <g transform="translate(320, 100)">
                  <circle r="22" fill="#d97706" fillOpacity="0.15" />
                  <circle r="14" fill="#d97706" />
                  <text y="26" textAnchor="middle" fill="#1e1b4b" fontSize="10" fontWeight="bold">HX-31</text>
                </g>

                {/* Node TT-101 */}
                <g transform="translate(200, 150)">
                  <circle r="20" fill="#16a34a" fillOpacity="0.15" />
                  <circle r="12" fill="#16a34a" />
                  <text y="24" textAnchor="middle" fill="#1e1b4b" fontSize="10" fontWeight="bold">TT-101</text>
                </g>
              </svg>

              <div className="w-full flex items-center justify-between px-4 pb-2 border-t border-border/30 text-xs">
                <span className="font-bold text-foreground">
                  {stats.graph_nodes} Active Nodes · {stats.graph_edges || 0} Edges
                </span>
                <span className="text-[11px] font-bold text-primary group-hover:underline">
                  Click to Explore Graph Canvas &rarr;
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

/* ---------- Alerts Panel ---------- */

type DashAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  tag: string;
  message: string;
  time: string;
};

const SEV_PILL: Record<string, string> = {
  critical: "bg-red-100 text-red-700 ring-red-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  info: "bg-primary/10 text-primary ring-primary/20",
  high: "bg-red-100 text-red-700 ring-red-200",
  medium: "bg-amber-100 text-amber-700 ring-amber-200",
  low: "bg-primary/10 text-primary ring-primary/20",
};

function AlertsPanel({ alerts }: { alerts: any[] }) {
  const displayAlerts = alerts || [];
  return (
    <GlassCard>
      <CardHeader
        icon={ShieldAlert}
        title="Active Alerts"
        badge={
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
            {displayAlerts.length} open
          </span>
        }
        action={
          <Link to="/alerts" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      {displayAlerts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-xs font-bold text-foreground">No Active Alerts</p>
          <p className="text-[11px] text-muted-foreground">Systems operating within normal thresholds.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40 h-64 overflow-y-auto">
          {displayAlerts.map((a: any) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-primary/5">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 min-w-[3.5rem] items-center justify-center rounded-full px-2 text-[10px] font-bold uppercase ring-1 flex-shrink-0",
                  SEV_PILL[a.severity] || SEV_PILL.info,
                )}
              >
                {a.severity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="font-bold text-primary flex-shrink-0">{a.tag || "System"}</span>
                  <span className="truncate">{a.title || a.message}</span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                  {a.id} · {a.created_at ? formatDistanceToNow(new Date(a.created_at)) : (a.time || "1m")} ago
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/* ---------- Recent Uploads ---------- */

function RecentUploads({ documents }: { documents: any[] }) {
  const displayDocs = documents || [];
  return (
    <GlassCard>
      <CardHeader
        icon={FileText}
        title="Recent Ingestions"
        action={<span className="text-[11px] font-semibold text-muted-foreground">Last 24h</span>}
      />
      {displayDocs.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <FileText className="h-8 w-8 text-primary/40" />
          <p className="text-xs font-bold text-foreground">No Documents Ingested</p>
          <p className="text-[11px] text-muted-foreground">Upload P&IDs, manuals, or SOPs to build knowledge base.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40 h-64 overflow-y-auto">
          {displayDocs.slice(0, 5).map((u: any) => (
            <li key={u.id || u.name} className="flex items-center gap-3 px-5 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-[10px] uppercase text-primary">
                {(u.filename || u.name || "").slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{u.filename || u.name}</p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {u.upload_date ? formatDistanceToNow(new Date(u.upload_date)) : u.size}
                </p>
              </div>
              <StatusChip status={u.status} />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { c: string; label: string }> = {
    indexed: { c: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Indexed" },
    ingested: { c: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Ingested" },
    completed: { c: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Completed" },
    processing: { c: "bg-primary/10 text-primary ring-primary/20", label: "Processing" },
    pending: { c: "bg-amber-100 text-amber-700 ring-amber-200", label: "Pending" },
    queued: { c: "bg-muted text-muted-foreground ring-border", label: "Queued" },
    paused: { c: "bg-amber-100 text-amber-700 ring-amber-200", label: "Paused" },
    failed: { c: "bg-red-100 text-red-700 ring-red-200", label: "Failed" },
  };
  const s = map[status] ?? map.queued;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 flex-shrink-0",
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

/* ---------- Process Telemetry ---------- */

function ProcessTelemetry({ stats }: { stats?: any }) {
  const metrics = [
    { label: "Documents Ingested", value: stats?.documents_total ?? 0, color: "text-foreground" },
    { label: "PGVector Chunks", value: stats?.chunks_total ?? 0, color: "text-foreground" },
    { label: "Graph Nodes", value: stats?.graph_nodes ?? 0, color: "text-primary" },
    { label: "Graph Edges", value: stats?.graph_edges ?? 0, color: "text-emerald-600" },
  ];

  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <CardHeader
        icon={Activity}
        title="Process Telemetry"
        action={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Live Backend Metrics
          </span>
        }
      />
      <div className="p-5 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-h-[28px] flex items-center justify-center">
                {m.label}
              </p>
              <p className={cn("text-2xl font-extrabold mt-1 tabular-nums tracking-tight", m.color)}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// Suppress unused import warnings
const _unused = Search;
