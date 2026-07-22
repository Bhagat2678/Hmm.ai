# 🛡️ Bedrock — Industrial Knowledge Intelligence Platform
> **AI-Powered Graph RAG & Failure Intelligence for Heavy Industry**

---

## 🌟 Executive Summary

Industrial teams sit on mountains of knowledge — equipment manuals, inspection logs, failure reports, and Standard Operating Procedures (SOPs). However, critical operational insights remain trapped inside static PDFs and legacy records. When equipment fails on the plant floor, engineers waste precious hours manually searching across disparate files while downtime costs thousands of dollars per minute.

**Bedrock** fixes this by transforming passive industrial documentation into an active, interconnected **Knowledge Intelligence Engine**. By combining **Vector Retrieval (pgvector)**, **Graph Neural Traversal (Neo4j AuraDB)**, and **Multi-Agent RAG (Gemini 2.5 Flash & Groq LLaMA-3.3-70B)**, Bedrock empowers operations teams to instantly query complex documentation, visualize equipment relationship networks, and proactively detect systemic failure risks.

---

## 🏗️ Architecture & Technology Stack

Bedrock is built on a high-throughput, micro-service architecture optimized for speed, reliability, and modularity:

```
                  ┌─────────────────────────────────────────┐
                  │    Bedrock Frontend (TanStack / React)   │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST APIs
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │     FastAPI Backend Gateway (Port 8000) │
                  └──────┬──────────────────┬───────────────┘
                         │                  │
         ┌───────────────┴──────┐    ┌──────┴────────────────┐
         ▼                      ▼    ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Supabase / PG   │  │  Neo4j AuraDB    │  │  Gemini 2.5      │  │  Groq LLaMA 3.3  │
│  Vector DB       │  │  Knowledge Graph │  │  Multi-Modal LLM │  │  70B Fast Engine │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 1. **Frontend Layer**
* **Framework**: TanStack Start / React 19 (TypeScript)
* **Styling**: Modern Vanilla CSS Design Tokens, Glassmorphism, Tailwind Utility Primitives
* **Visualization**: `react-force-graph-2d` for interactive 2D Graph exploration
* **Icons & UI**: Lucide React, Radix UI primitives, Sonner notifications

### 2. **Backend & API Layer**
* **Framework**: FastAPI (Python 3.11) with Uvicorn ASGI Server
* **ORM & Migrations**: SQLAlchemy 2.0 with PostgreSQL `pgvector` extension
* **Task Management**: Background Threading & Asyncio Task Pools for zero-latency document ingestion

### 3. **AI / ML & Knowledge Graph Engine**
* **Embedding Model**: `all-MiniLM-L6-v2` (384-dimensional dense vector embeddings)
* **LLM Providers**:
  * **Google Gemini 2.5 Flash**: Fast multimodal document parsing and entity extraction.
  * **Groq LLaMA-3.3-70B**: High-speed conversational RAG synthesis and failure reasoning.
* **Knowledge Graph**: Neo4j AuraDB (Cypher query language) with NetworkX in-memory fallback.

---

## ⚡ Core Features & Innovations

### 1. 🔍 Hybrid Graph-RAG Retrieval
Unlike traditional vector search that only finds keyword-similar text snippets, Bedrock uses **Hybrid Graph-RAG**:
1. Performs dense vector search in PostgreSQL `pgvector` to find relevant text chunks.
2. Simultaneously queries Neo4j to fetch graph neighborhoods (connected equipment tags, valves, sensors, and procedures).
3. Synthesizes both text context and relational graph topology into a unified answer with clickable source citations.

### 2. 🕸️ Interactive Knowledge Graph Explorer
* Real-time 2D Canvas visualizing relationships between **Equipment** (`P-101`, `V-204`), **Sensors** (`TT-301`, `PT-301`), **Procedures** (`SOP-301`), and **Documents**.
* Color-coded category tags and dynamic depth traversal (1 to 5 hops).
* Node detail side-drawers highlighting connected risk levels and degree centrality.

### 3. 🚨 Agentic Failure Intelligence Workflow
* Autonomous background scanner (`failure_scan_agent_executor`) analyzing equipment interaction networks.
* Detects hidden systemic vulnerabilities (e.g., thermal anomalies on `TT-301` threatening pump `P-101`).
* Automatically generates actionable alerts with risk severity, affected tags, and recommended mitigation procedures.

### 4. 📄 Multi-Modal Document Ingestion Engine
* Drag-and-drop ingestion of PDFs, TXT files, and equipment manuals.
* Automatic entity extraction identifying equipment tags (`P-101`, `ESV-204`), sensor readings, failure modes, and operational parameters.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
* Python 3.11+
* Node.js v20+ / npm v10+
* (Optional) Docker Desktop v29+

### Option A: Native Development (Recommended)

1. **Clone & Configure Environment**:
   ```bash
   git clone https://github.com/arjunmk44/Mhmm.ai.git
   cd Mhmm.ai
   ```

2. **Configure `.env`**:
   Ensure `.env` contains your database and LLM credentials:
   ```env
   # Database (Supabase IPv4 Pooler)
   DATABASE_URL=postgresql://postgres.beymztuvwxfkofmfjkfb:DatabaseMhmmai@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

   # Supabase Platform
   SUPABASE_URL=https://beymztuvwxfkofmfjkfb.supabase.co
   SUPABASE_KEY=sb_publishable_JNUlDlmBlHVnwX1LeZ6iCQ_8uamMoNt
   SUPABASE_DATABASE_URL=postgresql://postgres:DatabaseMhmmai@db.beymztuvwxfkofmfjkfb.supabase.co:5432/postgres

   # Neo4j Graph Database
   NEO4J_URI=neo4j+s://7fe11bca.databases.neo4j.io
   NEO4J_USERNAME=7fe11bca
   NEO4J_PASSWORD=IatWX9suddZxn3cUKWXpIKL05QQ9g0sFCDg3hmXczrs

   # LLM API Keys
   GEMINI_API_KEY=yAQ.Ab8RN6K_eCdsEhxV9FC30TgAc5YZW1Z3I4Ewn8lEgdmEzckjNQ
   GROQ_API_KEY=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

   # Auth & Frontend
   JWT_SECRET=default_hackathon_jwt_secret_key_change_me
   VITE_API_BASE_URL=http://<host-ip>:8000/api
   ```

3. **Launch Platform**:
   Run the native development script in PowerShell:
   ```powershell
   .\scripts\start-dev.ps1
   ```

   Access the application:
   * **Frontend Workspace**: Port 5173 (`http://<host-ip>:5173`)
   * **Backend API Docs**: Port 8000 (`http://<host-ip>:8000/docs`)

