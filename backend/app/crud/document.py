from datetime import datetime, timezone
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Document


def create_document(
    db: Session,
    filename: str,
    document_type: Optional[str] = None,
    uploaded_by: Optional[str] = None,
    file_size: Optional[int] = None,
    status: str = "pending",
) -> Document:
    doc = Document(
        filename=filename,
        document_type=document_type,
        uploaded_by=uploaded_by,
        file_size=file_size,
        status=status,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(db: Session, document_id: str | uuid.UUID) -> Optional[Document]:
    if isinstance(document_id, str):
        try:
            document_id = uuid.UUID(document_id)
        except ValueError:
            return None
    return db.query(Document).filter(Document.id == document_id).first()


def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    return db.query(Document).order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()


def update_document_status(
    db: Session,
    document_id: str | uuid.UUID,
    status: str,
    graph_node_ids: Optional[List[str]] = None,
) -> Optional[Document]:
    doc = get_document(db, document_id)
    if not doc:
        return None
    doc.status = status
    if graph_node_ids is not None:
        doc.graph_node_ids = graph_node_ids
    db.commit()
    db.refresh(doc)
    return doc

