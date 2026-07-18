from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import RouteRequest, RouteOut
from app.services.ai_service import generate_navigation_response

router = APIRouter(prefix="/navigator", tags=["AI Navigator"])


@router.post("/route", response_model=RouteOut)
def get_route(
    request: RouteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI-powered navigation route within the stadium."""
    route = generate_navigation_response(
        from_location=request.from_location,
        to_location=request.to_location,
        route_type=request.route_type,
        wheelchair_accessible=request.wheelchair_accessible,
        avoid_crowds=request.avoid_crowds,
        language=request.language,
    )
    return route


@router.get("/locations")
def get_locations():
    """Get list of all navigable locations in the stadium."""
    return {
        "locations": [
            "Gate A – Main Entrance", "Gate B – North Entrance", "Gate C – VIP Entrance",
            "Gate D – Staff Entrance", "Gate E – Accessible Entrance",
            "Section 101 – North Lower", "Section 102 – North Upper",
            "Section 201 – South Lower", "Section 202 – South Upper",
            "Section 301 – East Lower", "Section 401 – West Lower",
            "VIP Lounge", "Medical Center", "Information Desk – Level 1",
            "Food Court – Level 1 North", "Food Court – Level 2 South",
            "Fan Zone – East Plaza", "Merchandise Store – West Concourse",
            "Accessible Washroom – Level 1", "Accessible Washroom – Level 2",
            "Prayer Room – Gate B", "First Aid Station – Section 150",
            "Metro Station Exit", "Parking Lot A Entry", "Parking Lot B Entry",
            "Rideshare Pickup Zone", "Coach Parking Entrance",
        ]
    }
