from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert, Sustainability
from app.services.ai_service import generate_sustainability_insight, generate_operational_insight

router = APIRouter(prefix="/sustainability", tags=["Sustainability"])


@router.get("/")
def get_sustainability_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all sustainability metrics."""
    metrics = db.query(Sustainability).all()
    return [
        {
            "id": m.id,
            "metric_type": m.metric_type,
            "value": m.value,
            "unit": m.unit,
            "target": m.target,
            "percent_of_target": round((m.value / m.target) * 100, 1) if m.target else None,
            "timestamp": m.timestamp,
        }
        for m in metrics
    ]


@router.get("/insight")
def get_sustainability_insight(
    current_user: User = Depends(get_current_user),
):
    """Get AI-powered sustainability recommendation."""
    return {"insight": generate_sustainability_insight()}


router_alerts = APIRouter(prefix="/alerts", tags=["Alerts"])


@router_alerts.get("/")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all active alerts."""
    alerts = db.query(Alert).filter(Alert.is_active == True).order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "zone": a.zone,
            "created_at": a.created_at,
        }
        for a in alerts
    ]
