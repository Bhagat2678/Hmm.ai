"""
Graph interface exposed to the Backend API per Section 4 of the Integration Contract.
"""

from typing import Dict, Any, Optional
from ai_ml.graph.neo4j_client import neo4j_client
from ai_ml.agents.failure_intelligence_agent import failure_scan_agent_executor
from ai_ml.utils.logger import logger


def get_graph_neighborhood(entity_id: Optional[str] = "", depth: int = 1) -> Dict[str, Any]:
    """
    Fetches the sub-graph surrounding entity_id up to specified depth.
    If entity_id is empty or 'ALL', retrieves all graph nodes and edges.
    """
    target = entity_id if entity_id is not None else ""
    try:
        return neo4j_client.get_neighborhood(target, depth=depth)
    except Exception as e:
        logger.error(f"Failed fetching graph neighborhood for '{entity_id}': {e}")
        raise RuntimeError(f"Graph neighborhood error: {e}") from e


def run_failure_scan(equipment_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Runs the agentic Failure Intelligence workflow to detect systemic risk patterns.

    Inputs:
        equipment_id: Optional tag of equipment to analyze.

    Outputs:
        { "risk_level": "high|medium|low", "potential_failures": [...], "recommendations": [...], "alerts": [...] }
    """
    initial_state = {
        "equipment_id": equipment_id,
        "graph_context": {},
        "historical_records": [],
        "analysis_payload": {},
        "risk_level": "low",
        "potential_failures": [],
        "recommendations": [],
        "alerts": [],
        "error": None
    }

    try:
        final_state = failure_scan_agent_executor.invoke(initial_state)
        return {
            "risk_level": final_state.get("risk_level", "low"),
            "potential_failures": final_state.get("potential_failures", []),
            "recommendations": final_state.get("recommendations", []),
            "alerts": final_state.get("alerts", [])
        }
    except Exception as e:
        logger.error(f"Failure scan execution failed for '{equipment_id}': {e}")
        raise RuntimeError(f"Failure scan error: {e}") from e
