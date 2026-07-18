import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import auth, crowds, incidents, navigator, transport, matches, volunteers, sustainability
from app.api.v1.websocket import router as ws_router, crowd_simulation_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan manager replacing deprecated @app.on_event."""
    # ── Startup ──
    # Create tables (dev convenience — Alembic handles this in production)
    Base.metadata.create_all(bind=engine)

    # Seed database with initial data on first run
    from app.services.seed import seed_database
    try:
        seed_database()
    except Exception as e:
        print(f"Seed skipped or failed: {e}")

    # Start the real-time crowd simulation background task
    simulation_task = asyncio.create_task(crowd_simulation_loop())

    yield  # ── Application is running ──

    # ── Shutdown ──
    simulation_task.cancel()
    try:
        await simulation_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered stadium operations platform for FIFA World Cup 2026",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.github\.io|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(crowds.router, prefix="/api/v1")
app.include_router(incidents.router, prefix="/api/v1")
app.include_router(navigator.router, prefix="/api/v1")
app.include_router(transport.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")
app.include_router(volunteers.router, prefix="/api/v1")
app.include_router(sustainability.router, prefix="/api/v1")
app.include_router(sustainability.router_alerts, prefix="/api/v1")

# Register WebSocket router
app.include_router(ws_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"app": settings.APP_NAME, "status": "operational", "version": "2.0.0"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "environment": settings.APP_ENV}
