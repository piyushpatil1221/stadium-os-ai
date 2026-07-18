from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transport import Transport
from app.schemas.schemas import TransportOut

router = APIRouter(prefix="/transport", tags=["Transport"])


@router.get("/", response_model=List[TransportOut])
def get_all_transport(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get status of all transport options."""
    return db.query(Transport).all()


@router.get("/type/{transport_type}", response_model=List[TransportOut])
def get_transport_by_type(
    transport_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transport options filtered by type (metro, bus, parking, rideshare)."""
    return db.query(Transport).filter(Transport.type == transport_type).all()


@router.get("/summary")
def get_transport_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transport summary for dashboard."""
    transports = db.query(Transport).all()
    operational = sum(1 for t in transports if t.status == "operational")
    disrupted = sum(1 for t in transports if t.status in ["delayed", "disrupted", "closed"])
    
    parking_spaces = sum(t.available_spaces or 0 for t in transports if t.type == "parking")
    
    return {
        "total": len(transports),
        "operational": operational,
        "disrupted": disrupted,
        "available_parking_spaces": parking_spaces,
        "recommendation": "Use Metro Line 1 for fastest stadium access. Lot B has 400 spaces available." if operational > disrupted else "Multiple transport disruptions. Check alternatives below.",
    }
