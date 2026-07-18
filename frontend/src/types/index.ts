// Core domain types for StadiumOS AI

export interface User {
  id: number
  email: string
  full_name: string
  role: 'fan' | 'staff' | 'volunteer' | 'organizer' | 'admin'
  avatar_url?: string
  is_active: boolean
  preferred_language: string
  accessibility_needs?: string
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Match {
  id: number
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  home_score: number
  away_score: number
  stadium: string
  city: string
  country: string
  kickoff_time: string
  status: 'scheduled' | 'live' | 'completed'
  round: string
  attendance?: number
  capacity: number
}

export interface Crowd {
  id: number
  zone: string
  section: string
  current_count: number
  capacity: number
  density_percent: number
  queue_length: number
  wait_time_minutes: number
  status: 'normal' | 'busy' | 'critical'
  timestamp: string
}

export interface CrowdSummary {
  total_attendance: number
  avg_density_percent: number
  critical_zones: string[]
  busy_zones: string[]
  zone_count: number
  ai_insight: string
}

export interface Incident {
  id: number
  title: string
  description: string
  incident_type: 'medical' | 'security' | 'lost_child' | 'fire' | 'infrastructure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  location: string
  zone?: string
  reporter_id?: number
  assigned_to?: string
  ai_summary?: string
  ai_recommended_actions?: string[]
  timeline?: TimelineEvent[]
  created_at: string
  resolved_at?: string
}

export interface TimelineEvent {
  time: string
  event: string
  actor: string
}

export interface Transport {
  id: number
  type: 'metro' | 'bus' | 'parking' | 'rideshare'
  name: string
  status: 'operational' | 'delayed' | 'disrupted' | 'closed' | 'full'
  current_load: number
  capacity: number
  load_percent: number
  next_arrival_minutes?: number
  frequency_minutes?: number
  available_spaces?: number
  eta_minutes?: number
}

export interface TransportSummary {
  total: number
  operational: number
  disrupted: number
  available_parking_spaces: number
  recommendation: string
}

export interface Volunteer {
  id: number
  badge_number: string
  zone: string
  role: string
  is_checked_in: boolean
  workload_score: number
  status: 'available' | 'busy' | 'break' | 'offline'
  languages?: string[]
  skills?: string[]
}

export interface VolunteerSummary {
  total: number
  checked_in: number
  available: number
  busy: number
  on_break: number
  ai_recommendation: string
}

export interface Alert {
  id: number
  title: string
  message: string
  alert_type: 'weather' | 'security' | 'medical' | 'transport' | 'crowd'
  severity: 'info' | 'warning' | 'danger' | 'critical'
  zone?: string
  is_active: boolean
  created_at: string
}

export interface SustainabilityMetric {
  id: number
  metric_type: 'energy' | 'waste' | 'water' | 'carbon'
  value: number
  unit: string
  target?: number
  percent_of_target?: number
  timestamp: string
}

export interface RouteRequest {
  from_location: string
  to_location: string
  route_type: 'fastest' | 'least_crowded' | 'accessible'
  wheelchair_accessible: boolean
  avoid_crowds: boolean
  language: string
}

export interface RouteResult {
  from_location: string
  to_location: string
  route_type: string
  estimated_time_minutes: number
  distance_meters: number
  path_data: Waypoint[]
  congestion_zones: string[]
  accessibility_features: string[]
  ai_notes: string
}

export interface Waypoint {
  x: number
  y: number
  label: string
}

export interface Token {
  access_token: string
  token_type: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
  remember_me: boolean
}

export interface RegisterRequest {
  email: string
  full_name: string
  password: string
  role: string
  preferred_language: string
}
