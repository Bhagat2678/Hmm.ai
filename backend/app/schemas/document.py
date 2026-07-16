from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class DocumentSchema(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def map_uploaded_at(cls, data: any) -> any:
        if hasattr(data, "uploaded_at") and not hasattr(data, "upload_date"):
            # If ORM object has uploaded_at, map to upload_date dictionary / attribute
            return {
                "id": str(data.id),
                "filename": data.filename,
                "upload_date": data.uploaded_at,
                "status": data.status,
            }
        elif isinstance(data, dict):
            if "uploaded_at" in data and "upload_date" not in data:
                data["upload_date"] = data["uploaded_at"]
            if "id" in data and not isinstance(data["id"], str):
                data["id"] = str(data["id"])
        return data


class DocumentUploadResponse(BaseModel):
    id: str
    status: str
    message: str = "Upload successful, ingestion started."

