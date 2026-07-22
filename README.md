# 🛡️ Bedrock — Industrial Knowledge Intelligence Platform

An AI-powered operational intelligence platform for ingesting, processing, and querying complex industrial engineering knowledge using Retrieval-Augmented Generation (RAG), pgvector vector search, and graph databases.

> 📖 **Complete Architecture & Submission Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md) for full technical deep-dive, API reference, and demo walkthrough.

---

## 🏗️ System Architecture & Startup Flow

```mermaid
flowchart TD
    subgraph Client["Frontend (React / Vite)"]
        UI["Operator UI / RAG Chat / Knowledge Graph Explorer"]
    end

    subgraph API["Backend (FastAPI)"]
        AUTH["JWT Auth & Security Guard"]
        Q_SERVICE["Query Service & RAG Engine"]
        DOC_SERVICE["Document Ingestion Pipeline"]
        SCHEDULER["APScheduler Background Failure Scanner"]
    end

    subgraph AI_ML["AI/ML Layer (LangGraph & LLM)"]
        ROUTER["Model Router (Gemini 2.5 Flash / Groq Fallback)"]
        EXTRACTOR["Entity & Relationship Extractor"]
        RETRIEVER["Hybrid Retriever (Vector + Graph + Keyword)"]
    end

    subgraph Storage["Data Tier"]
        PG["PostgreSQL + pgvector (Documents & Chunks)"]
        NEO4J["Neo4j AuraDB / NetworkX Memory Graph"]
    end

    UI -->|JWT Auth / REST| AUTH
    AUTH --> Q_SERVICE
    AUTH --> DOC_SERVICE
    DOC_SERVICE -->|Text & Multimodal| EXTRACTOR
    EXTRACTOR -->|Nodes & Edges| NEO4J
    DOC_SERVICE -->|Embeddings| PG
    Q_SERVICE --> RETRIEVER
    RETRIEVER --> PG
    RETRIEVER --> NEO4J
    Q_SERVICE --> ROUTER
```

---

## 🚀 Quick Start Instructions

Bedrock supports a **Native Development Workflow** (no Docker required for day-to-day work, using Supabase PostgreSQL + Neo4j AuraDB cloud backends) as well as an optional Docker workflow.

### Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (Optional for containerized deployments)

---

### Step 1: Environment & Dependency Setup
Run the setup script to initialize environment configurations, Python virtual environment, dependencies, and verify cloud database/AI API connections:

```bash
# Linux / macOS
bash scripts/setup.sh
```

---

### Step 2: Launch Platform (Native Default)
Start the FastAPI backend service and Vite React frontend natively:

```bash
# Linux / macOS
bash scripts/start-dev.sh

# Windows (PowerShell)
.\scripts\start-dev.ps1
```

Once running, access the platform endpoints:

| Service | Access URL | Description |
|---|---|---|
| **Frontend Workspace** | [http://localhost:5173](http://localhost:5173) | Interactive Operator Portal & Knowledge Graph Canvas |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI REST Service |
| **OpenAPI Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI API Docs |

---

### 🐳 Optional Docker Workflow
For containerized testing or deployment, you can optionally run:

```bash
docker compose up -d
```

---

## 🛠️ Developer Utility Commands

### Clear Database & Reset Environment
To purge operational documents, chunks, alerts, and upload caches while preserving database migrations:

```bash
python3 scripts/clear_db.py
```

### Run Tests & Verification
```bash
# Run backend pytest suite
docker exec iki-backend pytest

# Verify frontend production build
docker exec iki-frontend npm run build
```

---

## 🔐 Environment Variables Reference

Key environment variables in `.env` / `backend/.env`:

```env
# PostgreSQL Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/iki

# AI / LLM APIs
GEMINI_API_KEY=AQ.Ab8RN6K_eCds...
GROQ_API_KEY=gsk_HQmzONIb...

# Neo4j Graph Database
NEO4J_URI=neo4j+s://7fe11bca.databases.neo4j.io
NEO4J_USERNAME=7fe11bca
NEO4J_PASSWORD=...

# Auth & Frontend
JWT_SECRET=default_hackathon_jwt_secret_key_change_me
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📄 License
Licensed under the [MIT License](./LICENSE).
