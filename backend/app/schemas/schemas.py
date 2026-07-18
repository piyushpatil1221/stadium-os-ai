from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class IncidentCreate(BaseModel):
    title: str
    description: str
    incident_type: str  # medical, security, lost_child, fire, infrastructure
    location: str
    zone: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    severity: Optional[str] = None


class IncidentOut(BaseModel):
    id: int
    title: str
    description: str
    incident_type: str
    severity: str
    status: str
    location: str
    zone: Optional[str] = None
    reporter_id: Optional[int] = None
    assigned_to: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_recommended_actions: Optional[List[str]] = None
    timeline: Optional[List[Any]] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CrowdOut(BaseModel):
    id: int
    zone: str
    section: str
    current_count: int
    capacity: int
    density_percent: float
    queue_length: int
    wait_time_minutes: int
    status: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class MatchOut(BaseModel):
    id: int
    home_team: str
    away_team: str
    home_team_code: str
    away_team_code: str
    home_score: int
    away_score: int
    stadium: str
    city: str
    country: str
    kickoff_time: datetime
    status: str
    round: str
    attendance: Optional[int] = None
    capacity: int

    model_config = {"from_attributes": True}


class TransportOut(BaseModel):
    id: int
    type: str
    name: str
    status: str
    current_load: int
    capacity: int
    load_percent: float
    next_arrival_minutes: Optional[int] = None
    frequency_minutes: Optional[int] = None
    available_spaces: Optional[int] = None
    eta_minutes: Optional[int] = None

    model_config = {"from_attributes": True}


class VolunteerOut(BaseModel):
    id: int
    badge_number: str
    zone: str
    role: str
    is_checked_in: bool
    workload_score: int
    status: str
    languages: Optional[List[str]] = None
    skills: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class AlertOut(BaseModel):
    id: int
    title: str
    message: str
    alert_type: str
    severity: str
    zone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RouteRequest(BaseModel):
    from_location: str
    to_location: str
    route_type: str = "fastest"
    wheelchair_accessible: bool = False
    avoid_crowds: bool = False
    language: str = "en"


class RouteOut(BaseModel):
    from_location: str
    to_location: str
    route_type: str
    estimated_time_minutes: int
    distance_meters: float
    path_data: List[Any]
    congestion_zones: List[str]
    accessibility_features: List[str]
    ai_notes: str
