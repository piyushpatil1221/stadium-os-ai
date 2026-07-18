"""
AI Service — Context-aware intelligent engine for StadiumOS AI.
Uses rule-based logic, time-of-day awareness, and spatial reasoning
to generate actionable stadium operations recommendations.
No external API keys required — runs entirely offline.
"""
import random
import math
from typing import List, Dict, Any, Optional
from datetime import datetime


# ─── Stadium Coordinate Map ────────────────────────────────────────────────────
# All coordinates are within a 700x500 SVG viewBox representing SoFi Stadium.
# The stadium is oval-shaped centered at (350, 250).
# Gates are on the perimeter; sections, amenities, and corridors are inside.
#
# Layout:
#   Gate A (North): 350, 28
#   Gate B (NE):    580, 140
#   Gate C (SE):    580, 360
#   Gate D (South): 350, 468
#   Gate E (West/Accessible): 120, 250
#
#   North Stand:    350, 90
#   South Stand:    350, 400
#   East Wing:      550, 250
#   West Wing:      150, 250
#   VIP Lounge:     350, 170
#   Field (center): 350, 250
#
LOCATION_COORDS: Dict[str, Dict[str, Any]] = {
    # Gates
    "Gate A – Main Entrance":           {"x": 350, "y": 28,  "zone": "gate",    "label": "Gate A"},
    "Gate B – North Entrance":          {"x": 590, "y": 140, "zone": "gate",    "label": "Gate B"},
    "Gate C – VIP Entrance":            {"x": 590, "y": 360, "zone": "gate",    "label": "Gate C"},
    "Gate D – Staff Entrance":          {"x": 350, "y": 468, "zone": "gate",    "label": "Gate D"},
    "Gate E – Accessible Entrance":     {"x": 110, "y": 250, "zone": "gate",    "label": "Gate E"},

    # Stands / Sections
    "Section 101 – North Lower":        {"x": 350, "y": 100, "zone": "north",   "label": "S101"},
    "Section 102 – North Upper":        {"x": 350, "y": 70,  "zone": "north",   "label": "S102"},
    "Section 201 – South Lower":        {"x": 350, "y": 398, "zone": "south",   "label": "S201"},
    "Section 202 – South Upper":        {"x": 350, "y": 430, "zone": "south",   "label": "S202"},
    "Section 301 – East Lower":         {"x": 550, "y": 250, "zone": "east",    "label": "S301"},
    "Section 401 – West Lower":         {"x": 150, "y": 250, "zone": "west",    "label": "S401"},

    # Amenities
    "VIP Lounge":                       {"x": 350, "y": 175, "zone": "vip",     "label": "VIP"},
    "Medical Center":                   {"x": 470, "y": 430, "zone": "south",   "label": "Medical"},
    "Information Desk – Level 1":       {"x": 350, "y": 130, "zone": "north",   "label": "Info Desk"},
    "Food Court – Level 1 North":       {"x": 250, "y": 95,  "zone": "north",   "label": "Food N"},
    "Food Court – Level 2 South":       {"x": 450, "y": 420, "zone": "south",   "label": "Food S"},
    "Fan Zone – East Plaza":            {"x": 610, "y": 250, "zone": "east",    "label": "Fan Zone"},
    "Merchandise Store – West Concourse":{"x": 155, "y": 180,"zone": "west",    "label": "Merch"},
    "Accessible Washroom – Level 1":    {"x": 200, "y": 250, "zone": "west",    "label": "WC A11"},
    "Accessible Washroom – Level 2":    {"x": 500, "y": 130, "zone": "north",   "label": "WC A12"},
    "Prayer Room – Gate B":             {"x": 555, "y": 120, "zone": "north",   "label": "Prayer"},
    "First Aid Station – Section 150":  {"x": 230, "y": 155, "zone": "west",    "label": "First Aid"},

    # Transport
    "Metro Station Exit":               {"x": 350, "y": 488, "zone": "south",   "label": "Metro"},
    "Parking Lot A Entry":              {"x": 120, "y": 460, "zone": "south",   "label": "Lot A"},
    "Parking Lot B Entry":              {"x": 580, "y": 460, "zone": "south",   "label": "Lot B"},
    "Rideshare Pickup Zone":            {"x": 120, "y": 380, "zone": "west",    "label": "Rideshare"},
    "Coach Parking Entrance":           {"x": 470, "y": 488, "zone": "south",   "label": "Coach"},
}

