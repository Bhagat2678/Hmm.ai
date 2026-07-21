"""
Vector Search module for semantic document retrieval.
"""

from typing import List, Dict, Any
from ai_ml.embeddings.vector_store import vector_store
from ai_ml.config.constants import TOP_K_VECTOR_RESULTS


class VectorSearch:

    def search(self, query_text: str, top_k: int = TOP_K_VECTOR_RESULTS, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Executes vector similarity search against pgvector / memory store.
        """
        raw_results = vector_store.similarity_search(query_text, top_k=top_k, filters=filters)
        results = []
        for r in raw_results:
            results.append({
                "type": "vector",
                "doc_id": r.get("document_id"),
                "chunk_id": r.get("chunk_id"),
                "text": r.get("chunk_text"),
                "score": r.get("similarity", 0.0),
                "source": f"Document Vector Match (Sim: {r.get('similarity', 0.0):.2f})"
            })
        return results


vector_search = VectorSearch()
