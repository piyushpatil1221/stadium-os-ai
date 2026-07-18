from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)  # weather, security, medical, transport, crowd
    severity = Column(String, default="info")  # info, warning, danger, critical
    zone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Sustainability(Base):
    __tablename__ = "sustainability"

    id = Column(Integer, primary_key=True, index=True)
    metric_type = Column(String, nullable=False)  # energy, waste, water, carbon
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # kWh, tons, liters, kg CO2
    target = Column(Float, nullable=True)
    zone = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String, nullable=True)
