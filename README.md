# 🛡️ Bedrock — Industrial Knowledge Intelligence Platform
> **AI-Powered Graph RAG & Failure Intelligence for Heavy Industry**

An AI-powered operational intelligence platform for ingesting, processing, and querying complex industrial engineering knowledge using Hybrid Retrieval-Augmented Generation (RAG), PostgreSQL `pgvector` dense vector search, and Neo4j graph databases.

> 📖 **Complete Architecture & Submission Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md) for full technical deep-dive and API reference.

---

## 🌟 Executive Summary

Industrial teams sit on mountains of knowledge — equipment manuals, inspection logs, failure reports, and Standard Operating Procedures (SOPs). However, critical operational insights remain trapped inside static PDFs and legacy records. When equipment fails on the plant floor, engineers waste precious hours manually searching across disparate files while downtime costs thousands of dollars per minute.

**Bedrock** fixes this by transforming passive industrial documentation into an active, interconnected **Knowledge Intelligence Engine**. By combining **Vector Retrieval (pgvector)**, **Graph Neural Traversal (Neo4j AuraDB)**, and **Multi-Agent RAG (Gemini 2.5 Flash & Groq LLaMA-3.3-70B)**, Bedrock empowers operations teams to instantly query complex documentation, visualize equipment relationship networks, and proactively detect systemic failure risks.

---

## ⚡ Key Capabilities & Innovations

* **🔍 Hybrid Graph-RAG Retrieval**: Combines dense vector search (`pgvector`) with Neo4j graph traversal for context-rich, citation-backed answers.
* **🕸️ Interactive 2D Knowledge Graph Explorer**: Dynamic force-directed canvas visualizing relationships between Equipment (`P-101`, `V-204`), Sensors (`TT-301`, `PT-301` in green), Procedures (`SOP-301`), and Documents (in slate-gray).
* **🚨 Agentic Failure Intelligence**: Autonomous background risk scanner detecting systemic vulnerabilities and generating real-time actionable alerts.
* **📄 Multi-Modal Document Ingestion**: Ingests PDFs, TXT files, and manuals while automatically extracting entities and equipment tags.

---

## 🏗️ System Architecture & Startup Flow

```mermaid
flowchart TD
    subgraph Client["Frontend (TanStack / React)"]
        UI["Operator UI / RAG Chat / Knowledge Graph Explorer"]
    end

    subgraph API["Backend (FastAPI)"]
        AUTH["JWT Auth & Security Guard"]
        Q_SERVICE["Query Service & RAG Engine"]
        DOC_SERVICE["Document Ingestion Pipeline"]
        SCHEDULER["APScheduler Background Failure Scanner"]
    end

    subgraph AI_ML["AI/ML Layer (LangGraph & LLM)"]
        ROUTER["Model Router (Gemini 2.5 Flash / Groq LLaMA-3.3-70B)"]
        EXTRACTOR["Entity & Relationship Extractor"]
        RETRIEVER["Hybrid Retriever (Vector + Graph + Keyword)"]
    end

    subgraph Storage["Data Tier"]
        PG["PostgreSQL + pgvector (Supabase IPv4 Pooler)"]
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

Bedrock supports a **Native Development Workflow** (using Supabase PostgreSQL + Neo4j AuraDB cloud backends) as well as an optional Docker workflow.

### Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (Optional for containerized deployments)

---

### Step 1: Environment Setup
Ensure your `.env` is configured with database and API keys:

```env
# PostgreSQL Database (Supabase IPv4 Pooler)
DATABASE_URL=postgresql://postgres.<project_ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# Supabase Platform
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_DATABASE_URL=postgresql://postgres:<password>@db.<your-project-ref>.supabase.co:5432/postgres

# Neo4j Graph Database
NEO4J_URI=neo4j+s://<your-aura-db-id>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password

# AI / LLM APIs
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Auth & Frontend
JWT_SECRET=your_jwt_secret_key
VITE_API_BASE_URL=http://<host-ip>:8000/api
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
| **Frontend Workspace** | Port 5173 (`http://<host-ip>:5173`) | Interactive Operator Portal & Knowledge Graph Canvas |
| **Backend REST API** | Port 8000 (`http://<host-ip>:8000`) | FastAPI REST Service |
| **OpenAPI Documentation** | Port 8000 (`http://<host-ip>:8000/docs`) | Interactive Swagger UI API Docs |

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
docker exec bedrock-backend pytest

# Verify frontend production build
docker exec bedrock-frontend npm run build
```

---

## 📄 License

Built for hackathon demonstration.
