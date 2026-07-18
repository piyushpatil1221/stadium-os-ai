from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Transport(Base):
    __tablename__ = "transport"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # metro, bus, rideshare, parking
    name = Column(String, nullable=False)  # Line 1, Lot A, etc.
    status = Column(String, default="operational")  # operational, delayed, disrupted, closed
    current_load = Column(Integer, default=0)
    capacity = Column(Integer, default=1000)
    load_percent = Column(Float, default=0.0)
    next_arrival_minutes = Column(Integer, nullable=True)
    frequency_minutes = Column(Integer, nullable=True)
    route = Column(JSON, nullable=True)
    location = Column(String, nullable=True)
    available_spaces = Column(Integer, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
