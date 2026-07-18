from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.match import Match
from app.schemas.schemas import MatchOut

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("/", response_model=List[MatchOut])
def get_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all matches."""
    return db.query(Match).order_by(Match.kickoff_time).all()


@router.get("/live", response_model=List[MatchOut])
def get_live_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get currently live matches."""
    return db.query(Match).filter(Match.status == "live").all()


@router.get("/{match_id}", response_model=MatchOut)
def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific match."""
    from fastapi import HTTPException
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
