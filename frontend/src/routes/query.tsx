import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Send,
  Copy,
  Download,
  Trash2,
  FileText,
  GitBranch,
  Cpu,
  MessageSquare,
  ChevronRight,
  Zap,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeQuery } from "../hooks/useKnowledgeQuery";

export const Route = createFileRoute("/query")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: search.q as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Knowledge Query — Mhmm.ai" },
      {
        name: "description",
        content:
          "Ask Mhmm.ai natural-language questions about equipment, SOPs, and engineering knowledge with cited answers.",
      },
    ],
  }),
  component: QueryPage,
});

const SUGGESTED = [
  "What is the NPSH margin for P-101 at current suction pressure?",
  "List failure modes for API 610 pumps in H2S service.",
  "Show all SOPs that reference HX-31 fouling.",
  "Which sensors feed the T-500 level control loop?",
  "Compare vibration limits for P-101 vs API 670.",
];

const HISTORY = [
  { title: "NPSH margin analysis · P-101", when: "2m ago" },
  { title: "API 610 failure modes in H2S", when: "1h ago" },
  { title: "HX-31 fouling SOPs", when: "3h ago" },
  { title: "T-500 level control sensors", when: "yesterday" },
  { title: "Turnaround readiness checklist", when: "yesterday" },
];

function QueryPage() {
  const { q: urlQuery } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [input, setInput] = useState(urlQuery || "");
  const { mutate: submitQuery, isPending } = useKnowledgeQuery();
  const [conversation, setConversation] = useState<
    { id: string; role: "user" | "assistant"; text: string; citations?: any[]; confidence?: number; error?: boolean }[]
  >([]);
  const [activeCitations, setActiveCitations] = useState<any[]>([]);

  // Automatically send the query if `q` is in the URL
  useEffect(() => {
    if (urlQuery && conversation.length === 0 && !isPending) {
      send(urlQuery);
      // Remove q from URL to prevent re-firing on refresh
      navigate({ search: {} });
    }
  }, [urlQuery]);

  const send = (queryOverride?: string) => {
    const queryText = (queryOverride || input).trim();
    if (!queryText || isPending) return;
    
    const userMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();
    
    setConversation((c) => [
      ...c,
      { id: userMsgId, role: "user", text: queryText },
      { id: asstMsgId, role: "assistant", text: "…", citations: [], confidence: 0 },
    ]);
    setInput("");

    submitQuery({ query: queryText, conversation_id: "default", filters: {} }, {
      onSuccess: (data) => {
        setConversation((c) => 
          c.map(msg => msg.id === asstMsgId ? {
            ...msg,
            text: data.answer,
            citations: data.sources,
            confidence: data.confidence
          } : msg)
        );
        if (data.sources && data.sources.length > 0) {
          setActiveCitations(data.sources);
        }
      },
      onError: (err) => {
        setConversation((c) => 
          c.map(msg => msg.id === asstMsgId ? {
            ...msg,
            text: "Failed to get response.",
            error: true
          } : msg)
        );
      }
    });
  };

  const currentCitations = activeCitations.length > 0 ? activeCitations : CITATIONS;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      {/* Left: history */}
      <aside className="hidden rounded-md border border-border bg-card/70 lg:block">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Conversations
          </p>
          <button className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary ring-1 ring-primary/30 hover:bg-primary/25">
            New
          </button>
        </div>
        <ul className="divide-y divide-border">
          {HISTORY.map((h, i) => (
            <li key={i}>
              <button className={cn(
                "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
                i === 0 && "bg-primary/5",
              )}>
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{h.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{h.when}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Center: conversation */}
      <section className="flex min-h-[640px] flex-col rounded-md border border-border bg-card/70">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Knowledge Query</h3>
            <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary ring-1 ring-primary/30">
              Gemini 1.5 · RAG
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <button className="inline-flex items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent hover:text-foreground">
              <Download className="h-3 w-3" aria-hidden /> Export
            </button>
            <button
              onClick={() => setConversation([])}
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> Clear
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {conversation.length === 0 ? (
            <EmptyState />
          ) : (
            conversation.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))
          )}
        </div>

        {/* Suggested follow-ups */}
        <div className="border-t border-border px-4 py-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Suggested follow-ups
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Show the SOP steps to re-check strainer ΔP", "Trend NPSH margin over the last 90 days", "What happens if margin drops below 1.0 m?"].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={isPending}
                className="rounded-sm border border-border bg-surface/70 px-2 py-1 text-[11px] text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mhmm.ai about equipment, failures, SOPs, manuals, incidents, or engineering knowledge..."
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-surface/70 p-3 pr-24 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-hidden focus:ring-2 focus:ring-ring disabled:opacity-50"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={() => send()}
              disabled={isPending || !input.trim()}
              className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              Send
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            <span>⌘⏎ to send · answers cite source documents</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-success" aria-hidden />
              Retrieval: pgvector + Neo4j
            </span>
          </div>
        </div>
      </section>

      {/* Right: sources / suggested */}
      <aside className="rounded-md border border-border bg-card/70 flex flex-col min-h-0">
        <div className="border-b border-border px-3 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Cited Sources
          </p>
        </div>
        <ul className="divide-y divide-border overflow-y-auto flex-1">
          {currentCitations.map((c, i) => (
            <li key={c.id || i} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-sm bg-primary/15 font-mono text-[9px] font-semibold text-primary">
                  {c.id || `C${i+1}`}
                </span>
                <p className="min-w-0 truncate text-xs text-foreground">{c.doc || c.title || "Unknown Document"}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] italic text-muted-foreground">"{c.quote || c.text || "..."}"</p>
              <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                <span>p.{c.page || 1}</span>
                <span className="text-primary">{c.entity || "Entity"}</span>
              </div>
            </li>
          ))}
          {(!currentCitations || currentCitations.length === 0) && (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              No citations for current query
            </li>
          )}
        </ul>
        <div className="border-t border-border px-3 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Search className="h-3.5 w-3.5" aria-hidden />
            Try asking
          </p>
          <div className="mt-2 space-y-1.5">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={isPending}
                className="w-full rounded-sm border border-border bg-surface/70 px-2.5 py-2 text-left text-[11px] text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">Ask Mhmm.ai anything about your plant</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">
        Answers are grounded in your ingested documents, knowledge graph, and
        equipment metadata. Every claim is cited to source.
      </p>
    </div>
  );
}

