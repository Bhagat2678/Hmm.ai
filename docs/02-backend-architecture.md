# Backend Architecture

## Scope
FastAPI service that sits between the frontend and the AI/ML + data layers. Owns auth, document upload handling, API contracts, scheduling, and the operational database.

## Tech Stack
- **Framework:** FastAPI
- **Relational DB:** PostgreSQL (also hosts pgvector extension — same instance as AI/ML team's vector store)
- **Scheduling:** APScheduler (in-process cron jobs — no separate Celery/Redis needed for MVP)
- **Auth:** simple JWT-based auth (or skip entirely for hackathon demo if time-constrained — flag with team)

## Service Structure
```
/app
  /api
    documents.py      # upload, list, status
    query.py           # search/ask endpoints
    graph.py            # graph neighborhood endpoints
    alerts.py           # failure-intelligence alerts
    auth.py              # login/session (if included)
  /services
    ingestion_service.py  # calls AI/ML ingest_document()
    query_service.py       # calls AI/ML query_knowledge()
    scheduler.py             # APScheduler jobs (calls run_failure_scan())
  /db
    models.py    # SQLAlchemy models
    session.py
  main.py
```

## Database Schema (Postgres — operational data)
```sql
-- documents metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  document_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending', -- pending | processing | ingested | failed
  graph_node_ids TEXT[]
);

-- embeddings (pgvector)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  chunk_text TEXT,
  embedding vector(384)
);

-- alerts from failure-intelligence agent
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  related_equipment_tags TEXT[],
  severity TEXT, -- low | medium | high
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false
);

-- audit trail
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT,
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## API Contract (v1)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents/upload` | Upload a document, kicks off async ingestion |
| GET | `/api/documents` | List documents + ingestion status |
| GET | `/api/documents/{id}` | Document detail |
| POST | `/api/query` | `{query: str, filters?: {}}` → ranked answer + sources |
| GET | `/api/graph/neighborhood?tag=X&depth=N` | Graph nodes/edges around an equipment tag |
| GET | `/api/alerts` | List active alerts (frontend polls this) |
| POST | `/api/alerts/{id}/acknowledge` | Mark alert as acknowledged |

## Async Ingestion Flow
1. `POST /api/documents/upload` saves file, inserts `documents` row with `status=pending`, returns `document_id` immediately.
2. FastAPI `BackgroundTasks` (or APScheduler one-off job) calls `ingestion_service.process(document_id)` which invokes the AI/ML `ingest_document()`.
3. On completion, updates `documents.status` to `ingested` or `failed`.
4. Frontend polls `GET /api/documents/{id}` or the list endpoint to reflect status.

## Scheduled Jobs (APScheduler)
- `failure_scan_job` — runs `run_failure_scan()` from AI/ML layer on a fixed interval (e.g. every 6 hours, configurable), writes results into `alerts` table.

## Environment Variables
```
DATABASE_URL=
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
GEMINI_API_KEY=
GROQ_API_KEY=
JWT_SECRET=  # if auth included
```

## Notes for Team
- Keep AI/ML calls as direct Python function imports, not a separate HTTP microservice — reduces moving parts for the hackathon timeline.
- If upload volume/testing shows background tasks are too slow or blocking, that's the trigger to add Celery+Redis — not before.