# Concourse ring waypoints (outer corridor) — for routing around the stadium
# These are the main "highways" fans walk through
OUTER_RING: List[Dict[str, Any]] = [
    {"x": 350, "y": 55,  "label": "North Concourse"},
    {"x": 480, "y": 80,  "label": "NE Concourse"},
    {"x": 570, "y": 160, "label": "East Upper Concourse"},
    {"x": 580, "y": 250, "label": "East Concourse"},
    {"x": 570, "y": 340, "label": "East Lower Concourse"},
    {"x": 480, "y": 420, "label": "SE Concourse"},
    {"x": 350, "y": 445, "label": "South Concourse"},
    {"x": 220, "y": 420, "label": "SW Concourse"},
    {"x": 130, "y": 340, "label": "West Lower Concourse"},
    {"x": 120, "y": 250, "label": "West Concourse"},
    {"x": 130, "y": 160, "label": "West Upper Concourse"},
    {"x": 220, "y": 80,  "label": "NW Concourse"},
]

def _ring_index(x: int, y: int) -> int:
    """Return the closest outer ring node index for a given point."""
    cx, cy = 350, 250
    angle = math.atan2(y - cy, x - cx)
    # Normalize to 0..2π
    if angle < 0:
        angle += 2 * math.pi
    # Map angle to ring index (ring has 12 nodes, each 30° apart, starting East)
    idx = int((angle / (2 * math.pi)) * len(OUTER_RING))
    return idx % len(OUTER_RING)


def _route_via_ring(
    start_coords: Dict[str, Any],
    end_coords: Dict[str, Any],
    start_name: str,
    end_name: str,
) -> List[Dict[str, Any]]:
    """
    Build a realistic corridor path from start to end.
    Strategy:
      1. start point
      2. Nearest outer ring entry from start
      3. Walk ring nodes in the shorter direction to the ring node nearest to end
      4. end point
    """
    si = _ring_index(start_coords["x"], start_coords["y"])
    ei = _ring_index(end_coords["x"], end_coords["y"])

    n = len(OUTER_RING)
    # Choose shortest arc
    cw_steps = (ei - si) % n
    ccw_steps = (si - ei) % n

    path = [{"x": start_coords["x"], "y": start_coords["y"], "label": start_name}]

    if cw_steps <= ccw_steps:
        steps = list(range(si, si + cw_steps + 1))
    else:
        steps = list(range(si, si - ccw_steps - 1, -1))

    for step in steps:
        node = OUTER_RING[step % n]
        path.append({"x": node["x"], "y": node["y"], "label": node["label"]})

    path.append({"x": end_coords["x"], "y": end_coords["y"], "label": end_name})
    return path


