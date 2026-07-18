from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.volunteer import Volunteer
from app.schemas.schemas import VolunteerOut
from app.services.ai_service import generate_volunteer_balance_recommendation

router = APIRouter(prefix="/volunteers", tags=["Volunteer Operations"])


@router.get("/", response_model=List[VolunteerOut])
def get_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all volunteers."""
    return db.query(Volunteer).all()


@router.get("/summary")
def get_volunteer_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get volunteer deployment summary."""
    volunteers = db.query(Volunteer).all()
    checked_in = [v for v in volunteers if v.is_checked_in]
    available = [v for v in checked_in if v.status == "available"]
    busy = [v for v in checked_in if v.status == "busy"]
    on_break = [v for v in checked_in if v.status == "break"]
    
    return {
        "total": len(volunteers),
        "checked_in": len(checked_in),
        "available": len(available),
        "busy": len(busy),
        "on_break": len(on_break),
        "ai_recommendation": generate_volunteer_balance_recommendation([
            {"id": v.id, "zone": v.zone, "workload": v.workload_score} for v in volunteers
        ]),
    }


@router.patch("/{volunteer_id}/checkin")
def check_in_volunteer(
    volunteer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in a volunteer for their shift."""
    from fastapi import HTTPException
    from datetime import datetime
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    volunteer.is_checked_in = True
    volunteer.check_in_time = datetime.utcnow()
    volunteer.status = "available"
    db.commit()
    return {"message": f"Volunteer {volunteer.badge_number} checked in successfully"}