---

### Option B: Docker Container Stack

To run the complete platform inside containerized environments:

```bash
# 1. Build and start containers
docker compose up -d

# 2. Verify running services
docker ps
```

* **Frontend**: Port 5173 (`http://<host-ip>:5173`)
* **Backend API**: Port 8000 (`http://<host-ip>:8000`)
* **PostgreSQL pgvector**: Port 5434

---

## 📡 API Endpoints Reference

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Documents** | `/api/documents/upload` | `POST` | Upload & start background ingestion of document |
| **Documents** | `/api/documents` | `GET` | List all ingested documents |
| **Documents** | `/api/documents/{id}` | `GET` | Get metadata & chunk details for document |
| **Query (RAG)** | `/api/query` | `POST` | Execute Hybrid Graph-RAG query over knowledge base |
| **Graph** | `/api/graph/neighborhood` | `GET` | Fetch surrounding sub-graph nodes and edges |
| **Alerts** | `/api/alerts` | `GET` | Retrieve active systemic failure alerts |
| **Alerts** | `/api/alerts/{id}/ack` | `PUT` | Acknowledge active alert |
| **Auth** | `/api/auth/login` | `POST` | Generate JWT demo access token |
| **Health** | `/health` | `GET` | Health check endpoint |

---

## 🛡️ License

Built for hackathon demonstration.
