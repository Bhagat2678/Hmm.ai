# AI/ML Architecture

## Scope
Owns everything from "raw document in" to "structured knowledge graph + retrievable answers + proactive alerts out." Exposed to the Backend team as Python service functions.

## 1. Document Ingestion & Multimodal Extraction
- **Model:** Gemini 2.5 Flash (free tier via Google AI Studio) — reads PDFs, images, scanned forms, and P&ID drawings natively; no separate OCR stage needed for MVP.
- **Fallback OCR (if Gemini quota is hit):** Tesseract or PaddleOCR (free, local).
- **Input types to handle:** PDF, XLSX/CSV, scanned images (JPEG/PNG), email exports (.eml/.msg → parsed to text first).
- **Extraction schema (forced JSON output):**
```json
{
  "document_type": "maintenance_record | inspection_report | safety_procedure | pnid | operating_instruction | project_file",
  "entities": {
    "equipment_tags": ["..."],
    "process_parameters": [{"name": "...", "value": "...", "unit": "..."}],
    "regulatory_refs": ["..."],
    "personnel": ["..."],
    "dates": ["..."]
  },
  "relationships": [{"from": "...", "to": "...", "type": "..."}],
  "summary": "..."
}
```
- **P&ID handling (MVP scope):** extract tagged text/labels + bounding boxes via Gemini vision; link the drawing image itself as a retrievable asset tied to its extracted equipment tags. Full symbol/topology digitization is explicitly out of scope — phase 2 item.

## 2. Knowledge Graph Construction
- **Store:** Neo4j AuraDB Free tier.
- **Node types:** `Equipment`, `Document`, `Person`, `Incident`, `RegulatoryRef`, `ProcessParameter`.
- **Edge types:** `MENTIONED_IN`, `MAINTAINED_BY`, `LINKED_TO_INCIDENT`, `REFERENCES_REGULATION`, `PART_OF`.
- **Write path:** extraction JSON → entity resolution (fuzzy-match equipment tags against existing nodes to avoid duplicates) → Cypher `MERGE` statements to upsert nodes/edges.
- Use `neo4j` Python driver directly for MVP; LangGraph tooling only if time allows.

## 3. Retrieval / RAG Layer
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim, local, free).
- **Vector store:** pgvector on Postgres (Supabase free tier).
- **Hybrid retrieval on query:**
  1. Vector similarity search (pgvector) for semantic matches
  2. Graph traversal (Neo4j) for relationship-based matches (e.g., "everything linked to equipment tag X")
  3. Keyword/exact-match fallback for equipment IDs and tag numbers
  4. Merge and re-rank results before passing to the LLM for final answer synthesis
- Build and test these three retrieval paths independently first; merge only once each works standalone.

## 4. Agent Orchestration (LangGraph)
### Agent A — Ingestion Agent
State machine: `receive document` → `classify type` → `extract entities` → `resolve entities against graph` → `write to graph` → `write embeddings to pgvector` → `done`.

### Agent B — Failure Intelligence Agent
State machine: `scheduled trigger` → `pull recent incidents/near-misses/audit findings` → `query graph for related historical incidents` → `LLM pattern-detection over the set (Gemini Flash / Groq Llama 3.3 70B)` → `if pattern confidence > threshold, generate warning` → `push alert to backend` → `log to audit trail`.
- Scheduling: APScheduler job in the backend triggers this agent on a cron interval (e.g., every N hours, or on new-document-ingested webhook).

## 5. Model Usage Summary
| Task | Model | Why |
|---|---|---|
| Document/image extraction | Gemini 2.5 Flash | Free tier, native multimodal, handles scans + drawings |
| Pattern-detection reasoning | Gemini 2.5 Flash or Groq Llama 3.3 70B | Strong reasoning; Groq as free backup for rate limits |
| Classification/routing (cheap tasks) | Groq Llama 3.1 8B or Gemini Flash-Lite | Fast, cheap, free tier |
| Embeddings | all-MiniLM-L6-v2 (local) | No API cost, good enough for hackathon corpus |

## 6. Interfaces Exposed to Backend
- `ingest_document(file_path, metadata) -> IngestionResult`
- `query_knowledge(query_text, filters) -> RankedResults`
- `get_graph_neighborhood(equipment_tag, depth) -> GraphSubgraph`
- `run_failure_scan() -> list[Alert]` (called by scheduler)

## Open Items / Risks
- Gemini free-tier rate limits under demo load — test early with realistic document volume.
- Entity resolution/deduplication quality directly affects graph usefulness — allocate real testing time here, not just extraction.
