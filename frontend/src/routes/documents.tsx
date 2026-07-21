import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments, useDeleteDocument, useDownloadDocument } from "../hooks/useDocuments";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Mhmm.ai" },
      {
        name: "description",
        content:
          "Manage industrial documents ingested into Mhmm.ai — P&IDs, SOPs, manuals, and inspection reports with knowledge extraction status.",
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
};

const DOCS: Doc[] = [
  { id: "D-9012", name: "PID-A-Unit300-Rev12.pdf", equipment: "P-101 · V-204 · HX-31", category: "P&ID", version: "12", entities: 184, relationships: 542, status: "indexed", uploaded: "2h ago" },
  { id: "D-9011", name: "SOP-9_startup_v3.2.docx", equipment: "P-101", category: "SOP", version: "3.2", entities: 92, relationships: 214, status: "processing", uploaded: "4h ago" },
  { id: "D-9010", name: "Vendor_Manual_P101.pdf", equipment: "P-101", category: "Manual", version: "12", entities: 412, relationships: 1204, status: "indexed", uploaded: "1d ago" },
  { id: "D-9009", name: "Inspection_HX31_Q3.xlsx", equipment: "HX-31", category: "Report", version: "1", entities: 62, relationships: 128, status: "queued", uploaded: "1d ago" },
  { id: "D-9008", name: "HAZOP_2024_review.pdf", equipment: "Unit 300", category: "HAZOP", version: "2024", entities: 442, relationships: 1892, status: "indexed", uploaded: "2d ago" },
  { id: "D-9007", name: "T500_isometric.dwg", equipment: "T-500", category: "Drawing", version: "4", entities: 38, relationships: 91, status: "indexed", uploaded: "3d ago" },
  { id: "D-9006", name: "API-610-vendor-spec.pdf", equipment: "P-101 · P-102", category: "Manual", version: "11", entities: 168, relationships: 421, status: "indexed", uploaded: "4d ago" },
  { id: "D-9005", name: "Turnaround_notes_2025.pdf", equipment: "Unit 300 · Unit 400", category: "Report", version: "1", entities: 0, relationships: 0, status: "failed", uploaded: "5d ago" },
];

const STATUS_STYLES: Record<Doc["status"] | string, string> = {
  indexed: "text-success bg-success/10 ring-success/30",
  ingested: "text-success bg-success/10 ring-success/30",
  processing: "text-primary bg-primary/10 ring-primary/30",
  queued: "text-muted-foreground bg-muted/50 ring-border-strong",
  pending: "text-muted-foreground bg-muted/50 ring-border-strong",
  failed: "text-destructive bg-destructive/10 ring-destructive/30",
};

const CATEGORIES = ["All", "P&ID", "SOP", "Manual", "Report", "Drawing", "HAZOP"] as const;

function DocumentsPage() {
  const { data: apiDocs, isLoading } = useDocuments();
  const { mutate: deleteDocument } = useDeleteDocument();
  const { mutate: downloadDocument } = useDownloadDocument();
  
  const [view, setView] = useState<"table" | "grid">("table");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const displayDocs = apiDocs && apiDocs.length > 0 ? apiDocs : DOCS;
  const [selected, setSelected] = useState<any | null>(null);

  const filtered = displayDocs.filter((d: any) => category === "All" || (d.category && d.category === category));

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
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Mhmm.ai · Document Corpus
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Documents
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every P&ID, SOP, and vendor manual ingested into the knowledge graph.
          Search, filter, and inspect entity extraction results for each source.
        </p>
      </header>

      {/* Toolbar */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Search documents, tags, equipment…"
            className="h-9 w-full rounded-md border border-input bg-surface/70 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-hidden focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors",
                  c === category
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filters
          </button>
          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              onClick={() => setView("table")}
              className={cn(
                "grid h-8 w-8 place-items-center transition-colors",
                view === "table"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-label="Table view"
            >
              <Rows3 className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "grid h-8 w-8 place-items-center transition-colors",
                view === "grid"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      {view === "table" ? (
        <div className="overflow-hidden rounded-md border border-border bg-card/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Document</th>
                  <th className="px-4 py-2.5 text-left font-medium">Equipment</th>
                  <th className="px-4 py-2.5 text-left font-medium">Category</th>
                  <th className="px-4 py-2.5 text-left font-medium">Ver</th>
                  <th className="px-4 py-2.5 text-right font-medium">Entities</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rels</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    <span className="inline-flex items-center gap-1">
                      Uploaded <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </span>
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/40",
                      selected?.id === d.id && "bg-primary/5",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-foreground">{d.filename || d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{d.equipment || "Unknown"}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {d.category || "Doc"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-foreground">v{d.version || "1"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-foreground">{d.entities || 0}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-foreground">{d.relationships || 0}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1", STATUS_STYLES[d.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.queued)}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {d.upload_date ? formatDistanceToNow(new Date(d.upload_date)) : d.uploaded}
                    </td>
                    <td className="px-4 py-2.5">
                      <button aria-label="Actions" className="grid h-7 w-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                        <MoreVertical className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d: any) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className="group rounded-md border border-border bg-card/70 p-4 text-left transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-primary/10 ring-1 ring-primary/20">
                  <FileText className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1", STATUS_STYLES[d.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.queued)}>
                  {d.status}
                </span>
              </div>
              <p className="mt-3 truncate text-sm font-medium text-foreground">{d.filename || d.name}</p>
              <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-primary">{d.equipment || "Unknown"}</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{d.category || "Doc"} · v{d.version || "1"}</span>
                <span className="tabular-nums text-foreground">{d.entities || 0} ent</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          role="dialog"
          aria-label={`Details for ${selected.name}`}
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-slide-in-right"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">Document Details</h3>
            </div>
            <button aria-label="Close" onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Filename</p>
              <p className="mt-1 text-sm text-foreground">{selected.filename || selected.name}</p>
            </div>
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Preview · page 1 of 42
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Category</dt>
                <dd className="mt-1 text-foreground">{selected.category || "Doc"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Version</dt>
                <dd className="mt-1 text-foreground">v{selected.version || "1"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Entities</dt>
                <dd className="mt-1 font-mono tabular-nums text-foreground">{selected.entities || 0}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Relationships</dt>
                <dd className="mt-1 font-mono tabular-nums text-foreground">{selected.relationships || 0}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Referenced Equipment</dt>
                <dd className="mt-1 font-mono text-primary">{selected.equipment || "Unknown"}</dd>
              </div>
            </dl>
            <div className="rounded-md border border-border bg-card/70 p-3">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI Summary
              </p>
              <p className="mt-2 text-xs text-foreground">
                This document describes normal startup and pressure-testing
                procedures for the Unit 300 feed pump train. It cross-references
                12 equipment tags and 4 upstream HAZOP findings.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card/70 p-3">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                <GitBranch className="h-3 w-3" aria-hidden />
                Linked Graph Nodes
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {["P-101", "V-204", "HX-31", "SOP-9", "S-12"].map((n) => (
                  <li key={n} className="flex items-center justify-between">
                    <span className="font-mono text-primary">{n}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Equipment
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-border p-3">
            <button 
              onClick={handleDownload}
              className="inline-flex w-full sm:flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Eye className="h-4 w-4" aria-hidden />
              View / Download
            </button>
            <button 
              onClick={handleDelete}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-input bg-surface/70 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
