import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Share2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Filter,
  GitBranch,
  FileText,
  Gauge,
  AlertTriangle,
  ClipboardList,
  Boxes,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeGraph } from "../hooks/useKnowledgeGraph";
import ForceGraph2D from "react-force-graph-2d";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph - Mhmm.ai" },
      {
        name: "description",
        content:
          "Interactive Neo4j-powered knowledge graph exploration of industrial equipment, failures, sensors, and documents.",
      },
    ],
  }),
  component: GraphPage,
});

const NODE_TYPES = [
  { key: "equipment", label: "Equipment", color: "#6b4c9b", icon: Gauge },
  { key: "sensor", label: "Sensors", color: "#16a34a", icon: GitBranch },
  { key: "document", label: "Documents", color: "#71547c", icon: FileText },
  { key: "procedure", label: "Procedures", color: "#d97706", icon: ClipboardList },
  { key: "failure", label: "Failures", color: "#dc2626", icon: AlertTriangle },
  { key: "asset", label: "Assets", color: "#8565b6", icon: Boxes },
];

const KIND_COLOR: Record<string, string> = {
  equipment: "#6b4c9b",
  sensor: "#16a34a",
  document: "#71547c",
  procedure: "#d97706",
  failure: "#dc2626",
  asset: "#8565b6",
};

function GraphPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const { data: graphData } = useKnowledgeGraph(selectedId, 2);

  const displayNodes = useMemo(() => {
    const nodeMap = new Map();
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach((n: any) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, {
            id: n.id,
            label: n.properties?.name || n.properties?.title || n.id,
            kind: n.label?.toLowerCase() || "equipment",
            ...n,
          });
        }
      });
    }
    return Array.from(nodeMap.values());
  }, [graphData]);

  const displayEdges = useMemo(() => {
    const edgesMap = new Map();
    if (graphData && graphData.edges) {
      graphData.edges.forEach((e: any) => {
        const edgeId = `${e.source}-${e.target}`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            source: e.source,
            target: e.target,
            type: e.type,
          });
        }
      });
    }
    return Array.from(edgesMap.values());
  }, [graphData]);

  const byId = Object.fromEntries(displayNodes.map((n) => [n.id, n]));
  const selected = selectedId && byId[selectedId] ? byId[selectedId] : (displayNodes.length > 0 ? displayNodes[0] : null);

  const neighbors = displayEdges
    .filter(
      (e) =>
        (typeof e.source === "string" ? e.source : (e.source as any).id) === selectedId ||
        (typeof e.target === "string" ? e.target : (e.target as any).id) === selectedId,
    )
    .map((e) => {
      const sId = typeof e.source === "string" ? e.source : (e.source as any).id;
      const tId = typeof e.target === "string" ? e.target : (e.target as any).id;
      return sId === selectedId ? tId : sId;
    });

  const fgRef = useRef<any>();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  return (
    <div className="space-y-6">
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
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Neo4j v5.19 · Live Graph Explorer
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Knowledge Graph Explorer
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground leading-relaxed">
              Explore interconnected equipment nodes, sensor feeds, procedures, and failure modes extracted by the LangGraph pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 live-dot" />
              Graph Active
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        {/* Left: legend & filters */}
        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <h3 className="text-xs font-bold text-foreground">Node Legend</h3>
            </div>
            <ul className="p-2 space-y-1">
              {NODE_TYPES.map((t) => {
                const Icon = t.icon;
                const count = displayNodes.filter((n) => n.kind === t.key).length;
                return (
                  <li key={t.key}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-primary/5">
                      <input type="checkbox" defaultChecked className="rounded border-primary/30 text-primary focus:ring-primary/20" />
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      <span className="font-semibold text-foreground flex-1">{t.label}</span>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Filter className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <h3 className="text-xs font-bold text-foreground">Graph Filters</h3>
            </div>
            <div className="space-y-3 p-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Unit</label>
                <select className="w-full rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none">
                  <option>All units</option>
                  <option>Unit 300</option>
                  <option>Unit 400</option>
                  <option>Utilities</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Traversal Depth</label>
                <input type="range" min={1} max={5} defaultValue={2} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Relationship Type</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["USES", "MEASURES", "REFERENCES", "FAILS_AS"].map((r) => (
                    <span key={r} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <h3 className="text-xs font-bold text-foreground">Graph Status</h3>
            </div>
            <div className="p-4 text-xs text-muted-foreground">
              {displayNodes.length > 0 ? (
                <p>{displayNodes.length} active nodes loaded in memory graph.</p>
              ) : (
                <p>No nodes ingested in knowledge graph yet.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Center: canvas */}
        <section className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                placeholder="Search nodes, tags, relationships..."
                className="h-9 w-full rounded-xl border border-border/60 bg-white/60 pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-bold">Force Layout</span>
              <span>· Depth 2 · Neo4j v5.19</span>
            </div>
          </div>

          {/* Force Graph canvas */}
          <div className="relative h-[580px] w-full bg-gradient-to-br from-primary/5 to-transparent">
            <ForceGraph2D
              ref={fgRef}
              graphData={{ nodes: displayNodes, links: displayEdges }}
              nodeLabel="label"
              nodeColor={(node: any) => KIND_COLOR[node.kind] || KIND_COLOR.equipment}
              nodeRelSize={6}
              linkColor={() => "rgba(107, 76, 155, 0.15)"}
              onNodeClick={(node: any) => setSelectedId(node.id)}
              width={800}
              height={580}
              backgroundColor="transparent"
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.label;
                const fontSize = 12 / globalScale;
                ctx.font = `600 ${fontSize}px Plus Jakarta Sans, sans-serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.4);

                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                ctx.beginPath();
                ctx.roundRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1],
                  4,
                );
                ctx.fill();

                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = node.id === selectedId ? "#6b4c9b" : KIND_COLOR[node.kind] || KIND_COLOR.equipment;
                ctx.fillText(label, node.x, node.y);

                node.__bckgDimensions = bckgDimensions;
              }}
              nodePointerAreaPaint={(node: any, color, ctx) => {
                ctx.fillStyle = color;
                const bckgDimensions = node.__bckgDimensions;
                if (bckgDimensions) {
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2,
                    node.y - bckgDimensions[1] / 2,
                    bckgDimensions[0],
                    bckgDimensions[1],
                  );
                }
              }}
            />

            {/* Zoom controls */}
            <div className="absolute right-4 top-4 flex flex-col rounded-2xl glass-panel overflow-hidden shadow-md">
              {[
                { icon: ZoomIn, label: "Zoom in", action: () => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400) },
                { icon: ZoomOut, label: "Zoom out", action: () => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400) },
                { icon: Maximize2, label: "Fit view", action: () => fgRef.current?.zoomToFit(400) },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.label}
                    aria-label={b.label}
                    onClick={b.action}
                    className="grid h-9 w-9 place-items-center border-b border-border/40 text-muted-foreground last:border-b-0 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                );
              })}
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 rounded-2xl glass-panel px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
              {NODE_TYPES.slice(0, 5).map((t) => (
                <span key={t.key} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right: node detail */}
        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Gauge className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <h3 className="text-xs font-bold text-foreground">Selected Node</h3>
            </div>
            <div className="p-4">
              {selected ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                      style={{ background: KIND_COLOR[selected.kind] || KIND_COLOR.equipment }}
                    />
                    <p className="text-lg font-bold text-foreground">{selected.label}</p>
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {selected.kind}
                  </span>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border/50 bg-white/50 p-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Degree</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-foreground">{neighbors.length}</dd>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-white/50 p-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Docs</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-foreground">14</dd>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-white/50 p-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sensors</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-foreground">6</dd>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-white/50 p-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk Level</dt>
                      <dd className="mt-0.5 text-xs font-bold text-amber-600">Elevated</dd>
                    </div>
                  </dl>

                  <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 cursor-pointer transition-all">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Ask AI about {selected.label}
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No node selected.</p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <GitBranch className="h-3.5 w-3.5 text-primary" aria-hidden />
              </div>
              <h3 className="text-xs font-bold text-foreground">Relationships ({neighbors.length})</h3>
            </div>
            <ul className="divide-y divide-border/40 text-xs max-h-56 overflow-y-auto">
              {neighbors.map((id) => {
                const n = byId[id];
                return (
                  <li key={id}>
                    <button
                      onClick={() => setSelectedId(n.id)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: KIND_COLOR[n?.kind] || KIND_COLOR.equipment }}
                      />
                      <span className="font-bold text-primary truncate">{n?.label || id}</span>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {n?.kind || "unknown"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Graph Statistics</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <StatBlock label="Nodes" value={displayNodes.length.toString()} />
              <StatBlock label="Edges" value={displayEdges.length.toString()} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-white/50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
