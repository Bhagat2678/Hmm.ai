"""
Vector Store client for PostgreSQL pgvector database with in-memory fallback.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from ai_ml.config.settings import settings
from ai_ml.embeddings.embedding_model import embedding_model
from ai_ml.utils.logger import logger

try:
    from sqlalchemy import create_engine, text
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False


class VectorStore:

    def __init__(self, db_url: str = None):
        self.db_url = db_url or settings.DATABASE_URL
        self.engine = None
        self.memory_store: List[Dict[str, Any]] = []

        if HAS_SQLALCHEMY and self.db_url:
            try:
                self.engine = create_engine(self.db_url, pool_pre_ping=True)
                self._init_db()
            except Exception as e:
                logger.warning(f"Could not connect to PostgreSQL pgvector: {e}. Utilizing in-memory vector store.")

    def _init_db(self):
        if not self.engine:
            return
        try:
            with self.engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        document_id UUID,
                        chunk_text TEXT,
                        embedding vector(384)
                    );
                """))
            logger.info("PGVector schema verified/initialized in PostgreSQL.")
        except Exception as e:
            logger.warning(f"Failed to initialize pgvector table: {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> int:
        """Adds document chunks and their embedding vectors to the vector store."""
        if not chunks:
            return 0

        added_count = 0
        if self.engine:
            try:
                with self.engine.begin() as conn:
                    for chunk, vec in zip(chunks, embeddings):
                        str_vec = "[" + ",".join(str(f) for f in vec) + "]"
                        chunk_txt = (chunk.get("text") or "").replace("\x00", "")
                        query = text("""
                            INSERT INTO document_chunks (document_id, chunk_text, embedding)
                            VALUES (:doc_id, :text, CAST(:embedding AS vector))
                        """)
                        conn.execute(query, {
                            "doc_id": chunk.get("document_id"),
                            "text": chunk_txt,
                            "embedding": str_vec
                        })
                        added_count += 1
                logger.info(f"Added {added_count} chunks to pgvector store.")
                return added_count
            except Exception as e:
                logger.warning(f"Failed adding chunks to Postgres pgvector: {e}. Storing in memory.")

        # Fallback in-memory storage
        for chunk, vec in zip(chunks, embeddings):
            self.memory_store.append({
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "chunk_text": chunk.get("text"),
                "equipment_tags": chunk.get("equipment_tags", []),
                "embedding": np.array(vec, dtype=np.float32)
            })
            added_count += 1
        return added_count

    def similarity_search(self, query_text: str, top_k: int = 5, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Performs vector similarity search against query vector with optional filtering."""
        query_vec = embedding_model.embed_text(query_text)
        filters = filters or {}
        doc_id_filter = filters.get("document_id")

        if self.engine:
            try:
                str_vec = "[" + ",".join(str(f) for f in query_vec) + "]"
                with self.engine.connect() as conn:
                    if doc_id_filter:
                        query = text("""
                            SELECT id, document_id, chunk_text, 1 - (embedding <=> CAST(:query_vec AS vector)) as similarity
                            FROM document_chunks
                            WHERE document_id = CAST(:doc_id AS UUID)
                            ORDER BY embedding <=> CAST(:query_vec AS vector) ASC
                            LIMIT :top_k
                        """)
                        res = conn.execute(query, {"query_vec": str_vec, "top_k": top_k, "doc_id": doc_id_filter})
                    else:
                        query = text("""
                            SELECT id, document_id, chunk_text, 1 - (embedding <=> CAST(:query_vec AS vector)) as similarity
                            FROM document_chunks
                            ORDER BY embedding <=> CAST(:query_vec AS vector) ASC
                            LIMIT :top_k
                        """)
                        res = conn.execute(query, {"query_vec": str_vec, "top_k": top_k})
                    
                    results = []
                    for row in res:
                        results.append({
                            "chunk_id": str(row[0]),
                            "document_id": str(row[1]),
                            "chunk_text": row[2],
                            "similarity": float(row[3]) if row[3] is not None else 0.0
                        })
                    if results:
                        return results
            except Exception as e:
                logger.warning(f"Postgres vector search failed: {e}. Searching memory store.")

        # In-memory cosine similarity fallback
        if not self.memory_store:
            return []

        q_arr = np.array(query_vec, dtype=np.float32)
        q_norm = np.linalg.norm(q_arr)

        scored = []
        for item in self.memory_store:
            if doc_id_filter and item.get("document_id") != doc_id_filter:
                continue
                
            vec = item["embedding"]
            v_norm = np.linalg.norm(vec)
            sim = 0.0
            if q_norm > 0 and v_norm > 0:
                sim = float(np.dot(q_arr, vec) / (q_norm * v_norm))
            scored.append({
                "chunk_id": item.get("chunk_id"),
                "document_id": item.get("document_id"),
                "chunk_text": item.get("chunk_text"),
                "equipment_tags": item.get("equipment_tags", []),
                "similarity": sim
            })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]


vector_store = VectorStore()
