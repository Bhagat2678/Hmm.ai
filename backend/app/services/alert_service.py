from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.alert import get_alerts, acknowledge_alert, create_alert
from app.crud.audit import create_audit_entry
from app.db.models import Alert


def list_all_alerts(db: Session) -> List[Alert]:
    return get_alerts(db)


def acknowledge_alert_service(alert_id: str, db: Session) -> Optional[Alert]:
    alert = acknowledge_alert(db, alert_id)
    if alert:
        create_audit_entry(
            db,
            action="alert_acknowledged",
            details={"alert_id": str(alert.id), "title": alert.title},
        )
    return alert


def create_alert_service(
    db: Session,
    title: str,
    description: str,
    related_equipment_tags: Optional[List[str]] = None,
    severity: str = "low",
) -> Alert:
    alert = create_alert(
        db,
        title=title,
        description=description,
        related_equipment_tags=related_equipment_tags,
        severity=severity,
    )
    create_audit_entry(
        db,
        action="alert_created",
        details={
            "alert_id": str(alert.id),
            "title": title,
            "severity": severity,
        },
    )
    return alert

