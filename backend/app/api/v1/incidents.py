from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.incident import Incident
from app.schemas.schemas import IncidentCreate, IncidentUpdate, IncidentOut
from app.services.ai_service import generate_incident_ai_analysis

router = APIRouter(prefix="/incidents", tags=["Incident Center"])


@router.get("/", response_model=List[IncidentOut])
def list_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer", "volunteer")),
):
    """List all incidents with optional filtering."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    return query.order_by(Incident.created_at.desc()).all()


@router.post("/", response_model=IncidentOut, status_code=201)
def create_incident(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer", "volunteer")),
):
    """Report a new incident. AI will automatically analyze and assign severity."""
    ai = generate_incident_ai_analysis(
        incident_data.incident_type,
        incident_data.description,
        incident_data.location,
    )
    incident = Incident(
        title=incident_data.title,
        description=incident_data.description,
        incident_type=incident_data.incident_type,
        location=incident_data.location,
        zone=incident_data.zone,
        reporter_id=current_user.id,
        severity=ai["severity"],
        ai_summary=ai["ai_summary"],
        ai_recommended_actions=ai["ai_recommended_actions"],
        timeline=ai["timeline"],
        status="open",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer")),
):
    """Get a specific incident by ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    update: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer")),
):
    """Update incident status or assignment."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(incident, field, value)
    db.commit()
    db.refresh(incident)
    return incident

