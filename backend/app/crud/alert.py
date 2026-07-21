import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Alert


def create_alert(
    db: Session,
    title: str,
    description: str,
    related_equipment_tags: Optional[List[str]] = None,
    severity: str = "low",
) -> Alert:
    alert = Alert(
        title=title,
        description=description,
        related_equipment_tags=related_equipment_tags or [],
        severity=severity,
        acknowledged=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alert(db: Session, alert_id: str | uuid.UUID) -> Optional[Alert]:
    if isinstance(alert_id, str):
        try:
            alert_id = uuid.UUID(alert_id)
        except ValueError:
            return None
    return db.query(Alert).filter(Alert.id == alert_id).first()


def get_alerts(db: Session, skip: int = 0, limit: int = 100) -> List[Alert]:
    return db.query(Alert).order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


def acknowledge_alert(db: Session, alert_id: str | uuid.UUID) -> Optional[Alert]:
    alert = get_alert(db, alert_id)
    if not alert:
        return None
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert

def escalate_alert(db: Session, alert_id: str | uuid.UUID) -> Optional[Alert]:
    alert = get_alert(db, alert_id)
    if not alert:
        return None
    alert.escalated = True
    alert.severity = "high"
    db.commit()
    db.refresh(alert)
    return alert

