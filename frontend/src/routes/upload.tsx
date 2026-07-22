import { createFileRoute } from "@tanstack/react-router";
import {
  Upload as UploadIcon,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Boxes,
  Brain,
  GitBranch,
  Cpu,
  RotateCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "../hooks/useUpload";
import { useDocuments } from "../hooks/useDocuments";
import { useRef } from "react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload - Mhmm.ai" },
      {
        name: "description",
        content:
          "Ingest industrial documents into the Mhmm.ai knowledge intelligence pipeline: P&IDs, SOPs, manuals, and inspection reports.",
      },
    ],
  }),
  component: UploadPage,
});

type Stage =
  | "queued"
  | "uploading"
  | "ocr"
  | "parsing"
  | "chunking"
  | "embedding"
  | "knowledge"
  | "graph"
  | "completed"
  | "failed";

const STAGE_META: Record<Stage, { label: string; tone: string; icon: typeof UploadIcon }> = {
  queued: { label: "Queued", tone: "bg-muted text-muted-foreground ring-border", icon: Loader2 },
  uploading: { label: "Uploading", tone: "bg-primary/10 text-primary ring-primary/20", icon: UploadIcon },
  ocr: { label: "OCR", tone: "bg-primary/10 text-primary ring-primary/20", icon: ImageIcon },
  parsing: { label: "Parsing", tone: "bg-primary/10 text-primary ring-primary/20", icon: FileText },
  chunking: { label: "Chunking", tone: "bg-primary/10 text-primary ring-primary/20", icon: Boxes },
  embedding: { label: "Embedding", tone: "bg-primary/10 text-primary ring-primary/20", icon: Brain },
  knowledge: { label: "Knowledge Extract", tone: "bg-primary/10 text-primary ring-primary/20", icon: Sparkles },
  graph: { label: "Graph Update", tone: "bg-primary/10 text-primary ring-primary/20", icon: GitBranch },
  completed: { label: "Completed", tone: "bg-emerald-100 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "bg-red-100 text-red-700 ring-red-200", icon: AlertTriangle },
};

const TYPE_ICON = {
  pdf: FileText,
  image: ImageIcon,
  sheet: FileSpreadsheet,
} as const;

function UploadPage() {
  const {
    uploadDocument,
    isPending,
    importUrl,
    clearCompleted,
    cancelUpload,
    retryUpload,
  } = useUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documentsData } = useDocuments();
  const documents = documentsData || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadDocument(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadDocument(e.dataTransfer.files[0]);
    }
  };

  const QUEUE = documents.filter((d) => ["pending", "processing", "failed"].includes(d.status));
  const HISTORY = documents.filter((d) => ["ingested", "completed"].includes(d.status)).slice(0, 10);

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
              <UploadIcon className="h-3.5 w-3.5" aria-hidden />
              Ingestion Pipeline · LangGraph + Neo4j
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Document Ingestion
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground leading-relaxed">
              Feed P&IDs, SOPs, vendor manuals, and inspection reports into the pipeline for automatic OCR parsing, chunk embedding, and graph linking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 live-dot" />
              Pipeline Healthy
            </span>
          </div>
        </div>
      </header>

      {/* Dropzone & Pipeline Overview */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              "group relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl glass-panel p-8 text-center transition-all duration-300 border-2 border-dashed border-primary/20 hover:border-primary/60 hover:bg-primary/5",
              isPending && "opacity-50 pointer-events-none",
            )}
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/25 group-hover:scale-105 transition-transform">
              {isPending ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UploadIcon className="h-8 w-8" aria-hidden />
              )}
            </div>
            <h3 className="mt-5 text-lg font-bold text-foreground">
              {isPending ? "Uploading file..." : "Drag and drop files to ingest"}
            </h3>
            <p className="mt-1.5 max-w-md text-xs text-muted-foreground leading-relaxed">
              PDF, DOCX, PNG, JPG, XLSX, DWG up to 50MB per file.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 disabled:opacity-40 cursor-pointer transition-all active:scale-95"
              >
                <UploadIcon className="h-4 w-4" aria-hidden />
                Select Files
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = window.prompt("Enter document URL to import:");
                  if (url) importUrl(url);
                }}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl glass-panel border border-primary/30 px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-40 cursor-pointer transition-all"
              >
                Import via URL
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline stages list */}
        <aside className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
                <Cpu className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-foreground">Pipeline Stages</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Automated 9-stage ingestion workflow:
            </p>
            <ol className="space-y-2">
              {(
                [
                  "queued",
                  "uploading",
                  "ocr",
                  "parsing",
                  "chunking",
                  "embedding",
                  "knowledge",
                  "graph",
                  "completed",
                ] as Stage[]
              ).map((s, i) => {
                const meta = STAGE_META[s];
                const Icon = meta.icon;
                return (
                  <li key={s} className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <span className="grid h-5 w-5 place-items-center rounded-lg bg-primary/10 font-mono text-[10px] font-bold text-primary shrink-0">
                      {i + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                    <span className="truncate">{meta.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </section>

      {/* Queue section */}
      <section className="glass-panel rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
              <Loader2 className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <h3 className="text-sm font-bold text-foreground">Ingestion Queue</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {QUEUE.length} active
            </span>
          </div>
          <button
            type="button"
            onClick={() => clearCompleted()}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Clear Completed
          </button>
        </div>
        <ul className="divide-y divide-border/40">
          {QUEUE.map((f) => {
            const isPdf = f.filename.toLowerCase().endsWith(".pdf");
            const TypeIcon = isPdf ? TYPE_ICON.pdf : TYPE_ICON.image;

            let stageKey: Stage = "queued";
            let progress = 10;
            if (f.status === "pending") {
              stageKey = "queued";
              progress = 15;
            }
            if (f.status === "processing") {
              stageKey = "parsing";
              progress = 55;
            }
            if (f.status === "failed") {
              stageKey = "failed";
              progress = 100;
            }
            if (f.status === "ingested") {
              stageKey = "completed";
              progress = 100;
            }

            const stage = STAGE_META[stageKey];

            return (
              <li key={f.id} className="flex items-center gap-4 px-6 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                  <TypeIcon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-foreground">{f.filename}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 shrink-0",
                        stage.tone,
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        f.status === "failed" ? "bg-red-500" : "bg-primary",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === "failed" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => retryUpload(f.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <RotateCw className="h-3 w-3" /> Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelUpload(f.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cancelUpload(f.id)}
                      aria-label="Cancel upload"
                      className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {QUEUE.length === 0 && (
            <li className="px-6 py-10 text-center text-xs font-semibold text-muted-foreground">
              No active uploads in queue. Drag and drop files above to start ingestion.
            </li>
          )}
        </ul>
      </section>

      {/* History section */}
      <section className="glass-panel rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="text-sm font-bold text-foreground">Recent Ingestion Log</h3>
          </div>
          <span className="text-xs font-bold text-muted-foreground">Recent 5</span>
        </div>
        <ul className="divide-y divide-border/40">
          {HISTORY.map((h) => (
            <li key={h.id} className="flex items-center gap-4 px-6 py-3.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{h.filename}</p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Ingested {new Date(h.created_at || h.upload_date || Date.now()).toLocaleDateString()} · Fully indexed & linked
                </p>
              </div>
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                Indexed
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
