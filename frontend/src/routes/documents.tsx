import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Rows3,
  Eye,
  MoreVertical,
  Download,
  X,
  GitBranch,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  FolderKanban,
  Brain,
  Cloud,
  Terminal,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments, useDeleteDocument, useDownloadDocument } from "../hooks/useDocuments";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Workspace Explorer - Mhmm.ai" },
      {
        name: "description",
        content:
          "Manage industrial documents ingested into Mhmm.ai - P&IDs, SOPs, manuals, and inspection reports with knowledge extraction status.",
      },
    ],
  }),
  component: DocumentsPage,
});

type Doc = {
  id: string;
  name: string;
  equipment: string;
  category: "P&ID" | "SOP" | "Manual" | "Report" | "Drawing" | "HAZOP";
  version: string;
  entities: number;
  relationships: number;
  status: "indexed" | "processing" | "queued" | "failed";
  uploaded: string;
  size?: string;
  thumbUrl?: string;
};



const STATUS_STYLES: Record<string, string> = {
  indexed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  ingested: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  processing: "bg-primary/10 text-primary ring-primary/20",
  queued: "bg-muted text-muted-foreground ring-border",
  pending: "bg-muted text-muted-foreground ring-border",
  failed: "bg-red-100 text-red-700 ring-red-200",
};

const CATEGORIES = ["All", "P&ID", "SOP", "Manual", "Report", "Drawing", "HAZOP"] as const;

