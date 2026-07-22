import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph - Bedrock" },
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
  { key: "equipment", label: "Equipment", color: "#8b5cf6", icon: Gauge },   // Vibrant Violet/Purple
  { key: "sensor", label: "Sensors", color: "#10b981", icon: GitBranch },    // Vibrant Green
  { key: "document", label: "Documents", color: "#64748b", icon: FileText },  // Slate Gray
  { key: "procedure", label: "Procedures", color: "#f59e0b", icon: ClipboardList }, // Orange/Amber
  { key: "failure", label: "Failures", color: "#ef4444", icon: AlertTriangle }, // Red
  { key: "asset", label: "Assets", color: "#3b82f6", icon: Boxes },           // Blue
  { key: "entity", label: "Entities", color: "#6366f1", icon: Boxes },        // Indigo
];

const KIND_COLOR: Record<string, string> = {
  equipment: "#8b5cf6",
  sensor: "#10b981",
  document: "#64748b",
  procedure: "#f59e0b",
  failure: "#ef4444",
  asset: "#3b82f6",
  entity: "#6366f1",
};

function GraphPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeKinds, setActiveKinds] = useState<string[]>([
    "equipment",
    "sensor",
    "document",
    "procedure",
    "failure",
    "asset",
    "entity",
  ]);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);

  useEffect(() => {
    import("react-force-graph-2d").then((mod) => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  const [depth, setDepth] = useState<number>(2);
  const [selectedUnit, setSelectedUnit] = useState<string>("All units");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRels, setSelectedRels] = useState<string[]>([
    "USES",
    "MEASURES",
    "REFERENCES",
    "FAILS_AS",
    "MENTIONED_IN",
    "VALVE_FOR",
  ]);

  const { data: graphData } = useKnowledgeGraph("", depth);

  const displayNodes = useMemo(() => {
    const nodeMap = new Map();
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      graphData.nodes.forEach((n: any) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, {
            id: n.id,
            label: n.properties?.name || n.properties?.filename || n.properties?.title || n.label || n.id,
            kind: (() => {
              const label = (n.label || "equipment").toLowerCase();
              const name = (n.properties?.name || n.properties?.tag || n.id || "").toUpperCase();
              if (label === "equipment") {
                if (name.startsWith("TT-") || name.startsWith("PT-") || name.startsWith("LT-") || name.startsWith("FT-") || (name.includes("SENSOR") && !name.includes("SOP-"))) {
                  return "sensor";
                }
              }
              return label;
            })(),
            ...n,
          });
        }
      });
      return Array.from(nodeMap.values());
    }
    return [];
  }, [graphData]);

  const displayEdges = useMemo(() => {
    const edgesMap = new Map();
    if (graphData && graphData.edges && graphData.edges.length > 0) {
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
      return Array.from(edgesMap.values());
    }
    return [];
  }, [graphData]);

  const visibleNodes = useMemo(
    () =>
      displayNodes.filter((n) => {
        const matchKind = activeKinds.includes(n.kind);
        const matchSearch =
          !searchQuery ||
          (n.label && n.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (n.id && n.id.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchUnit =
          selectedUnit === "All units" ||
          (n.properties?.unit && n.properties.unit.toLowerCase() === selectedUnit.toLowerCase());
        return matchKind && matchSearch && matchUnit;
      }),
    [displayNodes, activeKinds, searchQuery, selectedUnit],
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () =>
      displayEdges.filter(
        (e) =>
          visibleNodeIds.has(typeof e.source === "string" ? e.source : (e.source as any).id) &&
          visibleNodeIds.has(typeof e.target === "string" ? e.target : (e.target as any).id) &&
          (selectedRels.length === 0 || selectedRels.includes(e.type?.toUpperCase())),
      ),
    [displayEdges, visibleNodeIds, selectedRels],
  );

  const byId = Object.fromEntries(displayNodes.map((n) => [n.id, n]));
  const selected = selectedId && byId[selectedId] ? byId[selectedId] : (visibleNodes.length > 0 ? visibleNodes[0] : null);

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

  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData, activeKinds]);

  // Center and highlight node when searching
  useEffect(() => {
    if (!searchQuery.trim() || visibleNodes.length === 0) return;
    const q = searchQuery.toLowerCase().trim();
    const match = visibleNodes.find((n) => {
      const idText = (n.id || "").toLowerCase();
      const labelText = (n.label || "").toLowerCase();
      const nameText = (n.properties?.name || "").toLowerCase();
      const fileText = (n.properties?.filename || "").toLowerCase();
      return idText.includes(q) || labelText.includes(q) || nameText.includes(q) || fileText.includes(q);
    });

    if (match) {
      setSelectedId(match.id);
      if (fgRef.current && typeof match.x === "number" && typeof match.y === "number") {
        fgRef.current.centerAt(match.x, match.y, 400);
        fgRef.current.zoom(2.5, 400);
      }
    }
  }, [searchQuery, visibleNodes]);

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
                      <input
                        type="checkbox"
                        checked={activeKinds.includes(t.key)}
                        onChange={() =>
                          setActiveKinds((prev) =>
                            prev.includes(t.key) ? prev.filter((k) => k !== t.key) : [...prev, t.key]
                          )
                        }
                        className="rounded border-primary/30 text-primary focus:ring-primary/20 cursor-pointer"
                      />
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
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="All units">All units</option>
                  <option value="Unit 300">Unit 300</option>
                  <option value="Unit 400">Unit 400</option>
                  <option value="Utilities">Utilities</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Traversal Depth</label>
                  <span className="font-mono text-[11px] font-bold text-primary">{depth}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Relationship Type</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["USES", "MEASURES", "REFERENCES", "FAILS_AS", "MENTIONED_IN", "VALVE_FOR"].map((r) => {
                    const active = selectedRels.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() =>
                          setSelectedRels((prev) =>
                            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
                          )
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer",
                          active
                            ? "bg-primary text-white shadow-xs"
                            : "bg-primary/10 text-primary hover:bg-primary/20",
                        )}
                      >
                        {r}
                      </button>
                    );
                  })}
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
                <p>{visibleNodes.length} of {displayNodes.length} active nodes displayed.</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes, tags, relationships..."
                className="h-9 w-full rounded-xl border border-border/60 bg-white/60 pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-bold">Force Layout</span>
              <span>· Depth {depth} · Neo4j v5.19</span>
            </div>
          </div>

          {/* Force Graph canvas */}
          <div className="relative h-[580px] w-full bg-gradient-to-br from-primary/5 to-transparent">
            {ForceGraph2D && (
              <ForceGraph2D
                ref={fgRef}
                graphData={{ nodes: visibleNodes, links: visibleEdges }}
                nodeLabel="label"
                nodeColor={(node: any) => KIND_COLOR[node.kind] || KIND_COLOR.equipment}
                nodeRelSize={6}
                linkColor={() => "rgba(139, 92, 246, 0.15)"}
                onNodeClick={(node: any) => setSelectedId(node.id)}
                onBackgroundClick={() => setSelectedId("")}
                width={800}
                height={580}
                backgroundColor="transparent"
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const color = KIND_COLOR[node.kind] || KIND_COLOR.equipment;
                  const radius = 6;
                  const isSelected = node.id === selectedId;

                  // Selection Halo
                  if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "rgba(139, 92, 246, 0.25)";
                    ctx.fill();
                  }

                  // Node Circle Body
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = color;
                  ctx.fill();
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.strokeStyle = "#ffffff";
                  ctx.stroke();

                  // Label Text
                  const labelText = node.properties?.filename || node.properties?.name || node.properties?.title || node.label || node.id;
                  const fontSize = 11 / globalScale;
                  ctx.font = `600 ${fontSize}px Plus Jakarta Sans, sans-serif`;
                  const textWidth = ctx.measureText(labelText).width;
                  const textY = node.y + radius + 10 / globalScale;

                  // Text background pill
                  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                  ctx.beginPath();
                  ctx.roundRect(
                    node.x - textWidth / 2 - 4 / globalScale,
                    textY - fontSize / 2 - 2 / globalScale,
                    textWidth + 8 / globalScale,
                    fontSize + 4 / globalScale,
                    4 / globalScale,
                  );
                  ctx.fill();

                  // Text fill
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = isSelected ? "#8b5cf6" : "#1e1b4b";
                  ctx.fillText(labelText, node.x, textY);

                  node.__bckgDimensions = [textWidth + 8 / globalScale, fontSize + 4 / globalScale];
                }}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const start = link.source;
                  const end = link.target;
                  if (!start || !end || typeof start.x !== "number" || typeof end.x !== "number") return;

                  // Draw Line
                  ctx.beginPath();
                  ctx.moveTo(start.x, start.y);
                  ctx.lineTo(end.x, end.y);
                  ctx.strokeStyle = "rgba(107, 76, 155, 0.35)";
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.stroke();

                  // Draw Relationship Text Label
                  if (link.type) {
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    const label = String(link.type);
                    const fontSize = 9 / globalScale;

                    ctx.font = `700 ${fontSize}px Plus Jakarta Sans, sans-serif`;
                    const textWidth = ctx.measureText(label).width;

                    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                    ctx.beginPath();
                    ctx.roundRect(
                      midX - textWidth / 2 - 3 / globalScale,
                      midY - fontSize / 2 - 1 / globalScale,
                      textWidth + 6 / globalScale,
                      fontSize + 2 / globalScale,
                      3 / globalScale,
                    );
                    ctx.fill();

                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#6b4c9b";
                    ctx.fillText(label, midX, midY);
                  }
                }}
              />
            )}

            {/* Zoom controls */}
            <div className="absolute right-4 top-4 flex flex-col rounded-2xl glass-panel overflow-hidden shadow-md">
              {[
                { icon: ZoomIn, label: "Zoom in", action: () => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400) },
                { icon: ZoomOut, label: "Zoom out", action: () => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400) },
                { icon: Maximize2, label: "Fit view / Center graph", action: () => fgRef.current?.zoomToFit(400) },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.label}
                    title={b.label}
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
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId("")}
                  className="ml-auto text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Reset selection
                </button>
              )}
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

                  <button
                    onClick={() =>
                      navigate({
                        to: "/query",
                        search: { q: `What are the operational details, status, and failure risks for ${selected.label}?` },
                      })
                    }
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 cursor-pointer transition-all"
                  >
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
              <StatBlock label="Nodes" value={visibleNodes.length.toString()} />
              <StatBlock label="Edges" value={visibleEdges.length.toString()} />
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