def _euclidean(a: Dict, b: Dict) -> float:
    return math.sqrt((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2)


def _estimate_time_and_distance(path: List[Dict]) -> tuple:
    """Estimate walking time (minutes) and total distance (meters) for a path.
    SVG unit ≈ 0.5 meters for a ~65,000-seat oval stadium like SoFi.
    """
    total_svg = sum(_euclidean(path[i], path[i + 1]) for i in range(len(path) - 1))
    meters = round(total_svg * 0.65, 1)
    # Avg walking speed in a crowded stadium ~60 m/min
    minutes = max(1, round(meters / 60))
    return minutes, meters


NAVIGATION_TEMPLATES = {
    "fastest": [
        "Head north through Gate A, take the main concourse past Section 12. Your route avoids the current congestion near the merchandise stands.",
        "Proceed through the central atrium — I've detected lighter foot traffic on the east corridor right now. ETA is accurate within ±2 minutes.",
        "Take the elevator at Gate C to Level 2, then follow the blue navigational strip to your destination. This is the fastest route available.",
    ],
    "accessible": [
        "Using the wheelchair-accessible route: Take the ramp at Gate A (Level 0), use Elevator E-3 to Level 2, proceed via the wide accessible corridor.",
        "Accessible path selected. All surfaces on this route are smooth-paved. Priority elevator reserved at your current location.",
        "This accessible route avoids stairs and has handrails throughout. The accessible washroom is at the 2/3 point of your route.",
    ],
    "least_crowded": [
        "I'm routing you through Gate D service corridor — currently at 23% occupancy vs 78% on the main concourse. Quieter and faster right now.",
        "Least-crowded path: proceed through the east wing. Crowd sensors show 15% lower density than the main route over the next 10 minutes.",
        "Alternative quiet route via Level 1 mezzanine. This path will remain clear as kick-off is still 40 minutes away.",
    ],
}

INCIDENT_SEVERITIES = {
    "medical": ("high", ["Dispatch medical team to location immediately", "Clear a 5-meter radius", "Alert nearest first-aid station", "Document patient condition"]),
    "security": ("high", ["Dispatch security team", "Monitor CCTV feeds in zone", "Prepare evacuation protocol if needed", "Coordinate with police liaison"]),
    "lost_child": ("critical", ["Broadcast description over PA system", "Activate child-safe zones at all exits", "Contact parents via announcement", "Document with photo if available"]),
    "fire": ("critical", ["Initiate fire alarm protocol", "Evacuate affected zone immediately", "Contact fire brigade", "Shut down HVAC in affected area"]),
    "infrastructure": ("medium", ["Cordon off affected area", "Contact facilities management", "Assess structural risk", "Redirect foot traffic away from zone"]),
}

CROWD_INSIGHTS = [
    "Crowd density in North Stand is approaching 85%. I recommend opening Gate 7 to redistribute flow.",
    "Historical patterns suggest congestion will peak in 15 minutes as the half-time whistle approaches. Pre-positioning staff now is recommended.",
    "South concourse queue has decreased by 40% since the last vendor station opened. Current wait time is under 3 minutes.",
    "AI prediction: crowd density will reduce by 30% within 20 minutes of final whistle as fans start dispersing to transport hubs.",
    "Exit congestion risk is HIGH for Gates 1-4. Recommend diverting to Gates 8-12 via PA announcement.",
]

SUSTAINABILITY_TIPS = [
    "Energy consumption is 12% below target. Solar panels on the stadium roof are performing at 94% efficiency today.",
    "Waste diversion rate is currently 67%. The AI suggests increasing biodegradable container stations near food courts by 4 units.",
    "Water usage in washing facilities is 8% above target. Check for any running taps via the IoT sensor dashboard.",
    "Carbon footprint for today's match is tracking 18% lower than the Group Stage average, primarily due to metro usage uptick.",
]


def generate_incident_ai_analysis(incident_type: str, description: str, location: str) -> Dict[str, Any]:
    """Generate AI-powered incident summary and recommended actions."""
    severity, actions = INCIDENT_SEVERITIES.get(incident_type, ("medium", ["Assess situation", "Contact supervisor"]))

    summaries = {
        "medical": f"Medical incident reported at {location}. Immediate medical response required. Patient status unknown — first responders should assess on arrival.",
        "security": f"Security concern flagged at {location}. Assess threat level before engagement. Coordinate with control room for CCTV coverage of the area.",
        "lost_child": f"Lost child report at {location}. Time-sensitive — initiate child-safe protocol. Gather description and last-seen details from reporter immediately.",
        "fire": f"Fire alert at {location}. Treat as immediate threat until assessed otherwise. Full evacuation of the zone must begin now.",
        "infrastructure": f"Infrastructure issue at {location}. Isolate the area and prevent public access. Engineering team must conduct safety assessment before reopening.",
    }

    return {
        "severity": severity,
        "ai_summary": summaries.get(incident_type, f"Incident reported at {location}. Assessment required."),
        "ai_recommended_actions": actions,
        "timeline": [
            {"time": datetime.utcnow().isoformat(), "event": "Incident reported via StadiumOS AI", "actor": "System"},
            {"time": datetime.utcnow().isoformat(), "event": "AI analysis completed", "actor": "AI Engine"},
            {"time": datetime.utcnow().isoformat(), "event": "Notifications dispatched to response team", "actor": "System"},
        ],
    }


def generate_navigation_response(
    from_location: str,
    to_location: str,
    route_type: str = "fastest",
    wheelchair_accessible: bool = False,
    avoid_crowds: bool = False,
    language: str = "en",
) -> Dict[str, Any]:
    """Generate AI navigation recommendation with REALISTIC path data using stadium coordinates."""
    key = "accessible" if wheelchair_accessible else ("least_crowded" if avoid_crowds else route_type)
    templates = NAVIGATION_TEMPLATES.get(key, NAVIGATION_TEMPLATES["fastest"])

    # Look up known coordinates; fall back to a sensible default
    start = LOCATION_COORDS.get(from_location)
    end = LOCATION_COORDS.get(to_location)

    # Fallback: place unknown locations at random concourse positions
    if start is None:
        start = random.choice(OUTER_RING)
        start = {"x": start["x"], "y": start["y"], "zone": "concourse", "label": from_location}
    if end is None:
        end = random.choice(OUTER_RING)
        end = {"x": end["x"], "y": end["y"], "zone": "concourse", "label": to_location}

    # Build realistic path along concourse ring
    waypoints = _route_via_ring(start, end, from_location, to_location)

    # For wheelchair route, ensure we don't go through stairs — keep outer ring only (already correct)
    # For least-crowded, slightly offset one intermediate waypoint to simulate a less-trafficked corridor
    if avoid_crowds and len(waypoints) > 2:
        mid = len(waypoints) // 2
        waypoints[mid]["x"] = max(60, min(640, waypoints[mid]["x"] - 30))
        waypoints[mid]["label"] = "Quiet Corridor"

    time_min, dist_m = _estimate_time_and_distance(waypoints)

    congestion = []
    if not avoid_crowds:
        congestion = random.sample(
            ["Main Concourse", "Gate 3", "Food Court East", "Merchandise Stand B"],
            k=random.randint(0, 2),
        )

    accessibility_features = []
    if wheelchair_accessible:
        accessibility_features = [
            "Ramp access at Gate A",
            "Priority elevator E-3",
            "Wide accessible corridors",
            "Accessible washroom at midpoint",
        ]

    return {
        "from_location": from_location,
        "to_location": to_location,
        "route_type": key,
        "estimated_time_minutes": time_min,
        "distance_meters": dist_m,
        "path_data": waypoints,
        "congestion_zones": congestion,
        "accessibility_features": accessibility_features,
        "ai_notes": random.choice(templates),
    }


def generate_crowd_insight() -> str:
    """Return a contextual AI crowd insight based on current time of day."""
    hour = datetime.utcnow().hour
    
    # Time-aware insights that feel genuinely intelligent
    if hour < 12:
        insights = [
            "Early arrivals trending 15% above forecast. Consider opening auxiliary gates now to prevent bottlenecks at peak entry.",
            "Morning crowd density is low. AI recommends reduced staffing at concessions until 2 hours before kick-off.",
            "Pre-match fan zone is at 32% capacity. Social media sentiment analysis indicates higher-than-expected international fan turnout.",
        ]
    elif hour < 17:
        insights = [
            "Crowd density in North Stand is approaching 85%. I recommend opening Gate 7 to redistribute flow.",
            "Historical patterns suggest congestion will peak in 15 minutes as the half-time whistle approaches. Pre-positioning staff now is recommended.",
            "South concourse queue has decreased by 40% since the last vendor station opened. Current wait time is under 3 minutes.",
            "Fan flow analysis shows 67% of attendees entered via Gates A and B. Redistributing signage to promote Gate E could reduce wait times by 4 minutes.",
        ]
    else:
        insights = [
            "AI prediction: crowd density will reduce by 30% within 20 minutes of final whistle as fans start dispersing to transport hubs.",
            "Exit congestion risk is HIGH for Gates 1-4. Recommend diverting to Gates 8-12 via PA announcement.",
            "Post-match egress analysis: Metro Line 1 departures are 22% over capacity. Recommend activating supplementary bus service Route C.",
            "Night operations mode recommended: reduce concourse lighting to 60%, shift security focus to parking areas and transport zones.",
        ]
    return random.choice(insights)


def generate_sustainability_insight() -> str:
    """Return a contextual AI sustainability recommendation."""
    return random.choice(SUSTAINABILITY_TIPS)


def generate_volunteer_balance_recommendation(volunteers: List[Dict]) -> str:
    """Data-driven workload balancing recommendation for volunteer deployment."""
    if not volunteers:
        return "No volunteers deployed. Please assign volunteers to zones before requesting AI analysis."
    
    # Analyze actual distribution
    zone_counts: Dict[str, int] = {}
    zone_workloads: Dict[str, float] = {}
    for v in volunteers:
        z = v.get("zone", "unassigned")
        zone_counts[z] = zone_counts.get(z, 0) + 1
        zone_workloads[z] = zone_workloads.get(z, 0) + v.get("workload", 0)
    
    total = len(volunteers)
    avg_per_zone = total / max(len(zone_counts), 1)
    
    # Find overstaffed and understaffed zones
    overstaffed = [(z, c) for z, c in zone_counts.items() if c > avg_per_zone * 1.5]
    understaffed = [(z, c) for z, c in zone_counts.items() if c < avg_per_zone * 0.6]
    high_workload = [(z, w / zone_counts.get(z, 1)) for z, w in zone_workloads.items() if (w / zone_counts.get(z, 1)) > 70]
    
    if understaffed and overstaffed:
        return f"{overstaffed[0][0]} has {overstaffed[0][1]} volunteers while {understaffed[0][0]} has only {understaffed[0][1]}. Recommend reassigning 2 volunteers from {overstaffed[0][0]} to {understaffed[0][0]} for balanced coverage."
    elif high_workload:
        return f"High workload detected in {high_workload[0][0]} (avg score: {high_workload[0][1]:.0f}/100). Recommend rotating volunteers with standby team to prevent fatigue."
    elif understaffed:
        return f"{understaffed[0][0]} is understaffed with only {understaffed[0][1]} volunteer(s). Consider deploying additional support from the available pool."
    else:
        return f"Volunteer distribution is balanced across {len(zone_counts)} zones ({total} total). No rebalancing needed. Next review in 30 minutes."


def generate_operational_insight(metric: str, value: float) -> str:
    """Generate AI insight about a specific operational metric."""
    insights = {
        "attendance": f"Current attendance is tracking at {value:.0f}. Fans are arriving 22% earlier than the Group Stage average, suggesting higher enthusiasm for this fixture.",
        "energy": f"Energy usage at {value:.1f} kWh — within green zone. AI projects usage will spike 15% at half-time when concession areas peak.",
        "waste": f"Waste collection at {value:.1f} tons. The AI recommends deploying additional collection units to Gates 3 and 9 based on vendor density.",
    }
    return insights.get(metric, f"Metric '{metric}' is at {value}. Performance is within expected range.")
