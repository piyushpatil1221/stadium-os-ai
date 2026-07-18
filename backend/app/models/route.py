from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    from_location = Column(String, nullable=False)
    to_location = Column(String, nullable=False)
    route_type = Column(String, default="fastest")  # fastest, accessible, least_crowded
    estimated_time_minutes = Column(Integer, nullable=True)
    distance_meters = Column(Float, nullable=True)
    path_data = Column(JSON, nullable=True)  # list of waypoints/coordinates
    congestion_zones = Column(JSON, nullable=True)
    accessibility_features = Column(JSON, nullable=True)
    ai_notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
