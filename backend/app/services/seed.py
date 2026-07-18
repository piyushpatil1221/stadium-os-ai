"""Seed script to populate the database with realistic FIFA World Cup 2026 mock data."""
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.models import User, Match, Crowd, Incident, Transport, Volunteer, Alert, Sustainability
from app.core.security import get_password_hash


def seed_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded.")
            return

        # --- Users ---
        users_data = [
            {"email": "admin@stadiumos.ai", "full_name": "Admin User", "role": "admin", "password": "admin1234"},
            {"email": "organizer@stadiumos.ai", "full_name": "Maria Santos", "role": "organizer", "password": "organizer1234"},
            {"email": "staff@stadiumos.ai", "full_name": "James Walker", "role": "staff", "password": "staff1234"},
            {"email": "volunteer@stadiumos.ai", "full_name": "Priya Sharma", "role": "volunteer", "password": "volunteer1234"},
            {"email": "fan@stadiumos.ai", "full_name": "Carlos Mendez", "role": "fan", "password": "fan12345"},
        ]
        users = []
        for ud in users_data:
            user = User(
                email=ud["email"],
                full_name=ud["full_name"],
                role=ud["role"],
                hashed_password=get_password_hash(ud["password"]),
            )
            db.add(user)
            users.append(user)
        db.flush()

        # --- Matches ---
        matches_data = [
            {"home": "United States", "home_code": "USA", "away": "Mexico", "away_code": "MEX", "stadium": "SoFi Stadium", "city": "Los Angeles", "country": "USA", "round": "Group C", "home_score": 2, "away_score": 1, "status": "live", "days_offset": 0},
            {"home": "Brazil", "home_code": "BRA", "away": "Argentina", "away_code": "ARG", "stadium": "AT&T Stadium", "city": "Dallas", "country": "USA", "round": "Quarter Final", "home_score": 0, "away_score": 0, "status": "scheduled", "days_offset": 2},
            {"home": "France", "home_code": "FRA", "away": "England", "away_code": "ENG", "stadium": "MetLife Stadium", "city": "New York", "country": "USA", "round": "Semi Final", "home_score": 3, "away_score": 2, "status": "completed", "days_offset": -1},
            {"home": "Germany", "home_code": "GER", "away": "Spain", "away_code": "ESP", "stadium": "Estadio Azteca", "city": "Mexico City", "country": "Mexico", "round": "Group A", "home_score": 1, "away_score": 1, "status": "completed", "days_offset": -2},
            {"home": "Portugal", "home_code": "POR", "away": "Morocco", "away_code": "MAR", "stadium": "BC Place", "city": "Vancouver", "country": "Canada", "round": "Group B", "home_score": 0, "away_score": 0, "status": "scheduled", "days_offset": 3},
        ]
        for md in matches_data:
            match = Match(
                home_team=md["home"], home_team_code=md["home_code"],
                away_team=md["away"], away_team_code=md["away_code"],
                home_score=md["home_score"], away_score=md["away_score"],
                stadium=md["stadium"], city=md["city"], country=md["country"],
                kickoff_time=datetime.utcnow() + timedelta(days=md["days_offset"], hours=2),
                status=md["status"], round=md["round"],
                attendance=random.randint(60000, 72000) if md["status"] != "scheduled" else None,
                capacity=72000,
            )
            db.add(match)

        # --- Crowd Data ---
        zones = ["North Stand", "South Stand", "East Wing", "West Wing", "VIP Lounge", "Main Concourse"]
        for zone in zones:
            for section in ["A", "B", "C"]:
                crowd = Crowd(
                    zone=zone, section=section,
                    current_count=random.randint(1500, 4800),
                    capacity=5000,
                    density_percent=round(random.uniform(30, 95), 1),
                    queue_length=random.randint(0, 200),
                    wait_time_minutes=random.randint(0, 15),
                    status=random.choice(["normal", "normal", "normal", "busy", "critical"]),
                )
                db.add(crowd)

        # --- Incidents ---
        incidents_data = [
            {"title": "Fan Collapsed in Section B12", "desc": "An elderly fan has collapsed near the food court. Medical assistance required immediately.", "type": "medical", "severity": "high", "location": "Section B12, North Stand", "zone": "North Stand", "status": "in_progress"},
            {"title": "Unauthorized Entry Attempt at Gate 6", "desc": "Security reports a group attempting to enter without valid tickets at Gate 6.", "type": "security", "severity": "medium", "location": "Gate 6", "zone": "West Wing", "status": "open"},
            {"title": "Lost Child – Section 22", "desc": "Child approximately 7 years old, wearing a red jersey, found alone near Section 22. Parents have not been located.", "type": "lost_child", "severity": "critical", "location": "Section 22, East Wing", "zone": "East Wing", "status": "in_progress"},
            {"title": "Smoke Detected – Kitchen Area", "desc": "Smoke alarm triggered in kitchen area of Gate 3 concessions. Fire brigade alerted.", "type": "fire", "severity": "critical", "location": "Gate 3 Concessions Kitchen", "zone": "South Stand", "status": "in_progress"},
            {"title": "Broken Escalator – Level 2 East", "desc": "Main escalator on Level 2 East has malfunctioned. Fans being directed to stairways.", "type": "infrastructure", "severity": "low", "location": "Level 2 East Escalator", "zone": "East Wing", "status": "resolved"},
        ]
        for inc_data in incidents_data:
            incident = Incident(
                title=inc_data["title"], description=inc_data["desc"],
                incident_type=inc_data["type"], severity=inc_data["severity"],
                status=inc_data["status"], location=inc_data["location"],
                zone=inc_data["zone"],
                ai_summary=f"AI Analysis: {inc_data['desc'][:80]}...",
                ai_recommended_actions=["Dispatch response team", "Document for incident log", "Monitor situation"],
                timeline=[{"time": datetime.utcnow().isoformat(), "event": "Incident opened", "actor": "System"}],
                reporter_id=users[4].id,
            )
            db.add(incident)

        # --- Transport ---
        transport_data = [
            {"type": "metro", "name": "Line 1 – Stadium Express", "status": "operational", "load": 1800, "cap": 2000, "next_arrival": 3, "freq": 5},
            {"type": "metro", "name": "Line 2 – City Center", "status": "delayed", "load": 1200, "cap": 2000, "next_arrival": 12, "freq": 8},
            {"type": "metro", "name": "Line 3 – Airport Link", "status": "operational", "load": 600, "cap": 1500, "next_arrival": 6, "freq": 10},
            {"type": "bus", "name": "Shuttle Route A", "status": "operational", "load": 45, "cap": 50, "next_arrival": 4, "freq": 15},
            {"type": "bus", "name": "Shuttle Route B", "status": "disrupted", "load": 0, "cap": 50, "next_arrival": None, "freq": 15},
            {"type": "parking", "name": "Lot A – VIP", "status": "full", "load": 500, "cap": 500, "next_arrival": None, "freq": None, "spaces": 0},
            {"type": "parking", "name": "Lot B – General", "status": "operational", "load": 800, "cap": 1200, "next_arrival": None, "freq": None, "spaces": 400},
            {"type": "parking", "name": "Lot C – Overflow", "status": "operational", "load": 200, "cap": 800, "next_arrival": None, "freq": None, "spaces": 600},
            {"type": "rideshare", "name": "Uber/Lyft Zone", "status": "operational", "load": 0, "cap": 100, "eta": 8},
        ]
        for td in transport_data:
            load_pct = round((td["load"] / td["cap"]) * 100, 1)
            t = Transport(
                type=td["type"], name=td["name"], status=td["status"],
                current_load=td["load"], capacity=td["cap"], load_percent=load_pct,
                next_arrival_minutes=td.get("next_arrival"),
                frequency_minutes=td.get("freq"),
                available_spaces=td.get("spaces"),
                eta_minutes=td.get("eta"),
            )
            db.add(t)

        # --- Volunteers ---
        volunteer_roles = ["crowd_control", "medical_assist", "info_desk", "accessibility_aid", "transport_guide"]
        volunteer_zones = zones
        for i in range(20):
            v = Volunteer(
                user_id=users[3].id if i == 0 else None,
                badge_number=f"VOL-{1000+i}",
                zone=random.choice(volunteer_zones),
                role=random.choice(volunteer_roles),
                is_checked_in=random.choice([True, True, False]),
                workload_score=random.randint(10, 90),
                status=random.choice(["available", "busy", "break"]),
                languages=random.sample(["English", "Spanish", "French", "Portuguese", "Arabic", "Hindi"], k=random.randint(1, 3)),
                skills=random.sample(["First Aid", "CPR", "Crowd Management", "Languages", "Accessibility"], k=random.randint(1, 3)),
            )
            db.add(v)

        # --- Alerts ---
        alerts_data = [
            {"title": "Weather Advisory", "msg": "Strong winds expected at 21:00. Temporary structures secured. Fan areas remain safe.", "type": "weather", "severity": "warning", "zone": None},
            {"title": "Crowd Density Alert", "msg": "North Stand approaching capacity. Gates 1-3 now directing fans to Gates 8-10.", "type": "crowd", "severity": "danger", "zone": "North Stand"},
            {"title": "Metro Line 2 Delay", "msg": "30-minute delay on Metro Line 2 due to signal failure. Alternative: Shuttle Route A.", "type": "transport", "severity": "warning", "zone": None},
            {"title": "Medical Team Deployed", "msg": "Medical response active in Section B12. Area temporarily restricted.", "type": "medical", "severity": "danger", "zone": "North Stand"},
        ]
        for ad in alerts_data:
            alert = Alert(
                title=ad["title"], message=ad["msg"],
                alert_type=ad["type"], severity=ad["severity"],
                zone=ad["zone"], is_active=True,
            )
            db.add(alert)

        # --- Sustainability ---
        metrics = [
            ("energy", 48200, "kWh", 55000),
            ("waste", 12.4, "tons", 15.0),
            ("water", 8800, "liters", 9500),
            ("carbon", 22.1, "kg CO2", 28.0),
        ]
        for metric_type, value, unit, target in metrics:
            s = Sustainability(metric_type=metric_type, value=value, unit=unit, target=target)
            db.add(s)

        db.commit()
        print("[OK] Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
