from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Crowd(Base):
    __tablename__ = "crowds"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, nullable=True)
    zone = Column(String, nullable=False)  # North Stand, South Stand, etc.
    section = Column(String, nullable=False)  # A1, B2, etc.
    current_count = Column(Integer, default=0)
    capacity = Column(Integer, default=5000)
    density_percent = Column(Float, default=0.0)
    queue_length = Column(Integer, default=0)
    wait_time_minutes = Column(Integer, default=0)
    status = Column(String, default="normal")  # normal, busy, critical
    heatmap_data = Column(JSON, nullable=True)  # zone-level density grid
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
