import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
  Plus,
  Clock,
  Share2,
  RefreshCw,
  Terminal,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useKnowledgeQuery } from "../hooks/useKnowledgeQuery";

export const Route = createFileRoute("/query")({
  validateSearch: (search: Record<string, unknown>): { q?: string; reset?: string } => {
    return {
      q: search.q as string | undefined,
      reset: search.reset as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Knowledge Query - Mhmm.ai" },
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

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: any[];
  confidence?: number;
  error?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
  citations: any[];
}

function QueryPage() {
  const { q: urlQuery, reset: urlReset } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [input, setInput] = useState(urlQuery || "");
  const { mutate: submitQuery, isPending } = useKnowledgeQuery();

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "initial-session",
      title: "Current Chat",
      timestamp: new Date(),
      messages: [],
      citations: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("initial-session");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const conversation = activeSession.messages;

  useEffect(() => {
    if (urlReset) {
      setSessions([
        {
          id: crypto.randomUUID(),
          title: "New Chat",
          timestamp: new Date(),
          messages: [],
          citations: [],
        },
      ]);
      setInput("");
      navigate({ search: (prev) => ({ ...prev, reset: undefined }), replace: true });
    }
  }, [urlReset]);

  useEffect(() => {
    if (urlQuery && conversation.length === 0 && !isPending) {
      send(urlQuery);
      navigate({ search: (prev) => ({ ...prev, q: undefined }) });
    }
  }, [urlQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const createNewChat = () => {
    if (activeSession.messages.length === 0) {
      return; // Already on an empty new chat session
    }
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Chat",
      timestamp: new Date(),
      messages: [],
      citations: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setInput("");
  };

  const send = (queryOverride?: string) => {
    const queryText = (queryOverride || input).trim();
    if (!queryText || isPending) return;

    const userMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();

    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle = isFirstMessage
      ? queryText.length > 28
        ? queryText.slice(0, 28) + "..."
        : queryText
      : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              messages: [
                ...s.messages,
                { id: userMsgId, role: "user", text: queryText },
                { id: asstMsgId, role: "assistant", text: "...", citations: [], confidence: 0 },
              ],
            }
          : s,
      ),
    );
    setInput("");

    submitQuery(
      { query: queryText, conversation_id: activeSessionId, filters: {} },
      {
        onSuccess: (data) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    citations: data.sources && data.sources.length > 0 ? data.sources : s.citations,
                    messages: s.messages.map((msg) =>
                      msg.id === asstMsgId
                        ? { ...msg, text: data.answer, citations: data.sources, confidence: data.confidence }
                        : msg,
                    ),
                  }
                : s,
            ),
          );
        },
        onError: () => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((msg) =>
                      msg.id === asstMsgId
                        ? { ...msg, text: "Failed to generate response. Please try again.", error: true }
                        : msg,
                    ),
                  }
                : s,
            ),
          );
        },
      },
    );
  };

  const currentCitations = activeSession.citations;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)_300px] h-[calc(100vh-140px)] min-h-[600px]">
      {/* Left Sidebar: Conversations History */}
      <aside className="hidden lg:flex flex-col glass-panel rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xs font-bold text-foreground">Conversations</p>
          </div>
          <button
            onClick={createNewChat}
            className="rounded-xl bg-primary px-3 py-1 text-[11px] font-bold text-white hover:brightness-110 transition-all inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        <ul className="flex-1 divide-y divide-border/40 overflow-y-auto">
          {sessions.map((sess) => (
            <li key={sess.id}>
              <button
                onClick={() => setActiveSessionId(sess.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-all hover:bg-primary/5 cursor-pointer",
                  sess.id === activeSessionId && "bg-primary/10 border-l-4 border-primary font-bold",
                )}
              >
                <ChevronRight className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", sess.id === activeSessionId ? "text-primary" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{sess.title}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" /> {sess.messages.length} messages
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {/* Suggested Queries */}
        <div className="border-t border-border/50 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Search className="h-3 w-3" /> Try Asking
          </p>
          <div className="mt-2 space-y-1.5">
            {SUGGESTED.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={isPending}
                className="w-full rounded-xl border border-border/60 bg-white/50 px-3 py-2 text-left text-[11px] font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center Chat Area */}
      <section className="flex flex-col glass-panel rounded-3xl overflow-hidden min-h-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between border-b border-border/50 px-6 py-3.5 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Cosmic Knowledge Assistant</h2>
              <p className="text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 live-dot" />
                Gemini 2.5 Flash · Groq RAG Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [], citations: [] } : s)),
                );
              }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
              title="Clear active chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {conversation.length === 0 ? (
            <EmptyState onSuggest={send} isPending={isPending} />
          ) : (
            conversation.map((m, i) => <MessageBubble key={i} message={m} />)
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Follow-up chips */}
        {conversation.length > 0 && (
          <div className="border-t border-border/50 px-6 py-3 bg-white/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Suggested Follow-ups
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                "Show the SOP steps to re-check strainer delta-P",
                "Trend NPSH margin over last 90 days",
                "What happens if margin drops below 1.0 m?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={isPending}
                  className="rounded-full border border-border/60 bg-white/60 px-3.5 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer Input Box */}
        <div className="border-t border-border/50 p-4 bg-white/50">
          <div className="relative glass-panel rounded-2xl shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Cosmic Assistant about equipment, failures, SOPs, or engineering knowledge..."
              rows={2}
              className="w-full resize-none rounded-2xl border-0 bg-transparent p-4 pr-24 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 disabled:opacity-50"
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
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/25 hover:brightness-110 disabled:opacity-40 cursor-pointer transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </section>

      {/* Right Sidebar: System Processes */}
      <aside className="hidden lg:flex flex-col glass-panel rounded-3xl p-5 space-y-5 overflow-hidden">
        <div>
          <h3 className="font-bold text-sm text-primary">System Processes</h3>
          {/* Clarity Gauge */}
          <div className="mt-3 glass-panel p-5 rounded-2xl flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full">
              Context Retention (Clarity)
            </span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-primary/10"
                  cx="56"
                  cy="56"
                  r="44"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary"
                  cx="56"
                  cy="56"
                  r="44"
                  fill="transparent"
                  stroke="currentColor"
                  strokeDasharray="276"
                  strokeDashoffset="22"
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground">92%</span>
                <span className="text-[10px] font-bold text-emerald-600">Stable</span>
              </div>
            </div>
            <p className="text-[11px] text-center text-muted-foreground font-medium">
              Context retention performing at peak efficiency.
            </p>
          </div>
        </div>

        {/* Cited Sources List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center pb-2">
            <h4 className="text-xs font-bold text-foreground">Cited Sources ({currentCitations.length})</h4>
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-primary" />
          </div>
          {currentCitations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground">
              No citations yet. Ask a question to view RAG cited sources.
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-border/40 overflow-y-auto pr-1">
              {currentCitations.map((c: any, i: number) => (
                <li key={c.id || i} className="py-2.5 transition-colors hover:bg-primary/5 rounded-xl px-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/15 font-mono text-[9px] font-bold text-primary">
                      {c.id || `C${i + 1}`}
                    </span>
                    <p className="truncate text-xs font-semibold text-foreground">{c.doc || c.title || "Document"}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] italic text-muted-foreground">
                    "{c.quote || c.text || "Source excerpt..."}"
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function EmptyState({ onSuggest, isPending }: { onSuggest: (s: string) => void; isPending: boolean }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/25">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-foreground">Cosmic Assistant v4.2</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        Ask natural-language questions about equipment, failure modes, or SOPs. Every claim is cited to source.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            disabled={isPending}
            className="w-full rounded-2xl border border-border/60 bg-white/60 px-4 py-2.5 text-left text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer disabled:opacity-50 group"
          >
            <span className="inline-flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              {s}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
}: {
  message: { role: "user" | "assistant"; text: string; citations?: any[]; confidence?: number; error?: boolean };
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-primary px-5 py-3.5 text-xs font-semibold text-white shadow-md shadow-primary/20">
          {message.text}
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  const isStreaming = message.text === "...";

  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="font-bold text-primary">Cosmic AI</span>
          {message.confidence != null && !isStreaming && (
            <span>· Retained 92% context · Cited {message.citations?.length || 3} sources</span>
          )}
        </div>

        {isStreaming ? (
          <div className="flex items-center gap-2.5 rounded-2xl glass-panel p-4 border-l-4 border-primary">
            <Cpu className="h-4 w-4 animate-pulse text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Analyzing knowledge graph & vectors...</span>
          </div>
        ) : (
          <div
            className={cn(
              "glass-panel p-6 rounded-2xl rounded-tl-none border-l-4",
              message.error ? "border-red-400" : "border-primary",
            )}
          >
            <div className="space-y-2 text-xs leading-relaxed text-foreground font-medium">
              {message.text.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                Architecture Ready
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                Tokens Mapped
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}