function MessageBubble({
  message,
}: {
  message: { role: "user" | "assistant"; text: string; citations?: any[]; confidence?: number };
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary/15 px-3 py-2 text-sm text-foreground ring-1 ring-primary/20">
          {message.text}
        </div>
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary/20 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/30">
          <User className="h-3.5 w-3.5" aria-hidden />
        </div>
      </div>
    );
  }

  const isStreaming = message.text === "…";

  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary/10 ring-1 ring-primary/30">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">Mhmm.ai</span>
          {message.confidence != null && !isStreaming && (
            <>
              <span className="text-border-strong">│</span>
              <span>Confidence <span className="tabular-nums text-foreground">{Math.round(message.confidence * 100)}%</span></span>
              <span className="text-border-strong">│</span>
              <span>Retrieved 12 chunks in 1.2s</span>
            </>
          )}
        </div>

        {isStreaming ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2">
            <Cpu className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden />
            <span className="text-xs text-muted-foreground">Thinking · retrieving graph context…</span>
          </div>
        ) : (
          <>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.text.split("\n").map((line, i) => {
                if (line.startsWith("### ")) {
                  return (
                    <h4 key={i} className="mt-2 text-sm font-semibold text-foreground">
                      {line.replace("### ", "")}
                    </h4>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <p key={i} className="ml-4 flex gap-2">
                      <span className="text-primary">•</span>
                      <span dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
                    </p>
                  );
                }
                return (
                  <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
                );
              })}
            </div>

            {message.citations && message.citations.length > 0 && (
              <div className="rounded-md border border-border bg-surface/40 p-2.5">
                <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  <GitBranch className="h-3 w-3" aria-hidden />
                  Referenced entities
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {["P-101", "T-500", "LT-500", "SOP-9"].map((e) => (
                    <span key={e} className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary ring-1 ring-primary/25">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 pt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <button className="inline-flex items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent hover:text-foreground">
                <Copy className="h-3 w-3" aria-hidden /> Copy
              </button>
              <button className="inline-flex items-center gap-1 rounded-sm px-2 py-1 hover:bg-accent hover:text-foreground">
                <Download className="h-3 w-3" aria-hidden /> Export
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function renderInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded-sm bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-primary">$1</code>');
}
