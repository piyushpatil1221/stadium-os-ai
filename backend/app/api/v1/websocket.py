"""
WebSocket hub for real-time stadium updates.
Broadcasts crowd density, incidents, alerts, and volunteer updates to all
connected clients. Replaces the 10-15s polling interval with sub-second pushes.
"""
import asyncio
import json
import random
from datetime import datetime
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages active WebSocket connections grouped by user role."""

    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = {}  # role -> set of websockets
        self._all: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self._all.add(websocket)
        if role not in self._connections:
            self._connections[role] = set()
        self._connections[role].add(websocket)

    def disconnect(self, websocket: WebSocket):
        self._all.discard(websocket)
        for role_set in self._connections.values():
            role_set.discard(websocket)

    async def broadcast(self, message: dict):
        """Send a message to ALL connected clients."""
        data = json.dumps(message, default=str)
        dead = []
        for ws in self._all:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_to_roles(self, message: dict, roles: list[str]):
        """Send a message only to clients with specific roles."""
        data = json.dumps(message, default=str)
        dead = []
        for role in roles:
            for ws in self._connections.get(role, set()):
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    @property
    def active_count(self) -> int:
        return len(self._all)


manager = ConnectionManager()


# ─── Simulated crowd density updates ─────────────────────────────────────────
ZONES = ["north", "south", "east", "west", "vip"]
_zone_density: Dict[str, int] = {z: random.randint(30, 80) for z in ZONES}


def _tick_crowd_data() -> dict:
    """Simulate small crowd density changes each tick."""
    for zone in ZONES:
        delta = random.randint(-3, 4)
        _zone_density[zone] = max(5, min(100, _zone_density[zone] + delta))
    return {
        "type": "crowd_update",
        "timestamp": datetime.utcnow().isoformat(),
        "zones": [
            {
                "zone": z,
                "density": _zone_density[z],
                "status": "critical" if _zone_density[z] >= 85 else (
                    "busy" if _zone_density[z] >= 65 else "normal"
                ),
            }
            for z in ZONES
        ],
    }


async def crowd_simulation_loop():
    """Background task that pushes crowd updates every 5 seconds."""
    while True:
        await asyncio.sleep(5)
        if manager.active_count > 0:
            update = _tick_crowd_data()
            await manager.broadcast(update)


# ─── Public helpers for other routers to push events ─────────────────────────

async def push_incident_event(incident_data: dict):
    """Call this when a new incident is created to push it live."""
    await manager.broadcast_to_roles(
        {"type": "incident_update", "data": incident_data},
        roles=["staff", "organizer", "volunteer"],
    )


async def push_alert(alert_data: dict):
    """Call this to push a stadium-wide alert to all connected clients."""
    await manager.broadcast({"type": "alert", "data": alert_data})


# ─── WebSocket endpoint ──────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    """
    WebSocket endpoint with JWT authentication.
    Connect with: ws://host/api/v1/ws?token=<jwt>
    """
    # Authenticate
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    payload = decode_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub", "unknown")

    # We need the user's role — decode it from the DB or embed in token.
    # For simplicity, we'll accept a role query param as well, but validate via token.
    # In production, you'd look up the user from DB here.
    role = payload.get("role", "fan")

    await manager.connect(websocket, role)
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connected",
            "user_id": user_id,
            "role": role,
            "active_connections": manager.active_count,
        }))

        # Keep connection alive, listen for client messages
        while True:
            data = await websocket.receive_text()
            # Client can send ping or request specific data
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
