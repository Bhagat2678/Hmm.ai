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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeGraph } from "../hooks/useKnowledgeGraph";
import ForceGraph2D from "react-force-graph-2d";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph — Mhmm.ai" },
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
  { key: "equipment", label: "Equipment", count: 8204, color: "var(--color-primary)", icon: Gauge },
  { key: "sensor", label: "Sensors", count: 42180, color: "var(--color-success)", icon: GitBranch },
  { key: "document", label: "Documents", count: 12847, color: "var(--color-muted-foreground)", icon: FileText },
  { key: "procedure", label: "Procedures", count: 3412, color: "var(--color-signal)", icon: ClipboardList },
  { key: "failure", label: "Failures", count: 1982, color: "var(--color-destructive)", icon: AlertTriangle },
  { key: "asset", label: "Assets", count: 6104, color: "oklch(0.7 0.12 300)", icon: Boxes },
];

const KIND_COLOR: Record<string, string> = {
  equipment: "var(--color-primary)",
  sensor: "var(--color-success)",
  document: "var(--color-muted-foreground)",
  procedure: "var(--color-signal)",
  failure: "var(--color-destructive)",
  asset: "oklch(0.7 0.12 300)",
};

function GraphPage() {
  const [selectedId, setSelectedId] = useState<string>("P-101");
  const { data: graphData, isLoading } = useKnowledgeGraph(selectedId, 2);

  const displayNodes = useMemo(() => {
    const nodeMap = new Map();
    
    // Use only API data
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach((n: any) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, {
            id: n.id,
            label: n.properties?.name || n.properties?.title || n.id,
            kind: n.label?.toLowerCase() || "equipment",
            ...n
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
  const selected = (selectedId && byId[selectedId]) ? byId[selectedId] : displayNodes[0];

  const neighbors = displayEdges.filter(e => 
    (typeof e.source === 'string' ? e.source : (e.source as any).id) === selectedId || 
    (typeof e.target === 'string' ? e.target : (e.target as any).id) === selectedId
  ).map(e => {
    const sId = typeof e.source === 'string' ? e.source : (e.source as any).id;
    const tId = typeof e.target === 'string' ? e.target : (e.target as any).id;
    return sId === selectedId ? tId : sId;
  });

  const fgRef = useRef<any>();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Mhmm.ai · Knowledge Graph
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Knowledge Graph Explorer
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Interactive Neo4j graph of equipment, sensors, procedures, failures,
          and documents. Explore relationships extracted by the LangGraph
          ingestion pipeline.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        {/* Left: legend & filters */}
        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-card/70">
            <div className="border-b border-border px-3 py-2.5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                Node Legend
              </p>
            </div>
            <ul className="p-2">
              {NODE_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.key}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent/40">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: t.color }}
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      <span className="text-foreground">{t.label}</span>
                      <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                        {t.count.toLocaleString()}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card/70">
            <div className="border-b border-border px-3 py-2.5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Filters
              </p>
            </div>
            <div className="space-y-2 p-3 text-xs">
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Unit</p>
                <select className="w-full rounded-md border border-input bg-surface/70 px-2 py-1.5 text-xs text-foreground">
                  <option>All units</option><option>Unit 300</option><option>Unit 400</option><option>Utilities</option>
                </select>
              </div>
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Depth</p>
                <input type="range" min={1} max={5} defaultValue={2} className="w-full accent-primary" />
              </div>
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Rel. type</p>
                <div className="flex flex-wrap gap-1">
                  {["USES", "MEASURES", "REFERENCES", "FAILS_AS"].map((r) => (
                    <span key={r} className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-foreground">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card/70">
            <div className="border-b border-border px-3 py-2.5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Recent updates
              </p>
            </div>
            <ul className="divide-y divide-border text-xs">
              {[
                { t: "Rev 12 of MAN-P101 linked", w: "2m ago" },
                { t: "New failure node F-BRG added", w: "18m ago" },
                { t: "SOP-12 re-embedded", w: "1h ago" },
              ].map((u, i) => (
                <li key={i} className="px-3 py-2">
                  <p className="text-foreground">{u.t}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{u.w}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Center: canvas */}
        <section className="relative overflow-hidden rounded-md border border-border bg-card/70">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                placeholder="Search nodes, tags, relationships…"
                className="h-8 w-full rounded-md border border-input bg-surface/70 pl-8 pr-3 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Force layout · depth 2</span>
              <span className="text-border-strong">│</span>
              <span>Neo4j v5.19</span>
            </div>
          </div>

          {/* Force Graph canvas */}
          <div className="relative h-[580px] w-full">
            <ForceGraph2D
              ref={fgRef}
              graphData={{ nodes: displayNodes, links: displayEdges }}
              nodeLabel="label"
              nodeColor={(node: any) => KIND_COLOR[node.kind] || KIND_COLOR.equipment}
              nodeRelSize={6}
              linkColor={() => "rgba(255, 255, 255, 0.1)"}
              onNodeClick={(node: any) => setSelectedId(node.id)}
              width={900}
              height={580}
              backgroundColor="transparent"
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.label;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.id === selectedId ? '#ffffff' : (KIND_COLOR[node.kind] || KIND_COLOR.equipment);
                ctx.fillText(label, node.x, node.y);

                node.__bckgDimensions = bckgDimensions;
              }}
              nodePointerAreaPaint={(node: any, color, ctx) => {
                ctx.fillStyle = color;
                const bckgDimensions = node.__bckgDimensions;
                bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
              }}
            />
          </div>

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-border bg-background/80 backdrop-blur">
              {[
                { icon: ZoomIn, label: "Zoom in", action: () => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400) },
                { icon: ZoomOut, label: "Zoom out", action: () => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400) },
                { icon: Maximize2, label: "Fit", action: () => fgRef.current?.zoomToFit(400) },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.label}
                    aria-label={b.label}
                    onClick={b.action}
                    className="grid h-8 w-8 place-items-center border-b border-border text-muted-foreground last:border-b-0 hover:bg-accent hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                );
              })}
            </div>

            {/* Minimap (Hidden for ForceGraph) */}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur">
              {NODE_TYPES.slice(0, 5).map((t) => (
                <span key={t.key} className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </section>

        {/* Right: node detail */}
        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-card/70">
            <div className="border-b border-border px-3 py-2.5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Selected Node
              </p>
            </div>
            <div className="p-3">
              {selected ? (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-3 w-3 rounded-full"
                      style={{ background: KIND_COLOR[selected.kind] || KIND_COLOR.equipment }}
                    />
                    <p className="font-mono text-lg font-semibold text-foreground">{selected.label}</p>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                    {selected.kind}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Degree</dt>
                      <dd className="mt-0.5 font-mono tabular-nums text-foreground">{neighbors.length}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Docs</dt>
                      <dd className="mt-0.5 font-mono tabular-nums text-foreground">14</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Sensors</dt>
                      <dd className="mt-0.5 font-mono tabular-nums text-foreground">6</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Risk</dt>
                      <dd className="mt-0.5 text-signal">Elevated</dd>
                    </div>
                  </dl>

                  <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Ask Mhmm.ai about {selected.label}
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No node selected.</p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-border bg-card/70">
            <div className="border-b border-border px-3 py-2.5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Relationships · {neighbors.length}
              </p>
            </div>
            <ul className="divide-y divide-border text-xs">
              {neighbors.map((id) => {
                const n = byId[id];
                return (
                  <li key={id}>
                    <button
                      onClick={() => setSelectedId(n.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/40"
                    >
                      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[n?.kind] || KIND_COLOR.equipment }} />
                      <span className="font-mono text-primary">{n?.label || id}</span>
                      <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {n?.kind || "unknown"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card/70 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Graph stats</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <StatBlock label="Nodes" value={displayNodes.length.toString()} />
              <StatBlock label="Edges" value={displayEdges.length.toString()} />
              <StatBlock label="Labels" value="-" />
              <StatBlock label="Rel types" value="-" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-sm border border-border bg-surface/60 p-2")}>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
