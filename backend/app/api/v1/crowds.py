from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.crowd import Crowd
from app.schemas.schemas import CrowdOut
from app.services.ai_service import generate_crowd_insight

router = APIRouter(prefix="/crowds", tags=["Crowd Intelligence"])


@router.get("/", response_model=List[CrowdOut])
def get_all_crowds(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer")),
):
    """Get live crowd density for all zones."""
    return db.query(Crowd).all()


@router.get("/zone/{zone}", response_model=List[CrowdOut])
def get_crowd_by_zone(
    zone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer", "volunteer")),
):
    """Get crowd data for a specific zone."""
    crowds = db.query(Crowd).filter(Crowd.zone == zone).all()
    if not crowds:
        raise HTTPException(status_code=404, detail=f"Zone '{zone}' not found")
    return crowds


@router.get("/summary")
def get_crowd_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer", "volunteer")),
):
    """Get aggregated crowd summary stats for the dashboard."""
    crowds = db.query(Crowd).all()
    if not crowds:
        return {"total": 0, "avg_density": 0, "critical_zones": [], "ai_insight": ""}
    
    total = sum(c.current_count for c in crowds)
    avg_density = sum(c.density_percent for c in crowds) / len(crowds)
    critical = [c.zone for c in crowds if c.status == "critical"]
    busy = [c.zone for c in crowds if c.status == "busy"]
    
    return {
        "total_attendance": total,
        "avg_density_percent": round(avg_density, 1),
        "critical_zones": list(set(critical)),
        "busy_zones": list(set(busy)),
        "zone_count": len(crowds),
        "ai_insight": generate_crowd_insight(),
    }


@router.get("/heatmap")
def get_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("staff", "organizer")),
):
    """Get heatmap data as a structured grid for visualization."""
    crowds = db.query(Crowd).all()
    return [
        {
            "zone": c.zone,
            "section": c.section,
            "density": c.density_percent,
            "status": c.status,
            "count": c.current_count,
        }
        for c in crowds
    ]
