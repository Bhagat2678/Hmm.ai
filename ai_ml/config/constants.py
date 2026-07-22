"""
Constants for the AI/ML module of Bedrock platform.
"""

from typing import List, Dict, Any

# Document Types
DOC_TYPE_MAINTENANCE_RECORD = "maintenance_record"
DOC_TYPE_INSPECTION_REPORT = "inspection_report"
DOC_TYPE_SAFETY_PROCEDURE = "safety_procedure"
DOC_TYPE_PNID = "pnid"
DOC_TYPE_OPERATING_INSTRUCTION = "operating_instruction"
DOC_TYPE_PROJECT_FILE = "project_file"

SUPPORTED_DOCUMENT_TYPES: List[str] = [
    DOC_TYPE_MAINTENANCE_RECORD,
    DOC_TYPE_INSPECTION_REPORT,
    DOC_TYPE_SAFETY_PROCEDURE,
    DOC_TYPE_PNID,
    DOC_TYPE_OPERATING_INSTRUCTION,
    DOC_TYPE_PROJECT_FILE,
]

# Knowledge Graph Node Labels
NODE_EQUIPMENT = "Equipment"
NODE_DOCUMENT = "Document"
NODE_PERSON = "Person"
NODE_INCIDENT = "Incident"
NODE_REGULATORY_REF = "RegulatoryRef"
NODE_PROCESS_PARAMETER = "ProcessParameter"

VALID_NODE_LABELS: List[str] = [
    NODE_EQUIPMENT,
    NODE_DOCUMENT,
    NODE_PERSON,
    NODE_INCIDENT,
    NODE_REGULATORY_REF,
    NODE_PROCESS_PARAMETER,
]

# Knowledge Graph Edge/Relationship Types
REL_MENTIONED_IN = "MENTIONED_IN"
REL_MAINTAINED_BY = "MAINTAINED_BY"
REL_LINKED_TO_INCIDENT = "LINKED_TO_INCIDENT"
REL_REFERENCES_REGULATION = "REFERENCES_REGULATION"
REL_PART_OF = "PART_OF"
REL_CONNECTED_TO = "CONNECTED_TO"
REL_HAS_PART = "HAS_PART"
REL_CAUSED_BY = "CAUSED_BY"
REL_RESOLVED_BY = "RESOLVED_BY"

VALID_RELATIONSHIP_TYPES: List[str] = [
    REL_MENTIONED_IN,
    REL_MAINTAINED_BY,
    REL_LINKED_TO_INCIDENT,
    REL_REFERENCES_REGULATION,
    REL_PART_OF,
    REL_CONNECTED_TO,
    REL_HAS_PART,
    REL_CAUSED_BY,
    REL_RESOLVED_BY,
]

# Model Defaults
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
DEFAULT_CHEAP_MODEL = "llama-3.1-8b-instant"
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# Search & Retrieval Defaults
TOP_K_HYBRID_RESULTS = 5
TOP_K_VECTOR_RESULTS = 5
TOP_K_GRAPH_RESULTS = 5
DEFAULT_GRAPH_DEPTH = 1
FUZZY_MATCH_THRESHOLD = 0.85

# Standard JSON Output Schema for Document Extraction
EXTRACTION_SCHEMA: Dict[str, Any] = {
    "document_type": "maintenance_record | inspection_report | safety_procedure | pnid | operating_instruction | project_file",
    "entities": {
        "equipment_tags": ["..."],
        "process_parameters": [{"name": "...", "value": "...", "unit": "..."}],
        "regulatory_refs": ["..."],
        "personnel": ["..."],
        "dates": ["..."]
    },
    "relationships": [{"from": "...", "to": "...", "type": "..."}],
    "summary": "..."
}
