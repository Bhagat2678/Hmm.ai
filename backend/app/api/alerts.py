from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.alert import AlertSchema, AlertAcknowledgeResponse, AlertEscalateResponse
from app.services.alert_service import list_all_alerts, acknowledge_alert_service, escalate_alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertSchema], status_code=status.HTTP_200_OK)
@router.get("/", response_model=List[AlertSchema], status_code=status.HTTP_200_OK)
def list_alerts(db: Session = Depends(get_db)):
    alerts = list_all_alerts(db)
    return [AlertSchema.model_validate(alert) for alert in alerts]


@router.post("/{id}/acknowledge", response_model=AlertAcknowledgeResponse, status_code=status.HTTP_200_OK)
def acknowledge_alert_endpoint(id: str, db: Session = Depends(get_db)):
    alert = acknowledge_alert_service(id, db)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id '{id}' not found.",
        )
    return AlertAcknowledgeResponse(status="acknowledged")


@router.post("/{id}/escalate", response_model=AlertEscalateResponse, status_code=status.HTTP_200_OK)
def escalate_alert_endpoint(id: str, db: Session = Depends(get_db)):
    alert = escalate_alert_service(id, db)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id '{id}' not found.",
        )
    return AlertEscalateResponse(status="escalated")