function formatBytes(bytes?: number | string): string {
  if (!bytes) return "1.2 MB";
  const num = typeof bytes === "number" ? bytes : parseFloat(bytes);
  if (isNaN(num) || num <= 0) return "1.2 MB";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsPage() {
  const navigate = useNavigate();
  const { data: apiDocs } = useDocuments();
  const { mutate: deleteDocument } = useDeleteDocument();
  const { mutate: downloadDocument } = useDownloadDocument();

  const [view, setView] = useState<"table" | "grid">("grid");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const displayDocs = apiDocs || [];
  const [selected, setSelected] = useState<any | null>(null);

  // Training progress bar state
  const [progress, setProgress] = useState(74);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 0.5));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const filtered = displayDocs.filter((d: any) => {
    const docName = (d.filename || d.name || "").toLowerCase();
    const docType = (d.document_type || d.category || "").toLowerCase();
    const docEquip = (d.equipment || "").toLowerCase();

    let matchCategory = category === "All";
    if (!matchCategory) {
      const catLower = category.toLowerCase();
      if (catLower === "p&id") {
        matchCategory =
          docType.includes("pid") ||
          docType.includes("p&id") ||
          docType.includes("p_id") ||
          docName.includes("pid") ||
          docName.includes("p&id") ||
          docName.includes("p_id") ||
          docName.includes("diagram") ||
          docName.includes("piping");
      } else {
        matchCategory =
          docType === catLower ||
          docType.includes(catLower) ||
          docName.includes(catLower);
      }
    }

    const matchSearch =
      !searchQuery ||
      docName.includes(searchQuery.toLowerCase()) ||
      docEquip.includes(searchQuery.toLowerCase()) ||
      docType.includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const handleDownload = () => {
    if (selected) {
      downloadDocument({ id: selected.id, filename: selected.filename || selected.name });
    }
  };

  const handleDelete = () => {
    if (selected) {
      deleteDocument(selected.id);
      setSelected(null);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* 1:1 Stitch Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Workspace Explorer
          </h1>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Manage your neural nodes, ingested manuals, SOPs, and engineering assets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspace..."
              className="w-full rounded-full border border-border/60 bg-white/60 py-2.5 pl-10 pr-4 text-xs font-semibold text-foreground focus:border-primary focus:outline-none shadow-xs"
            />
          </div>
          <div className="flex p-1 glass-panel rounded-full shadow-inner">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2 rounded-full transition-all cursor-pointer",
                view === "grid" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "p-2 rounded-full transition-all cursor-pointer",
                view === "table" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary",
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>

          {displayDocs.some((d: any) => d.status === "failed") && (
            <button
              onClick={() => {
                const failedDocs = displayDocs.filter((d: any) => d.status === "failed");
                failedDocs.forEach((d: any) => deleteDocument(d.id));
                toast.success(`Deleted ${failedDocs.length} failed document(s).`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200 transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Failed Imports
            </button>
          )}
        </div>
      </header>

      {/* Project Folders (Bento Style 1:1 Stitch) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Project Folders</h2>
          <button
            onClick={() => {
              setCategory("All");
              setSearchQuery("");
            }}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Knowledge Workspace */}
          <div
            onClick={() => setCategory("All")}
            className="glass-card rounded-2xl p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Active
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-foreground">Knowledge Workspace</h3>
              <p className="text-xs text-muted-foreground">RAG Vector Index & Engineering Knowledge Base</p>
            </div>
          </div>

          {/* Cloud Fragments */}
          <div
            onClick={() => setCategory("All")}
            className="glass-card rounded-2xl p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Cloud className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {displayDocs.length} Documents
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-foreground">Cloud Fragments</h3>
              <p className="text-xs text-muted-foreground">Vector Index & Document Corpus</p>
            </div>
            <div className="mt-4 w-full bg-primary/10 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-full" />
            </div>
          </div>

          {/* Mhmm.ai Protocols */}
          <div
            onClick={() => setCategory("SOP")}
            className="glass-card rounded-2xl p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <Terminal className="h-6 w-6" />
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  Active
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-foreground">Mhmm.ai Protocols</h3>
              <p className="text-xs text-muted-foreground">Graph Extractors & Safety Rules</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> LangGraph Workflow
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Recent Documents</h2>
        <div className="flex overflow-x-auto p-1 glass-panel rounded-2xl gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-xl px-3.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                c === category
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Documents Grid / Table View */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Documents Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            The workspace database is currently empty. Upload engineering manuals, P&IDs, or SOPs to begin knowledge extraction.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((d: any) => (
            <div
              key={d.id}
              onClick={() => setSelected(d)}
              className="glass-card rounded-3xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm h-full flex flex-col justify-between"
            >
              <div>
                <div className="h-32 w-full bg-primary/10 relative overflow-hidden">
                  {d.thumbUrl ? (
                    <img
                      src={d.thumbUrl}
                      alt={d.filename || d.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />
                  <span
                    className={cn(
                      "absolute top-3 right-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 backdrop-blur-md capitalize",
                      STATUS_STYLES[d.status] || STATUS_STYLES.queued,
                    )}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="font-bold text-xs text-foreground truncate">{d.filename || d.name}</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(d);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-primary truncate">
                    {d.document_type || d.equipment || "P&ID / SOP"}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                  <span>{d.upload_date ? formatDistanceToNow(new Date(d.upload_date)) : d.uploaded || "Just now"} ago</span>
                  <span className="font-mono text-foreground font-bold">{formatBytes(d.file_size || d.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5 text-left">Document</th>
                  <th className="px-4 py-3.5 text-left">Equipment</th>
                  <th className="px-4 py-3.5 text-left">Category</th>
                  <th className="px-4 py-3.5 text-left">Version</th>
                  <th className="px-4 py-3.5 text-right">Entities</th>
                  <th className="px-4 py-3.5 text-right">Relationships</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filtered.map((d: any) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-primary/5",
                      selected?.id === d.id && "bg-primary/10",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <FileText className="h-4 w-4" aria-hidden />
                        </div>
                        <span className="font-semibold text-foreground truncate max-w-[200px]">
                          {d.filename || d.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-primary">{d.equipment || "System"}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        {d.category || "Doc"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-muted-foreground">v{d.version || "1"}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-foreground">{d.entities || 0}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-foreground">{d.relationships || 0}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1",
                          STATUS_STYLES[d.status] || STATUS_STYLES.queued,
                        )}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(d);
                        }}
                        aria-label="View details"
                        className="rounded-xl p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      {selected && (
        <div
          role="dialog"
          aria-label={`Details for ${selected.filename || selected.name}`}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col glass-panel rounded-l-3xl border-l border-primary/20 shadow-2xl backdrop-blur-2xl bg-white/95"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-foreground">Document Details</h3>
            </div>
            <button
              aria-label="Close drawer"
              onClick={() => setSelected(null)}
              className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filename</p>
              <p className="mt-1 text-sm font-bold text-foreground">{selected.filename || selected.name}</p>
            </div>

            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <FileText className="mx-auto h-10 w-10 text-primary/40" aria-hidden />
              <p className="mt-2 text-xs font-bold text-primary">Preview Available</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">PDF page 1 of 42 · OCR extracted</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border/50 bg-white/50 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</dt>
                <dd className="mt-1 font-bold text-foreground">{selected.category || "Doc"}</dd>
              </div>
              <div className="rounded-xl border border-border/50 bg-white/50 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Version</dt>
                <dd className="mt-1 font-bold text-foreground">v{selected.version || "1"}</dd>
              </div>
              <div className="rounded-xl border border-border/50 bg-white/50 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Entities</dt>
                <dd className="mt-1 font-bold tabular-nums text-foreground">{selected.entities || 0}</dd>
              </div>
              <div className="rounded-xl border border-border/50 bg-white/50 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Relationships</dt>
                <dd className="mt-1 font-bold tabular-nums text-foreground">{selected.relationships || 0}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/50 p-5">
            <button
              onClick={() =>
                navigate({
                  to: "/query",
                  search: { q: `Summarize key engineering procedure and failure details in document ${selected.filename || selected.name}` },
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 cursor-pointer transition-all"
            >
              <Sparkles className="h-4 w-4" /> Ask AI about Document
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl glass-panel border border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-200 cursor-pointer transition-all"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
