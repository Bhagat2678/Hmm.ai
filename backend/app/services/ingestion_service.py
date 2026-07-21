from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.crud.document import update_document_status
from app.crud.audit import create_audit_entry

# Try importing AI/ML interface gracefully
try:
    from ai_ml.interfaces import ingest_document
except (ImportError, ModuleNotFoundError):
    ingest_document = None


def process_ingestion(
    document_id: str,
    file_content: bytes,
    filename: str,
    db: Session,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Orchestrates background document ingestion.
    Updates document status to 'processing' -> 'ingested' (or 'failed')
    and logs actions to audit_log.
    """
    logger.info(f"Starting ingestion for document_id={document_id}, filename={filename}")
    meta = metadata or {"filename": filename, "document_id": document_id}

    # Update status to processing
    update_document_status(db, document_id, status="processing")

    try:
        if not callable(ingest_document):
            raise RuntimeError(
                "ai_ml.interfaces.ingest_document is not available. "
                "Ensure the ai_ml module is installed and all dependencies are met. "
                "Mock/stub ingestion is disabled."
            )

        res = ingest_document(file_content, meta)

        graph_nodes = res.get("graph_node_ids") if isinstance(res, dict) else None
        if not graph_nodes and isinstance(res, dict) and "entities_extracted" in res:
            graph_nodes = [f"node-{document_id[:8]}"]

        update_document_status(
            db,
            document_id,
            status="ingested",
            graph_node_ids=graph_nodes,
        )

        create_audit_entry(
            db,
            action="document_ingestion_success",
            details={
                "document_id": document_id,
                "filename": filename,
                "result": res if isinstance(res, dict) else str(res),
            },
        )
        logger.info(f"Completed ingestion for document_id={document_id}")
        return res if isinstance(res, dict) else {"status": "success"}

    except Exception as e:
        logger.error(f"Ingestion failed for document_id={document_id}: {str(e)}")
        update_document_status(db, document_id, status="failed")
        create_audit_entry(
            db,
            action="document_ingestion_failure",
            details={
                "document_id": document_id,
                "filename": filename,
                "error": str(e),
            },
        )
        raise e

