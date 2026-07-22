import os
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud.document import create_document, get_document, get_documents
from app.crud.audit import create_audit_entry
from app.schemas.document import DocumentSchema, DocumentUploadResponse
from app.services.ingestion_service import process_ingestion

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be provided.",
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 1. Insert database row with status='pending'
    doc = create_document(
        db,
        filename=file.filename,
        document_type=file.content_type or "application/octet-stream",
        status="pending",
    )

    # Save to disk
    file_path = os.path.join(UPLOAD_DIR, str(doc.id) + "_" + file.filename)
    with open(file_path, "wb") as f:
        f.write(content)

    create_audit_entry(
        db,
        action="document_upload_received",
        details={"document_id": str(doc.id), "filename": file.filename},
    )

    # 2. Add non-blocking background ingestion task
    background_tasks.add_task(
        process_ingestion,
        document_id=str(doc.id),
        file_content=content,
        filename=file.filename,
    )

    # 3. Immediately return 202 Accepted
    return DocumentUploadResponse(
        id=str(doc.id),
        status="pending",
        message="Upload successful, ingestion started.",
    )


@router.get("", response_model=List[DocumentSchema], status_code=status.HTTP_200_OK)
@router.get("/", response_model=List[DocumentSchema], status_code=status.HTTP_200_OK)
def list_documents(db: Session = Depends(get_db)):
    docs = get_documents(db)
    return [DocumentSchema.model_validate(doc) for doc in docs]


@router.get("/{id}", response_model=DocumentSchema, status_code=status.HTTP_200_OK)
def get_document_by_id(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with id '{id}' not found.",
        )
    return DocumentSchema.model_validate(doc)


@router.get("/{id}/download")
def download_document(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    return FileResponse(file_path, filename=doc.filename)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
    if os.path.exists(file_path):
        os.remove(file_path)
    return None

@router.post("/{id}/pause")
def pause_queue_item(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{id}' not found.")
    if doc.status not in ("pending", "processing"):
        raise HTTPException(status_code=400, detail=f"Cannot pause document with status '{doc.status}'.")
    doc.status = "paused"
    db.commit()
    create_audit_entry(db, action="document_paused", details={"document_id": id})
    return {"status": "paused", "document_id": id}

@router.post("/{id}/resume")
def resume_queue_item(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{id}' not found.")
    if doc.status != "paused":
        raise HTTPException(status_code=400, detail=f"Cannot resume document with status '{doc.status}'.")
    doc.status = "pending"
    db.commit()
    create_audit_entry(db, action="document_resumed", details={"document_id": id})
    return {"status": "pending", "document_id": id}

@router.post("/{id}/retry")
def retry_queue_item(id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{id}' not found.")
    if doc.status not in ("failed",):
        raise HTTPException(status_code=400, detail=f"Can only retry documents with status 'failed', got '{doc.status}'.")
    doc.status = "pending"
    db.commit()

    # Re-read the file from disk to re-trigger ingestion
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Source file not found on disk for document '{id}'.")
    with open(file_path, "rb") as f:
        content = f.read()

    background_tasks.add_task(
        process_ingestion,
        document_id=str(doc.id),
        file_content=content,
        filename=doc.filename,
    )
    create_audit_entry(db, action="document_retry", details={"document_id": id})
    return {"status": "pending", "document_id": id}

@router.post("/{id}/cancel")
def cancel_queue_item(id: str, db: Session = Depends(get_db)):
    doc = get_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{id}' not found.")
    doc.status = "failed"
    db.commit()
    create_audit_entry(db, action="document_cancelled", details={"document_id": id})
    return {"status": "failed", "document_id": id}

@router.post("/clear-completed")
def clear_completed(db: Session = Depends(get_db)):
    from app.models.document import Document
    completed = db.query(Document).filter(Document.status == "ingested").all()
    count = len(completed)
    for doc in completed:
        file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
        if os.path.exists(file_path):
            os.remove(file_path)
        db.delete(doc)
    db.commit()
    create_audit_entry(db, action="clear_completed", details={"count": count})
    return {"status": "cleared", "count": count}

def fetch_and_ingest_url(document_id: str, url: str, filename: str):
    import urllib.request
    from app.crud.document import update_document_status

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "MhmmAI-Ingestion-Bot/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()

        if not content:
            raise ValueError("Downloaded content from URL is empty.")

        file_path = os.path.join(UPLOAD_DIR, f"{document_id}_{filename}")
        with open(file_path, "wb") as f:
            f.write(content)

        process_ingestion(
            document_id=document_id,
            file_content=content,
            filename=filename,
        )
    except Exception as e:
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            update_document_status(db, document_id, status="failed")
            create_audit_entry(
                db,
                action="document_import_url_failure",
                details={"document_id": document_id, "url": url, "error": str(e)},
            )
        finally:
            db.close()


@router.post("/import-url")
def import_url(url: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not url or not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="A valid HTTP(S) URL is required.")

    filename = url.split("/")[-1] or "imported_document.html"
    doc = create_document(
        db,
        filename=filename,
        document_type="text/html",
        status="pending",
    )
    create_audit_entry(
        db,
        action="document_import_url",
        details={"document_id": str(doc.id), "url": url},
    )

    background_tasks.add_task(
        fetch_and_ingest_url,
        document_id=str(doc.id),
        url=url,
        filename=filename,
    )

    return {"status": "queued", "document_id": str(doc.id), "filename": filename}


