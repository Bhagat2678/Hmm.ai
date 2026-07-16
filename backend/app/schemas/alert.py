from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class AlertSchema(BaseModel):
    id: str
    severity: str  # high | medium | low
    message: str
    created_at: datetime
    acknowledged: bool

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def map_alert_fields(cls, data: any) -> any:
        if hasattr(data, "id") and hasattr(data, "acknowledged"):
            msg = getattr(data, "description", None) or getattr(data, "title", None) or ""
            return {
                "id": str(data.id),
                "severity": data.severity or "low",
                "message": msg,
                "created_at": data.created_at,
                "acknowledged": data.acknowledged,
            }
        elif isinstance(data, dict):
            if "description" in data and "message" not in data:
                data["message"] = data["description"] or data.get("title", "")
            if "id" in data and not isinstance(data["id"], str):
                data["id"] = str(data["id"])
        return data


class AlertAcknowledgeResponse(BaseModel):
    status: str = "acknowledged"

