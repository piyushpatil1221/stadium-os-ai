from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(String, nullable=False)  # medical, security, lost_child, fire, infrastructure
    severity = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    location = Column(String, nullable=False)
    zone = Column(String, nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_recommended_actions = Column(JSON, nullable=True)
    timeline = Column(JSON, nullable=True)  # list of events
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reporter = relationship("User", back_populates="incidents")
