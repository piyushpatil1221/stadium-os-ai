from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    badge_number = Column(String, unique=True, nullable=False)
    zone = Column(String, nullable=False)
    role = Column(String, nullable=False)  # crowd_control, medical_assist, info_desk, etc.
    shift_start = Column(DateTime(timezone=True), nullable=True)
    shift_end = Column(DateTime(timezone=True), nullable=True)
    is_checked_in = Column(Boolean, default=False)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    tasks = Column(JSON, nullable=True)  # list of task objects
    workload_score = Column(Integer, default=0)  # 0-100 AI-assigned
    status = Column(String, default="available")  # available, busy, break, offline
    languages = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="volunteer_profile")
