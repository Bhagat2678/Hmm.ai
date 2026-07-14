# Build Timeline & Checklist

Assumes a 2-day (~36 hour) hackathon window. Adjust hour numbers to your actual start time, but keep the order and relative proportions.

## Day 1

### Hours 0–6: Infra/DevOps setup (blocking — do this first)
- [ ] Create Neo4j AuraDB Free instance, share URI/credentials
- [ ] Create Supabase project (Postgres + pgvector), share credentials
- [ ] Get Gemini API key (Google AI Studio, free tier)
- [ ] Get Groq API key (free, backup LLM)
- [ ] Write `.env.example`, distribute real `.env` privately (not git)
- [ ] Docker Compose skeleton runs locally (even with empty/stub services)
- [ ] Repo structure created (`/backend`, `/frontend`, `/ai_ml`, `/docs`)

### Hours 4–10: Backend skeleton (starts once env vars exist, overlaps with infra tail end)
- [ ] Postgres schema created (`documents`, `document_chunks`, `alerts`, `audit_log`)
- [ ] FastAPI app scaffolded
- [ ] All endpoint stubs return mock/hardcoded JSON matching the API contract
- [ ] `POST /api/documents/upload` actually saves a file + DB row (real, not mocked)
- [ ] Confirm with Frontend that mock response shapes match what they need

### Hours 6–20: AI/ML and Frontend run in parallel

**AI/ML**
- [ ] Gemini extraction working on 1 real sample doc → structured JSON output
- [ ] Test extraction against 3-5 varied doc types (PDF, scanned form, spreadsheet) — this is the highest-risk step, don't skip real-document testing
- [ ] Neo4j write path: entity resolution + `MERGE` upserts for nodes/edges
- [ ] Embeddings + pgvector write path
- [ ] Hybrid retrieval: vector search working standalone
- [ ] Hybrid retrieval: graph traversal working standalone
- [ ] Merge vector + graph + keyword fallback into one ranked result set
- [ ] Failure-intelligence agent: pulls incidents, queries graph, runs pattern-detection LLM call
- [ ] `ingest_document()`, `query_knowledge()`, `run_failure_scan()` functions finalized for Backend to import

**Frontend (against mock data initially)**
- [ ] Upload UI (`UploadDropzone`) wired to `POST /api/documents/upload`
- [ ] Document status list, polling `GET /api/documents`
- [ ] Query UI (`QueryBox` + `AnswerCard`) wired to `POST /api/query`
- [ ] Alerts feed, polling `GET /api/alerts` every ~10s
- [ ] Responsive layout check on phone-width viewport
- [ ] Graph explorer (`react-force-graph`) — lower priority, do after core flows work

## Day 2

### Hours 20–26: Integration
- [ ] Backend imports real AI/ML functions, replaces all mock endpoint logic
- [ ] Frontend re-tested against real backend responses (not mock)
- [ ] Full upload → ingest → query round-trip works end to end on a real document
- [ ] Failure-intelligence scheduled job runs and produces at least one real alert
- [ ] Fix integration bugs — budget real time here, this always takes longer than expected

### Hours 26–30: Deployment
- [ ] Backend + Postgres deployed (Railway/Render free tier)
- [ ] Frontend deployed (Vercel/Netlify free tier), pointed at deployed backend
- [ ] Neo4j AuraDB connection confirmed from deployed backend
- [ ] Local Docker Compose kept running as a fallback in case hosted demo has issues

### Hours 30–34: Demo polish
- [ ] Curate a demo corpus (varied doc types, at least one incident-pattern scenario the failure-intelligence agent will actually catch)
- [ ] Graph explorer visual polish (color-coding, click-to-expand)
- [ ] Alerts UI severity styling
- [ ] Rehearse the demo script end to end, twice

### Hours 34–36: Buffer
- [ ] Fix whatever broke in rehearsal
- [ ] Prepare pitch: problem context stats, architecture diagram, live demo, phase-2 roadmap (P&ID vectorization, WebSocket push, etc.)

## Risk Watchlist (check in on these explicitly, don't just hope)
- Gemini free-tier rate limits under real demo load
- Entity resolution/dedup quality (bad dedup = useless graph, even if extraction works)
- Integration hours always run over — protect this time, don't let polish eat into it
