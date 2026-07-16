from typing import Dict, List, Any
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language query string")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Optional search filters")


class QuerySource(BaseModel):
    doc_id: str
    title: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[QuerySource] = Field(default_factory=list)
    confidence: float

