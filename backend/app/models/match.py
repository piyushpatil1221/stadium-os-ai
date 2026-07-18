from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    home_team_code = Column(String(3), nullable=False)  # e.g. USA, BRA
    away_team_code = Column(String(3), nullable=False)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    stadium = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    kickoff_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="scheduled")  # scheduled, live, completed
    round = Column(String, nullable=False)  # Group A, Round of 16, etc.
    attendance = Column(Integer, nullable=True)
    capacity = Column(Integer, default=70000)
    ticket_price_avg = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
