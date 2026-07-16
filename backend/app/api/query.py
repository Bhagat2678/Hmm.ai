from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.query import QueryRequest, QueryResponse
from app.services.query_service import query_knowledge_base

router = APIRouter(prefix="", tags=["query"])


@router.post("/query", response_model=QueryResponse, status_code=status.HTTP_200_OK)
def execute_query(
    request: QueryRequest,
    db: Session = Depends(get_db),
):
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=422,
            detail="The provided query string was empty.",
        )

    try:
        response = query_knowledge_base(
            query_text=request.query,
            filters=request.filters,
            db=db,
        )
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=422,
            detail=str(ve),
        )
    except Exception as e:
        raise e


