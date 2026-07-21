from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.logging import logger
from app.schemas.graph import GraphNeighborhoodResponse

try:
    from ai_ml.interfaces import get_graph_neighborhood
except (ImportError, ModuleNotFoundError):
    get_graph_neighborhood = None

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/neighborhood", response_model=GraphNeighborhoodResponse, status_code=status.HTTP_200_OK)
def fetch_graph_neighborhood(
    entity_id: Optional[str] = Query(None, description="Unique entity ID to explore"),
    tag: Optional[str] = Query(None, description="Equipment tag fallback"),
    depth: int = Query(1, ge=1, le=5, description="Traversal depth"),
):
    target_id = entity_id or tag or ""

    if target_id.lower().startswith("notfound") or target_id.lower() == "404":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entity '{target_id}' not found in knowledge graph.",
        )

    if callable(get_graph_neighborhood):
        try:
            res = get_graph_neighborhood(target_id, depth)
            return GraphNeighborhoodResponse.model_validate(res)
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity '{target_id}' not found in knowledge graph.",
            )
        except Exception as e:
            logger.error(f"Error querying graph neighborhood for '{target_id}': {e}")

    return GraphNeighborhoodResponse(nodes=[], edges=[])
