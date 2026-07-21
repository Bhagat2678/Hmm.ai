from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.logging import logger

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
@router.get("/")
def get_platform_stats(db: Session = Depends(get_db)):
    """Returns real-time platform statistics from backend data sources."""
    stats = {
        "documents_total": 0,
        "chunks_total": 0,
        "graph_nodes": 0,
        "graph_edges": 0,
        "queries_24h": 0,
        "alerts_open": 0,
        "equipment_count": 0,
        "sensor_count": 0,
        "procedure_count": 0,
        "failure_count": 0,
    }

    try:
        # Document count
        result = db.execute(text("SELECT COUNT(*) FROM documents"))
        stats["documents_total"] = result.scalar() or 0
    except Exception as e:
        logger.warning(f"Stats: could not count documents: {e}")

    try:
        # Chunk count from pgvector table
        result = db.execute(text("SELECT COUNT(*) FROM document_chunks"))
        stats["chunks_total"] = result.scalar() or 0
    except Exception as e:
        logger.warning(f"Stats: could not count chunks: {e}")

    try:
        # Queries in last 24h from audit_log
        if db.bind and db.bind.dialect.name == "sqlite":
            query_sql = text("SELECT COUNT(*) FROM audit_log WHERE action = 'query_executed' AND created_at > datetime('now', '-1 day')")
        else:
            query_sql = text("SELECT COUNT(*) FROM audit_log WHERE action = 'query_executed' AND created_at > NOW() - INTERVAL '24 hours'")
        result = db.execute(query_sql)
        stats["queries_24h"] = result.scalar() or 0
    except Exception as e:
        logger.warning(f"Stats: could not count queries: {e}")

    try:
        # Open alerts
        result = db.execute(text("SELECT COUNT(*) FROM alerts WHERE acknowledged = false"))
        stats["alerts_open"] = result.scalar() or 0
    except Exception as e:
        logger.warning(f"Stats: could not count alerts: {e}")

    # Get graph stats from ai_ml module if available
    try:
        from ai_ml.graph.neo4j_client import neo4j_client
        if neo4j_client.memory_graph is not None:
            stats["graph_nodes"] = neo4j_client.memory_graph.number_of_nodes()
            stats["graph_edges"] = neo4j_client.memory_graph.number_of_edges()

            # Count node types from memory graph
            for node_id, data in neo4j_client.memory_graph.nodes(data=True):
                label = data.get("label", "").lower()
                if label in ("equipment", "pump", "compressor", "valve", "exchanger", "vessel", "tank"):
                    stats["equipment_count"] += 1
                elif label in ("sensor", "instrument", "tag"):
                    stats["sensor_count"] += 1
                elif label in ("procedure", "sop", "document"):
                    stats["procedure_count"] += 1
                elif label in ("failure", "failure_mode", "defect"):
                    stats["failure_count"] += 1
    except Exception as e:
        logger.warning(f"Stats: could not get graph stats: {e}")

    return stats
