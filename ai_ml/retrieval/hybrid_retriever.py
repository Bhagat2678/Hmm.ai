"""
Hybrid Retriever combining vector similarity, graph traversal, and keyword tag matching.
"""

from typing import List, Dict, Any, Optional
from ai_ml.retrieval.vector_search import vector_search
from ai_ml.retrieval.graph_search import graph_search
from ai_ml.retrieval.keyword_search import keyword_search
from ai_ml.llm.model_router import model_router
from ai_ml.prompts.query_prompt import QUERY_SYNTHESIS_SYSTEM_PROMPT, QUERY_SYNTHESIS_USER_PROMPT
from ai_ml.config.constants import TOP_K_HYBRID_RESULTS
from ai_ml.utils.logger import logger


class HybridRetriever:

    def retrieve_and_answer(self, query_text: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes hybrid retrieval (Vector + Graph + Keyword), merges and re-ranks results,
        and synthesizes a cited answer with confidence score.
        """
        filters = filters or {}
        
        # 1. Fetch from individual paths
        v_results = vector_search.search(query_text, top_k=TOP_K_HYBRID_RESULTS, filters=filters)
        g_results = graph_search.search(query_text, depth=1)
        k_results = keyword_search.search(query_text)

        # 2. Merge & Deduplicate
        all_results = k_results + g_results + v_results
        unique_results: List[Dict[str, Any]] = []
        seen_texts = set()

        for res in all_results:
            txt = res.get("text", "")
            if txt not in seen_texts:
                seen_texts.add(txt)
                unique_results.append(res)

        unique_results.sort(key=lambda x: x.get("score", 0.0), reverse=True)
        top_context = unique_results[:TOP_K_HYBRID_RESULTS]

        # 3. Format Context Snippets for Synthesis
        context_str = ""
        sources = []
        for idx, item in enumerate(top_context):
            doc_id = item.get("doc_id", f"doc-{idx}")
            source_lbl = item.get("source", "Knowledge Base")
            snippet = item.get("text", "")
            
            context_str += f"[{idx+1}] Source: {source_lbl} (ID: {doc_id})\nText: {snippet}\n\n"
            sources.append({
                "doc_id": doc_id,
                "title": source_lbl,
                "snippet": snippet[:200]
            })

        if not context_str.strip():
            context_str = "No specific historical documents or graph entries found for this query."

        # 4. LLM Answer Synthesis
        prompt = QUERY_SYNTHESIS_USER_PROMPT.format(
            query_text=query_text,
            filters=str(filters),
            retrieved_context=context_str
        )
        
        answer = model_router.generate_synthesis(
            prompt=prompt,
            system_instruction=QUERY_SYNTHESIS_SYSTEM_PROMPT
        )

        confidence = 0.92 if top_context else 0.50

        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence
        }


hybrid_retriever = HybridRetriever()
