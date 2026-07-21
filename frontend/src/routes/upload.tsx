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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "../hooks/useUpload";
import { useDocuments } from "../hooks/useDocuments";
import { useRef } from "react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Mhmm.ai" },
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

// Mock data removed

const STAGE_META: Record<Stage, { label: string; tone: string; icon: typeof UploadIcon }> = {
  queued: { label: "Queued", tone: "text-muted-foreground bg-muted/50 ring-border-strong", icon: Loader2 },
  uploading: { label: "Uploading", tone: "text-primary bg-primary/10 ring-primary/30", icon: UploadIcon },
  ocr: { label: "OCR", tone: "text-primary bg-primary/10 ring-primary/30", icon: ImageIcon },
  parsing: { label: "Parsing", tone: "text-primary bg-primary/10 ring-primary/30", icon: FileText },
  chunking: { label: "Chunking", tone: "text-primary bg-primary/10 ring-primary/30", icon: Boxes },
  embedding: { label: "Embedding", tone: "text-primary bg-primary/10 ring-primary/30", icon: Brain },
  knowledge: { label: "Knowledge Extract", tone: "text-primary bg-primary/10 ring-primary/30", icon: Sparkles },
  graph: { label: "Graph Update", tone: "text-primary bg-primary/10 ring-primary/30", icon: GitBranch },
  completed: { label: "Completed", tone: "text-success bg-success/10 ring-success/30", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "text-destructive bg-destructive/10 ring-destructive/30", icon: AlertTriangle },
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
    pauseUpload,
    resumeUpload,
    retryUpload
  } = useUpload();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use real backend data instead of static arrays
  const { data: documentsData } = useDocuments();
  const documents = documentsData || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadDocument(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadDocument(e.dataTransfer.files[0]);
    }
  };

  // Split into queue (pending, processing, failed) and history (ingested)
  const QUEUE = documents.filter(d => ['pending', 'processing', 'failed'].includes(d.status));
  const HISTORY = documents.filter(d => d.status === 'ingested').slice(0, 5); // show last 5

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          <UploadIcon className="h-3.5 w-3.5" aria-hidden />
          Mhmm.ai · Ingestion
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Upload Industrial Documents
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Feed P&IDs, SOPs, vendor manuals, inspection reports, and engineering
          drawings into the knowledge pipeline. Every document is OCR-parsed,
          chunked, embedded, and linked into the Neo4j knowledge graph.
        </p>
      </header>

      {/* Dropzone */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              "group relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-border-strong bg-card/50 p-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
              isPending && "opacity-50 pointer-events-none"
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-10%,oklch(0.74_0.11_220/8%),transparent)]"
            />
            <div className="grid h-14 w-14 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30">
              {isPending ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <UploadIcon className="h-6 w-6 text-primary" aria-hidden />}
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              {isPending ? "Uploading..." : "Drop files to ingest"}
            </p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              PDF · DOCX · TIFF · PNG · JPG · XLSX · DWG · up to 50MB each. Files
              are queued into the LangGraph pipeline for OCR, chunking, and
              knowledge extraction.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <UploadIcon className="h-4 w-4" aria-hidden />
                Select files
              </button>
              <button 
                onClick={() => {
                  const url = window.prompt("Enter document URL to import:");
                  if (url) importUrl(url);
                }} 
                disabled={isPending} 
                className="inline-flex items-center gap-2 rounded-md border border-input bg-surface/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50 cursor-pointer"
              >
                Import from URL
              </button>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Max 50MB · Batch up to 200 files
            </p>
          </div>
        </div>

        <aside className="rounded-md border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Pipeline stages</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Every document flows through the following stages before it becomes
            queryable.
          </p>
          <ol className="mt-3 space-y-2">
            {(["queued", "uploading", "ocr", "parsing", "chunking", "embedding", "knowledge", "graph", "completed"] as Stage[]).map((s, i) => {
              const meta = STAGE_META[s];
              const Icon = meta.icon;
              return (
                <li key={s} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-sm bg-muted/60 font-mono text-[9px] text-muted-foreground">
                    {i + 1}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="text-xs text-foreground">{meta.label}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      </section>

      {/* Queue */}
      <section className="rounded-md border border-border bg-card/70">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Upload Queue</h3>
            <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {QUEUE.length} items
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <button className="hover:text-foreground cursor-pointer">Pause all</button>
            <span className="text-border-strong">│</span>
            <button onClick={() => clearCompleted()} className="hover:text-foreground cursor-pointer">Clear completed</button>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {QUEUE.map((f) => {
            const isPdf = f.filename.toLowerCase().endsWith('.pdf');
            const TypeIcon = isPdf ? TYPE_ICON.pdf : TYPE_ICON.image;
            
            // Map backend status to our frontend stages
            let stageKey: Stage = "queued";
            let progress = 0;
            if (f.status === "pending") { stageKey = "queued"; progress = 10; }
            if (f.status === "processing") { stageKey = "parsing"; progress = 50; }
            if (f.status === "failed") { stageKey = "failed"; progress = 100; }
            if (f.status === "ingested") { stageKey = "completed"; progress = 100; }
            
            const stage = STAGE_META[stageKey];
            
            return (
              <li key={f.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-sm border border-border bg-surface/70">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm text-foreground">{f.filename}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ring-1",
                        stage.tone,
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={cn(
                        "h-full",
                        f.status === "failed"
                          ? "bg-destructive"
                          : f.status === "ingested"
                            ? "bg-success"
                            : "bg-linear-to-r from-primary/60 to-primary",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>File</span>
                    <span className="text-border-strong">│</span>
                    <span className="tabular-nums">{progress}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === "failed" && (
                    <button
                      onClick={() => retryUpload(f.id)}
                      aria-label="Retry"
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => cancelUpload(f.id)}
                    aria-label="Cancel"
                    className="grid h-8 w-8 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* History */}
      <section className="rounded-md border border-border bg-card/70">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Upload History</h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Last 7 days
          </span>
        </div>
        <ul className="divide-y divide-border">
          {HISTORY.map((h) => (
            <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{h.filename}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(h.created_at).toLocaleDateString()} · Entities extracted
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-sm bg-success/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-success ring-1 ring-success/30">
                Indexed
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
