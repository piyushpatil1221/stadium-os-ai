from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    FAN = "fan"
    STAFF = "staff"
    VOLUNTEER = "volunteer"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.FAN)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String, default="en")
    accessibility_needs = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    incidents = relationship("Incident", back_populates="reporter")
    volunteer_profile = relationship("Volunteer", back_populates="user", uselist=False)
