# Industrial Knowledge Intelligence Platform — Architecture Overview

## Problem Statement
Build an AI-powered Industrial Knowledge Intelligence platform that ingests heterogeneous documents (engineering drawings/P&IDs, maintenance records, safety procedures, inspection reports, operating instructions, project files) across structured and unstructured formats, and makes their collective intelligence queryable, actionable, and continuously updated at the point of need — across any device or function.

## What We're Building
Two coupled systems on top of a hybrid search backend:

1. **Universal Document Ingestion & Knowledge Graph Agent** — pipeline that processes PDFs, P&IDs, scanned forms, spreadsheets, and email archives; extracts entities (equipment tags, process parameters, regulatory references, personnel, dates); builds a unified knowledge graph that maintains relationships across document types and updates as new records arrive.
2. **Lessons Learned & Failure Intelligence Engine** — agent that analyses incident reports, near-misses, audit findings, and quality non-conformances; identifies systemic patterns invisible to individual review; proactively pushes warnings to operational teams before similar conditions recur.

## System Layers

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Tailwind, PWA)            │
│  - Chat/query UI, graph visualization, alerts│
└───────────────────┬───────────────────────────┘
                     │ REST + polling
┌───────────────────▼───────────────────────────┐
│  Backend (FastAPI)                            │
│  - Auth, document upload, query orchestration │
│  - Scheduled re-scan jobs (APScheduler)       │
└─────┬──────────────────────────┬───────────────┘
      │                          │
┌─────▼─────────┐      ┌─────────▼─────────────┐
│  AI/ML Layer   │      │  Data Layer            │
│  - Gemini 2.5  │      │  - Postgres + pgvector │
│    Flash       │      │  - Neo4j AuraDB (graph)│
│  - LangGraph   │      │                        │
│    agents      │      │                        │
│  - Embeddings  │      │                        │
└────────────────┘      └────────────────────────┘
```

## Team Split (4 people → 4 docs)
| Area | Doc | Owns |
|---|---|---|
| AI/ML | `01-ai-ml-architecture.md` | Ingestion pipeline, entity extraction, knowledge graph writes, RAG retrieval, failure-intelligence agent |
| Backend | `02-backend-architecture.md` | FastAPI service, APIs, auth, scheduling, DB schemas |
| Frontend | `03-frontend-architecture.md` | React app, query UI, graph visualization, alerts UI |
| Infra/Services | `04-infra-devops-architecture.md` | Docker Compose, deployment, environment config, CI |

## Core Tech Stack (all free-tier)
- **LLM / multimodal extraction:** Gemini 2.5 Flash (free tier), Groq Llama 3.3 70B (free, backup)
- **Graph DB:** Neo4j AuraDB Free
- **Vector DB:** pgvector on Supabase free tier / local Postgres
- **Embeddings:** sentence-transformers/all-MiniLM-L6-v2 (local, free)
- **Agent orchestration:** LangGraph
- **Backend:** FastAPI + APScheduler
- **Frontend:** React + Tailwind + react-force-graph
- **Deployment:** Docker Compose (local demo), Railway/Render free tier (hosted demo link)

## Integration Contract Between Teams
- AI/ML → Backend: exposes ingestion and query functions as importable Python modules/services called from FastAPI routes (not a separate microservice, to keep it simple for the hackathon).
- Backend → Frontend: REST API returning JSON (documents, graph nodes/edges, alerts) — see API contract in `02-backend-architecture.md`.
- Backend → Data layer: Postgres for relational/operational data + pgvector; Neo4j for graph; both accessed only through backend service layer, never directly from frontend.

## What's Deprioritized (phase 2)
- Full P&ID symbol/topology vectorization (scope as label/tag extraction only for MVP)
- WebSocket live push (use polling for MVP)
- Fine-tuned NER models (LLM-based extraction only)
